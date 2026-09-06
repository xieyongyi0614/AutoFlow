package com.autoscroller

import android.app.Activity
import android.content.ComponentName
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class AutoScrollModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    init {
        instanceRef = this
    }

    companion object {
        const val NAME = "AutoScroll"
        const val EVENT_STATUS_CHANGE = "AutoScrollStatusChange"
        const val CODE_NO_ACCESSIBILITY = "NO_ACCESSIBILITY"

        private const val REQUEST_POST_NOTIFICATIONS = 2001
        private const val MAX_DELAY_SECONDS = 3600

        @Volatile
        private var instanceRef: AutoScrollModule? = null

        /**
         * 供前台服务在任意线程调用，向 JS 侧同步运行状态。
         */
        fun emitStatus(stoppedReason: String? = null) {
            instanceRef?.emitStatusInternal(stoppedReason)
        }
    }

    override fun getName(): String = NAME

    private fun emitStatusInternal(stoppedReason: String?) {
        val context = reactApplicationContext
        if (!context.hasActiveReactInstance()) return
        val params = Arguments.createMap().apply {
            putBoolean("running", AutoScrollState.running)
            putInt("count", AutoScrollState.swipeCount)
            putBoolean("accessibilityEnabled", isAccessibilityServiceEnabled())
            if (stoppedReason != null) {
                putString("stoppedReason", stoppedReason)
            }
        }
        try {
            context.runOnNativeModulesQueueThread {
                try {
                    context
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                        .emit(EVENT_STATUS_CHANGE, params)
                } catch (ignored: Exception) {
                    // JS 侧已卸载，事件投递失败可忽略
                }
            }
        } catch (ignored: Exception) {
            // React 实例销毁中的竞态，可忽略
        }
    }

    private fun isAccessibilityServiceEnabled(): Boolean {
        val self = ComponentName(reactApplicationContext, AutoScrollAccessibilityService::class.java)
        val enabledServices = Settings.Secure.getString(
            reactApplicationContext.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES,
        ) ?: return false
        return enabledServices.split(':').any { entry ->
            ComponentName.unflattenFromString(entry.trim()) == self
        }
    }

    @ReactMethod
    fun start(minDelaySeconds: Double, maxDelaySeconds: Double, promise: Promise) {
        if (!isAccessibilityServiceEnabled()) {
            promise.reject(CODE_NO_ACCESSIBILITY, "无障碍服务未开启，请先在系统设置中授权")
            return
        }

        val min = minDelaySeconds.toInt().coerceIn(1, MAX_DELAY_SECONDS)
        val max = maxDelaySeconds.toInt().coerceIn(1, MAX_DELAY_SECONDS)
        AutoScrollState.minDelaySeconds = minOf(min, max)
        AutoScrollState.maxDelaySeconds = maxOf(min, max)

        requestNotificationPermissionIfNeeded()

        val intent = Intent(reactApplicationContext, AutoScrollForegroundService::class.java)
            .setAction(AutoScrollForegroundService.ACTION_START)
            .putExtra(AutoScrollForegroundService.EXTRA_MIN_DELAY, AutoScrollState.minDelaySeconds)
            .putExtra(AutoScrollForegroundService.EXTRA_MAX_DELAY, AutoScrollState.maxDelaySeconds)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            reactApplicationContext.startForegroundService(intent)
        } else {
            reactApplicationContext.startService(intent)
        }
        promise.resolve(true)
    }

    @ReactMethod
    fun stop(promise: Promise) {
        AutoScrollState.running = false
        val stopped = reactApplicationContext.stopService(
            Intent(reactApplicationContext, AutoScrollForegroundService::class.java),
        )
        emitStatusInternal(null)
        promise.resolve(stopped)
    }

    @ReactMethod
    fun getStatus(promise: Promise) {
        promise.resolve(
            Arguments.createMap().apply {
                putBoolean("running", AutoScrollState.running)
                putInt("count", AutoScrollState.swipeCount)
                putBoolean("accessibilityEnabled", isAccessibilityServiceEnabled())
            },
        )
    }

    @ReactMethod
    fun isAccessibilityEnabled(promise: Promise) {
        promise.resolve(isAccessibilityServiceEnabled())
    }

    @ReactMethod
    fun openAccessibilitySetting(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("OPEN_SETTINGS_FAILED", "无法打开系统无障碍设置页", e)
        }
    }

    private fun requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return
        val activity: Activity? = reactApplicationContext.getCurrentActivity()
        if (activity == null ||
            activity.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) ==
            PackageManager.PERMISSION_GRANTED
        ) {
            return
        }
        activity.requestPermissions(
            arrayOf(android.Manifest.permission.POST_NOTIFICATIONS),
            REQUEST_POST_NOTIFICATIONS,
        )
    }
}
