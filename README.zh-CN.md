# Claude Science for Magpie

[English](README.md) · 简体中文

[![npm](https://img.shields.io/npm/v/magpie-claude-science)](https://www.npmjs.com/package/magpie-claude-science)
[![CI](https://github.com/shiyang1026/magpie-claude-science/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/shiyang1026/magpie-claude-science/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/shiyang1026/magpie-claude-science)](https://github.com/shiyang1026/magpie-claude-science/releases)

在 Claude Science 中使用 Magpie 的模型，保留原来的 macOS App 图标。首次使用先完成下方的终端初始化；之后在 **Magpie → Agent → Claude Science** 中切换模型，照常打开 Science。

**实验版。** 包含 Agent 插件、限定作用范围的 middleware，以及需要明确安装的后台服务，无需 CSP。已验证 Science **0.1.60**、Magpie **0.1.1219**。

## 快速开始

需要 macOS、官方发行的 Node.js 22+，以及已安装的 Claude Science 和 Magpie。**只在 Magpie 点击安装插件还不能使用。** 启动 Magpie，启用至少一个模型，结束正在运行的 Science 任务，然后在终端执行（无需下载源码）：

```sh
npx magpie-claude-science@latest install
```

按提示选择模型，等终端显示 `Installed` 后，重新打开 **Claude Science.app**，关闭之前的登录页。不要继续使用旧端口的书签。

如果从源码安装，则在本仓库目录中执行：

```sh
npm ci --ignore-scripts
node src/cli.js install
```

按提示选择模型。无人值守安装时，用 `--model` 指定 Magpie 模型列表中的 ID。安装器读取 Magpie 网关端口，并选择空闲的本地端口；更多选项见 `node src/cli.js --help`。

**仅在 Magpie 中添加插件，不能完成全部安装。** 安装器配置 macOS LaunchAgent，把运行文件、生产依赖及 Node 复制到独立版本目录。后台运行不再依赖 checkout 或 npm 缓存。部分 Homebrew Node 依赖外部动态库，会被拒绝，需改用官方 Node。

打开原来的 **Claude Science.app**。首次 “Sign in” 仅确认本地浏览器会话，无需登录 Anthropic。保持 Magpie 运行，在其 Agent 页面切换模型。

### 点 Sign in 后仍显示 Sign in on the web / Paste code instead

这表示当前页面进入了 Science 的账号登录流程；先检查接入是否完成，不要以浏览器已有登录状态判断安装成功：

```sh
npx magpie-claude-science@latest doctor
```

如果提示本地服务未初始化，执行上面的 `install`。如果服务已安装，检查输出中的服务状态和 `sciencePort`，重新打开 App 进入受管服务。仅凭 `localhost:8765` 或其他端口不能判断是否接入成功。如果 `doctor` 仍报错，请提供错误摘要，不要提供令牌、完整私有日志或 `state.json`。

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

CI 覆盖 Node 22/24 × Linux/macOS、打包部署检查及固定版本的 Magpie 集成。Release Please 根据规范提交生成版本号和 [CHANGELOG](CHANGELOG.md) 的发布 PR。你审核合并后，同一工作流创建 GitHub Release、测试对应提交，并等待 `npm` 环境审批后通过 OIDC 发布。保留按版本标签手动触发的恢复入口。详见[发布配置](docs/publishing.md)。

通过 [Issues](https://github.com/shiyang1026/magpie-claude-science/issues) 反馈问题，请附版本、`doctor` 输出和复现步骤，不要附带凭证或私人日志。更多内容：[运维说明](docs/operations.zh-CN.md)、[Magpie 文档](https://usemagpie.ai/docs/zh/plugins)。

## 许可证

[MIT](LICENSE)。独立社区项目，与 Anthropic、Magpie 无隶属关系。

Claude Science 图标归原权利人所有，不适用本项目的 MIT 许可证。
