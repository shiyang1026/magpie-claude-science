# Claude Science for Magpie

[English](README.md) · 简体中文

在 Claude Science 中使用 Magpie 的模型，保留原来的 macOS App 图标。在 **Magpie → Agent → Claude Science** 中选择模型，然后照常打开 Science。

**实验版。** 包含 Agent 插件、限定作用范围的 middleware，以及需要明确安装的后台服务，无需 CSP。已验证 Science **0.1.60**、Magpie **0.1.1219**。

## 快速开始

需要 macOS、官方发行的 Node.js 22+，以及已安装的 Claude Science 和 Magpie。启动 Magpie，启用至少一个模型，在本仓库目录中执行：

```sh
npm ci --ignore-scripts
node src/cli.js install
```

按提示选择模型。无人值守安装时，用 `--model` 指定 Magpie 模型列表中的 ID。安装器读取 Magpie 网关端口，并选择空闲的本地端口；更多选项见 `node src/cli.js --help`。

**仅在 Magpie 中添加插件，不能完成全部安装。** 安装器配置 macOS LaunchAgent，把运行文件、生产依赖及 Node 复制到独立版本目录。后台运行不再依赖 checkout 或 npm 缓存。部分 Homebrew Node 依赖外部动态库，会被拒绝，需改用官方 Node。

打开原来的 **Claude Science.app**。首次 “Sign in” 仅确认本地浏览器会话，无需登录 Anthropic。保持 Magpie 运行，在其 Agent 页面切换模型。

## 管理

```sh
node src/cli.js doctor
node src/cli.js restart
node src/cli.js upgrade    # 从更新后的源码或软件包执行
node src/cli.js rollback   # 恢复上一个托管运行版本
node src/cli.js uninstall  # 恢复原配置，保留会话数据
```

执行上述生命周期操作前，请先结束正在运行的 Science 任务。升级保留本地身份与会话，启动失败时恢复旧服务。早期依赖源码目录的版本可以通过 `upgrade` 迁移；`rollback` 需要已有上一份托管版本。

## 工作方式

```text
Claude Science → 本地兼容服务 → Magpie → 选定的供应商 / 模型
```

数据、本地身份及分版本运行文件保存在 `~/.config/magpie/claude-science-runtime/`，原凭证和 App 二进制保留。只有确认后台进程归属并通过健康检查后，才重定向原配置。停用或卸载会恢复配置；若检测到用户修改，则保留并报告冲突，交由手动处理。

## 当前限制

- Sonnet、Opus、Haiku 槽位都使用 Magpie 中选定的同一个模型。
- 不提供 Anthropic 托管的搜索、MCP 和账号服务。
- 完整科研流程、长会话和图片支持尚未验证。
- 已自动化测试受管孤儿进程恢复和程序更新检测；真实 macOS 重启竞态及后续 Science 版本仍需验证。Science 更新后，请先结束任务再重启接入。
- 暂不支持自定义 XDG 配置根或已迁移的 Science 数据目录。

## 开发与发布

```sh
npm test
npm run check:package
npm run test:integration  # 需要 Magpie 和 Bun；使用隔离目录和模拟上游
```

CI 覆盖 Node 22/24 × Linux/macOS、打包后安装及独立部署检查，以及固定版本的 Magpie 集成测试。npm 发布需在匹配版本的标签上手动触发、通过 CI，并获得 `npm` 环境审批；普通 push 不会发布。详见[发布配置](docs/publishing.md)。

通过 [Issues](https://github.com/shiyang1026/magpie-claude-science/issues) 反馈问题，请附版本、`doctor` 输出和复现步骤，不要附带凭证或私人日志。更多内容：[运维说明](docs/operations.zh-CN.md)、[Magpie 文档](https://usemagpie.ai/docs/zh/plugins)。

## 许可证

[MIT](LICENSE)。独立社区项目，与 Anthropic、Magpie 无隶属关系。
