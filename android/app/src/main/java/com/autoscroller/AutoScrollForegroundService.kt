package com.autoscroller

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.random.Random

/**
 * 前台服务：持有常驻通知，负责「随机等待 -> 模拟上滑」的主循环。
 */
class AutoScrollForegroundService : Service() {

    companion object {
        const val ACTION_START = "com.autoscroller.action.START"
        const val ACTION_STOP = "com.autoscroller.action.STOP"
        const val EXTRA_MIN_DELAY = "minDelaySeconds"
        const val EXTRA_MAX_DELAY = "maxDelaySeconds"

        private const val CHANNEL_ID = "auto_scroll_channel"
        private const val NOTIFICATION_ID = 1001
    }

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private var loopJob: Job? = null
    private var minDelaySeconds = 20
    private var maxDelaySeconds = 40

    override fun onCreate() {
        super.onCreate()
        ensureNotificationChannel()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            // 通过 startForegroundService 触达时也必须先调用 startForeground，随后立即停止
            startAsForeground()
            stopLoop()
            stopSelf()
            return START_NOT_STICKY
        }

        minDelaySeconds = intent?.getIntExtra(EXTRA_MIN_DELAY, AutoScrollState.minDelaySeconds)
            ?: AutoScrollState.minDelaySeconds
        maxDelaySeconds = intent?.getIntExtra(EXTRA_MAX_DELAY, AutoScrollState.maxDelaySeconds)
            ?: AutoScrollState.maxDelaySeconds
        if (minDelaySeconds > maxDelaySeconds) {
            val tmp = minDelaySeconds
            minDelaySeconds = maxDelaySeconds
            maxDelaySeconds = tmp
        }
        AutoScrollState.minDelaySeconds = minDelaySeconds
        AutoScrollState.maxDelaySeconds = maxDelaySeconds

        startAsForeground()

        if (loopJob?.isActive != true) {
            AutoScrollState.running = true
            AutoScrollState.swipeCount = 0
            AutoScrollModule.emitStatus()
            startLoop()
        }
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        AutoScrollState.running = false
        loopJob?.cancel()
        loopJob = null
        AutoScrollModule.emitStatus()
        super.onDestroy()
    }

    private fun startLoop() {
        loopJob = scope.launch { scrollLoop() }
    }

    private suspend fun scrollLoop() {
        while (AutoScrollState.running) {
            val waitSeconds = Random.nextInt(minDelaySeconds, maxDelaySeconds + 1)
            delay(waitSeconds * 1000L)
            if (!AutoScrollState.running) break

            if (AutoScrollAccessibilityService.instance == null) {
                AutoScrollState.running = false
                AutoScrollModule.emitStatus(stoppedReason = "无障碍服务未启用，自动刷已停止")
                stopSelf()
                break
            }

            val swiped = performSwipe()
            if (!AutoScrollState.running) break
            if (swiped) {
                AutoScrollState.swipeCount += 1
                AutoScrollModule.emitStatus()
                updateNotification()
            } else {
                // 手势失败时等待 1 秒后重试，避免高频无效循环
                delay(1000L)
            }
        }
    }

    private suspend fun performSwipe(): Boolean =
        suspendCancellableCoroutine { continuation ->
            val service = AutoScrollAccessibilityService.instance
            if (service == null) {
                continuation.resume(false)
                return@suspendCancellableCoroutine
            }
            val dispatched = service.swipeUp { success ->
                if (continuation.isActive) {
                    continuation.resume(success)
                }
            }
            if (!dispatched && continuation.isActive) {
                continuation.resume(false)
            }
        }

    private fun stopLoop() {
        AutoScrollState.running = false
        AutoScrollModule.emitStatus()
        loopJob?.cancel()
        loopJob = null
    }

    private fun startAsForeground() {
        val notification = buildNotification()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE,
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    private fun buildNotification(): Notification {
        val contentIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_IMMUTABLE,
        )
        val stopIntent = Intent(this, AutoScrollForegroundService::class.java)
            .setAction(ACTION_STOP)
            .let { actionIntent ->
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    PendingIntent.getForegroundService(this, 1, actionIntent, PendingIntent.FLAG_IMMUTABLE)
                } else {
                    PendingIntent.getService(this, 1, actionIntent, PendingIntent.FLAG_IMMUTABLE)
                }
            }

        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
        }
        return builder
            .setContentTitle("自动刷视频运行中")
            .setContentText("已滑动 ${AutoScrollState.swipeCount} 次")
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setOngoing(true)
            .setContentIntent(contentIntent)
            .addAction(0, "停止", stopIntent)
            .build()
    }

    private fun updateNotification() {
        val manager = getSystemService(NotificationManager::class.java) ?: return
        manager.notify(NOTIFICATION_ID, buildNotification())
    }

    private fun ensureNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val channel = NotificationChannel(
            CHANNEL_ID,
            "自动刷视频",
            NotificationManager.IMPORTANCE_LOW,
        )
        channel.description = "自动刷视频运行状态通知"
        getSystemService(NotificationManager::class.java)?.createNotificationChannel(channel)
    }
}
