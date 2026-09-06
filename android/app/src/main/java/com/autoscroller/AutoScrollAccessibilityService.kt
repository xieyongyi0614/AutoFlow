package com.autoscroller

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import kotlin.random.Random

/**
 * 无障碍服务：通过 Gesture API 在当前屏幕上模拟手指上滑。
 * V1 不读取窗口内容，只使用 dispatchGesture 能力。
 */
class AutoScrollAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "AutoScrollA11y"

        @Volatile
        var instance: AutoScrollAccessibilityService? = null
            private set

        val isActive: Boolean
            get() = instance != null
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        Log.i(TAG, "Accessibility service connected")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // V1 不解析窗口内容，仅使用手势能力
    }

    override fun onInterrupt() {}

    override fun onDestroy() {
        if (instance === this) {
            instance = null
        }
        super.onDestroy()
    }

    /**
     * 从屏幕下方 70%~80% 高度处向上滑动到 20%~30% 高度处，
     * 时长 400~800ms，具体参数每次随机。
     *
     * @return dispatchGesture 是否被系统接受；实际完成结果通过回调返回
     */
    fun swipeUp(onFinished: (Boolean) -> Unit): Boolean {
        val metrics = resources.displayMetrics
        val screenWidth = metrics.widthPixels
        val screenHeight = metrics.heightPixels

        val startX = screenWidth * 0.5f
        val startY = screenHeight * (0.70f + Random.nextFloat() * 0.10f)
        val endY = screenHeight * (0.20f + Random.nextFloat() * 0.10f)
        val durationMs = 400L + Random.nextLong(401L)

        val path = Path().apply {
            moveTo(startX, startY)
            lineTo(startX, endY)
        }
        val stroke = GestureDescription.StrokeDescription(path, 0L, durationMs)
        val gesture = GestureDescription.Builder().addStroke(stroke).build()

        return dispatchGesture(
            gesture,
            object : GestureResultCallback() {
                override fun onCompleted(gestureDescription: GestureDescription?) {
                    onFinished(true)
                }

                override fun onCancelled(gestureDescription: GestureDescription?) {
                    Log.w(TAG, "Swipe gesture cancelled")
                    onFinished(false)
                }
            },
            null,
        )
    }
}
