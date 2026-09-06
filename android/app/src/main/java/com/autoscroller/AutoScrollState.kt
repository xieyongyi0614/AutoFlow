package com.autoscroller

/**
 * 进程内共享的运行状态：前台服务与 RN 桥接模块读写同一份。
 */
object AutoScrollState {
    @Volatile
    var running: Boolean = false

    @Volatile
    var swipeCount: Int = 0

    @Volatile
    var minDelaySeconds: Int = 20

    @Volatile
    var maxDelaySeconds: Int = 40
}
