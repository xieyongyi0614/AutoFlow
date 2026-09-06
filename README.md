# AutoScroller — Android 自动刷视频工具 V1

个人使用的 Android 自动刷视频工具：通过 AccessibilityService 模拟真实手指上滑手势，
在随机间隔下自动浏览短视频内容，减少重复手动滑动操作。

技术栈：**React Native 0.87 (TypeScript) + pnpm · Zustand · AsyncStorage · Kotlin Native Module · AccessibilityService · Foreground Service**

## 主要能力

- **模拟真实上滑**：通过 Android Gesture API（`dispatchGesture`）模拟手指上滑，起点、终点、滑动时长均在范围内随机，动作更接近真人操作
- **随机间隔循环**：每次滑动前在配置区间内随机等待（默认 20~40 秒，可配置 1~600 秒），避免机械式固定节奏
- **后台稳定运行**：前台服务保活，常驻通知实时显示运行状态与已滑动次数，通知栏可直接停止
- **一键开始/停止**：开始前自动校验无障碍权限，未开启时引导跳转系统设置；无障碍服务被关闭时自动停止并提示
- **实时状态同步**：滑动次数、运行状态通过原生事件实时推送到界面
- **配置持久化**：等待时间通过 AsyncStorage 保存，重启 App 后保留（最小值大于最大值时自动对调）
- **CI/CD**：GitHub Actions 自动检查、构建并发布 APK（见下文）

## Native Module API

| JS 调用 | 说明 |
| --- | --- |
| `AutoScroll.start(minDelay, maxDelay)` | 校验无障碍权限 → 启动前台服务 → 进入自动循环 |
| `AutoScroll.stop()` | 停止循环、关闭服务 |
| `AutoScroll.getStatus()` | 返回 `{running, count, accessibilityEnabled}` |
| `AutoScroll.openAccessibilitySetting()` | 跳转系统无障碍设置页 |
| 事件 `AutoScrollStatusChange` | 原生 → JS 实时推送 `{running, count, stoppedReason?}` |

## 开发

环境要求：Node 18+、pnpm、JDK 17、Android SDK（本地通过 `ANDROID_HOME` 或 `android/local.properties` 指定）。

```sh
pnpm install          # 安装依赖（.npmrc 已配置 node-linker=hoisted，pnpm 使用 RN 的必要配置）
pnpm start            # 启动 Metro
pnpm run android      # 编译并安装到设备/模拟器（debug 包需连接 Metro）
pnpm run typecheck    # TypeScript 检查
pnpm run lint         # ESLint
pnpm test             # Jest 单元测试
```

或直接构建 APK：

```sh
cd android && ./gradlew assembleDebug    # 调试包
cd android && ./gradlew assembleRelease  # 独立安装包（自带 JS bundle，无需连接电脑）
```

## CI/CD

工作流定义在 [.github/workflows/android.yml](.github/workflows/android.yml)：

| 触发条件 | 行为 |
| --- | --- |
| Push / PR 到 `main`，或手动触发 | Typecheck + ESLint + Jest + 构建 Debug APK（7 天有效的 Artifacts） |
| 推送 `v*` 标签 | 构建 Release APK 并自动创建 GitHub Release，附上 `AutoScroller-<版本>.apk` 与变更日志 |

发布新版本的流程：

```sh
git tag v0.1.0
git push origin v0.1.0
```

推送标签后，在仓库的 **Actions** 页可查看构建进度，完成后在 **Releases** 页下载 APK。

## 使用步骤

1. 安装并打开 App，首页提示「无障碍权限：未开启」时点击「去开启无障碍权限」，
   在系统设置中找到 **AutoScroller / 自动刷视频** 并授权。
2. （Android 13+）允许通知权限，用于前台服务常驻通知。
3. 按需设置最小 / 最大等待秒数（失焦或回车时保存）。
4. 打开目标视频 App，切回本工具点击「开始自动刷」，再切回视频 App 即可。
5. 停止：回到本工具点「停止」，或下拉通知栏点「停止」。

## V1 边界（未实现）

智能识别（OCR/AI 视觉）、页面识别（视频/广告/弹窗判断）、自动打开 App / 签到、
多平台（抖音/快手/小红书）模式 —— 均按规划延期至 V2/V3。

## 注意事项

- 仅用于个人设备上的自动化操作学习与研究，请遵守目标应用的服务条款与当地法律法规。
- 无障碍服务被系统或用户关闭时，前台服务会自动停止并通过 App 与事件提示。
- 服务为 `START_NOT_STICKY`：进程被系统杀死后不会自动重启，需手动重新开始。
