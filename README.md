# AutoScroller — Android 自动刷视频工具 V1

个人使用的 Android 自动刷视频工具：通过 AccessibilityService 模拟真实手指上滑手势，
在随机间隔下自动浏览短视频内容，减少重复手动滑动。

技术栈：**React Native 0.87 (TypeScript) + pnpm · Zustand · AsyncStorage · Kotlin Native Module · AccessibilityService · Foreground Service**

## 功能（V1）

- 首页展示运行状态、已滑动次数、无障碍权限状态
- 可配置随机等待时间区间（默认 20~40 秒，范围 1~600 秒）
- 一键开始 / 停止；停止也可在系统通知栏点击「停止」
- 自动循环：随机等待 → 模拟上滑（起点 Y 70%~80%，终点 Y 20%~30%，时长 400~800ms，参数每次随机）
- 前台服务保活，常驻通知实时显示已滑动次数
- 配置通过 AsyncStorage 持久化，重启 App 后保留
- JS 侧通过原生事件实时同步运行状态与滑动次数

## 项目结构

```
src
├── pages/Home.tsx                  # 首页
├── components/
│   ├── StartButton.tsx             # 主/次按钮
│   └── StatusCard.tsx              # 状态卡片
├── hooks/useAutoScroll.ts          # 状态订阅、开始/停止逻辑
├── services/AutoScrollNative.ts    # Native Module JS 封装 + 事件订阅
└── store/
    ├── autoScrollStore.ts          # Zustand 状态 + AsyncStorage 持久化
    └── delayConfig.ts              # 等待时间校验/钳制（纯函数，可测）
android/app/src/main/java/com/autoscroller
├── AutoScrollModule.kt                  # RN 桥接：start/stop/getStatus/...
├── AutoScrollPackage.kt                 # RN Package 注册
├── AutoScrollAccessibilityService.kt    # 无障碍服务：dispatchGesture 模拟上滑
├── AutoScrollForegroundService.kt       # 前台服务：随机等待 + 滑动主循环
└── AutoScrollState.kt                   # 进程内共享运行状态
```

## Native Module API

| JS 调用 | 说明 |
| --- | --- |
| `AutoScroll.start(minDelay, maxDelay)` | 校验无障碍权限 → 启动前台服务 → 进入循环 |
| `AutoScroll.stop()` | 停止循环、关闭服务 |
| `AutoScroll.getStatus()` | 返回 `{running, count, accessibilityEnabled}` |
| `AutoScroll.openAccessibilitySetting()` | 跳转系统无障碍设置页 |
| 事件 `AutoScrollStatusChange` | 原生 → JS 实时推送 `{running, count, stoppedReason?}` |

## 开发

环境要求：Node 18+、pnpm、JDK 17、Android SDK（已配置 `ANDROID_HOME`）。

```sh
pnpm install          # 安装依赖（本项目使用 pnpm，.npmrc 已配置 node-linker=hoisted）
pnpm start            # 启动 Metro
pnpm run android      # 编译并安装到设备/模拟器
pnpm run typecheck    # TypeScript 检查
pnpm run lint         # ESLint
pnpm test             # Jest 单元测试
```

或直接构建 APK：

```sh
cd android && ./gradlew assembleDebug
# 产物：android/app/build/outputs/apk/debug/app-debug.apk
```

## 使用步骤

1. 安装并打开 App，首页提示「无障碍权限：未开启」时点击「去开启无障碍权限」，
   在系统设置中找到 **AutoScroller / 自动刷视频** 并授权。
2. （Android 13+）允许通知权限，用于前台服务常驻通知。
3. 按需设置最小 / 最大等待秒数（失焦或回车时保存，最小值大于最大值会自动对调）。
4. 打开目标视频 App，切回本工具点击「开始自动刷」，再切回视频 App 即可。
5. 停止：回到本工具点「停止」，或下拉通知栏点「停止」。

## V1 边界（未实现）

智能识别（OCR/AI 视觉）、页面识别（视频/广告/弹窗判断）、自动打开 App / 签到、
多平台（抖音/快手/小红书）模式 —— 均按规划延期至 V2/V3。

## 注意事项

- 仅用于个人设备上的自动化操作学习与研究，请遵守目标应用的服务条款与当地法律法规。
- 无障碍服务被系统或用户关闭时，前台服务会自动停止并通过 App 与事件提示。
- 服务为 `START_NOT_STICKY`：进程被系统杀死后不会自动重启，需手动重新开始。
