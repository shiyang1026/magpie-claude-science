# 发布与上架

仓库：[shiyang1026/magpie-claude-science](https://github.com/shiyang1026/magpie-claude-science)。npm 首版 `0.1.0` 已发布，后续通过 Release Please 管理版本。

## 日常发布

```text
提交 feat / fix 到 main
  → Release Please 更新发布 PR（版本、lockfile、CHANGELOG）
  → 自动测试发布 PR 的精确提交
  → 维护者审核并合并发布 PR
  → 创建版本标签与 GitHub Release
  → 测试该版本 → npm 环境审批 → OIDC 发布并核对 registry
```

发布 PR 标题使用 `chore(release): 发布 <版本>`。普通提交不会立即发布 npm；不要手工合并未经验证的发布 PR。当前保留 npm 环境审批，审批人是仓库所有者。

自动生成的 PR 使用 `GITHUB_TOKEN`，不会触发普通的 PR 工作流。因此 `release.yml` 显式测试经过来源校验的机器人 PR，并把 `release-pr/ci` 状态回报到对应的 PR 提交。若以后配置分支保护，可把这个状态作为发布 PR 的必需检查。

## CI/CD 的检查

| 流程 | 检查内容 |
| --- | --- |
| 常规 CI | main push、PR、手动触发；Node 22/24 × Ubuntu/macOS |
| 打包检查 | 白名单、tarball 安装、独立运行目录；删除原 npm 安装后 CLI 仍可运行 |
| Magpie 集成 | 固定 0.1.1219 CLI 与 SHA-256，Bun 1.4.3，隔离 HOME 和模拟上游 |
| 发布校验 | 个人源仓库、版本标签、checkout 与触发提交一致、干净工作区 |
| 发布确认 | OIDC、provenance、npm 环境审批、registry 可见性及 tarball SHA-512 一致性 |

自动发布要求 Release Please 的发布提交与触发 workflow 的 main 提交完全相同，避免 provenance 把包错误关联到其他提交。需要补发旧标签时使用下方的手动恢复入口。

同一个 `release.yml` 同时处理版本创建与 npm 发布，避免机器人创建的 tag/Release 不触发另一个工作流的问题。没有 npm token secret，也没有自动安装后台服务的 postinstall 脚本。

## 手动恢复

若某版本发布失败，先检查 Actions 日志。不要修改已经发布的同一版本的内容。

```sh
gh workflow run release.yml --repo shiyang1026/magpie-claude-science --ref v0.1.1
```

将示例替换为实际要恢复的标签。新版流程会检查已公开版本的完整性：相同 tarball 已发布则跳过上传，内容不一致则拒绝。上传成功后等待 registry 可查询；超过等待时间会报告未确认，而不是仅凭命令退出码声称可安装。

较早的 `v0.1.0` 标签仍包含首版手动工作流；按旧标签运行会使用其当时的工作流。旧版本补发不应强行覆盖较新的 `latest`，需要另行安排 dist-tag。

## 首次配置或 fork

1. 安装依赖并运行 `npm test`、`npm run check:package`、`npm run test:integration`。
2. 在自己的仓库启用 Actions 创建 PR 的权限；工作流的默认权限仍保持 read，只有版本管理任务获得必要写权限。
3. 配置 `npm` 环境审批，允许 `main` 分支及 `v*` 标签部署。
4. 在 npm 完成包初始化、2FA 和 Trusted Publisher 配置；改用自己的仓库时，同步更新工作流及 release-check 的源仓库限制。

当前可信发布配置：

| 字段 | 值 |
| --- | --- |
| Organization or user | `shiyang1026` |
| Repository | `magpie-claude-science` |
| Workflow filename | `release.yml` |
| Environment | `npm` |
| Allowed action | 允许直接 publish |

工作流使用 Node 24，并检查 npm ≥11.5.1。新增 Trusted Publisher 要及时完成首次发布，具体时限以 npm 当前文档为准。

## 仓库展示与 Magpie 收录

- npmjs.com 的包通过 README npm 徽章展示；GitHub Packages 是另一套 registry，不会自动同步 npmjs.com 的发布。
- GitHub Releases 展示版本和更新日志，由 Release Please 创建；不需要为了 Packages 栏额外维护双 registry。
- 公开仓库添加 `magpie-plugin` topic 后，可进入 Magpie 的非官方 GitHub 发现入口。
- 社区推荐需向 [magpie-community/plugins](https://github.com/magpie-community/plugins) 提交包、测试、中英说明和 `registry.json` 条目，申请 `kind: "agent"`。维护者决定是否收录及后台服务的分发方式。

本项目是 Agent 接入插件，发现页的“订阅”指供应商套餐。仅在 Magpie 点击安装插件不能代替首次后台服务初始化。

## 参考

- [Release Please](https://github.com/googleapis/release-please-action)
- [Magpie 插件文档](https://usemagpie.ai/docs/zh/plugins)
- [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/)
- [GitHub Packages 的 npm registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)
