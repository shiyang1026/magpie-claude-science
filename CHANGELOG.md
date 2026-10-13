# 更新日志 / Changelog

## 0.1.0 (2026-10-13)

### 新功能

- 将 Claude Science 接入 Magpie，通过原 macOS App 入口使用选定模型。
- 提供流式响应兼容、本地独立身份与会话、安装、升级、回退和卸载。
- 增加后台进程归属校验、启动健康检查和故障恢复。

### 测试与发布

- 添加跨平台 CI、包安装验证与真实 Magpie 隔离集成测试。
- 通过 GitHub Actions OIDC 发布 npm 包，并附带 provenance。

### 限制

- 实验版，仅支持 macOS；完整科研流程、长会话及图片支持尚未验证。
