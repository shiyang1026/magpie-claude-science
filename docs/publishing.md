# 发布与上架

仓库：[shiyang1026/magpie-claude-science](https://github.com/shiyang1026/magpie-claude-science)。本地改动由维护者自行 review、commit 和 push。下列命令是操作说明，不代表已经发布。

## 已准备的 CI/CD

| 流程 | 触发方式 | 检查内容 |
| --- | --- | --- |
| CI | main 分支 push、PR、手动触发 | Node 22/24 × Ubuntu/macOS，单元与受管服务集成测试 |
| 打包检查 | 每次 CI | 文件白名单、真实 tarball 安装、复制独立运行版本；删除原 npm 安装后仍可执行 CLI |
| Magpie 集成 | 每次 CI | 固定 Magpie 0.1.1219 CLI，SHA-256 校验，Bun 1.4.3，隔离 HOME 和模拟上游 |
| npm 发布 | 仅手动、版本标签 | 仓库、标签、版本、commit 与干净工作区校验；重新跑 CI；npm 环境审批；OIDC 发布已验证的 tarball |

发布流程没有 npm token secret，也没有自动执行的安装脚本。GitHub Actions 使用固定 commit SHA，PR 测试仅有读取权限。社区插件详情中的点击安装仍不会代替后台服务的显式初始化。

## 第一次把代码推到 GitHub

完成本地检查：

```sh
npm ci --ignore-scripts
npm test
npm run check:package
npm run test:integration
```

最后一项需要安装 Magpie 和 Bun，或设置 `MAGPIE_BIN`、`MAGPIE_BUN`。确认待提交文件不含 `work/`、凭证或忽略的开发记录，再由维护者创建提交并推送到 `main`。当前本地分支如仍叫 `prototype`，可先自行改名为 `main`。

推送后，进入仓库 **Actions → CI**，确认所有矩阵与集成任务通过。本地测试不能替代首次云端执行结果。

## 配置 npm 可信发布

首次发布前需由包所有者完成 npm 账号与包初始化；这部分不会由本项目工作流代办。首次包引导可按 npm 当前官方流程完成，已有包直接在设置中添加 GitHub Actions Trusted Publisher。

配置字段：

| 字段 | 值 |
| --- | --- |
| Organization or user | `shiyang1026` |
| Repository | `magpie-claude-science` |
| Workflow filename | `release.yml` |
| Environment | `npm` |
| Allowed action | 明确允许直接 publish（不能只允许 stage） |

先确认 npm 包名可用且你拥有发布权限。按当前 npm 文档，新配置需及时完成首次发布，不要过早配置后长期闲置。工作流使用 Node 24 并检查 npm ≥11.5.1。

GitHub 的 `npm` 环境已配置 `shiyang1026` 为审批人，部署标签限定 `v*`。后续其他人 fork 项目时，需要自行配置环境审批、发布身份，并更新工作流及 release-check 中固定的源仓库校验。

## 发布一个版本

1. 更新版本及 lockfile，review、commit 并 push；确认 main 的 CI 通过。
2. 创建与版本完全一致的标签，例如 `v0.1.0`，并 push 标签。
3. 在该标签上手动运行发布工作流：

```sh
gh workflow run release.yml --repo shiyang1026/magpie-claude-science --ref v0.1.0
```

4. 等验证与 CI 完成，在 GitHub 审批 `npm` 环境。工作流随后发布经过安装及独立部署检查的同一 tarball。
5. 核对 npm 页面和安装行为，再通知使用者更新。

普通 push 或创建标签都不会自动发布。工作流不会替维护者创建标签、提交源码或生成 GitHub Release。

## 进入 Magpie 的发现页

- **非官方 GitHub 入口**：公开仓库添加 `magpie-plugin` topic；根目录包含 `package.json` 及可加载代码。fork、归档仓库不会进入该列表。
- **社区推荐**：向 [magpie-community/plugins](https://github.com/magpie-community/plugins) 提交包、测试、中英说明及 `registry.json` 条目，申请 `kind: "agent"`。是否收录及后台服务的分发方式需由维护者认可。
- **社区维护包**：`@magpie-community/…` 命名空间由社区管理，不能自行声明社区身份；首版发布和后续自动更新按其贡献流程处理。

本项目是 Agent 接入插件。发现页的“订阅”分组指模型供应商套餐，不是用户关注或订阅插件更新的入口。

## 参考

- [Magpie 插件开发与发布](https://usemagpie.ai/docs/zh/plugins)
- [社区 Market 流程](https://github.com/magpie-community/plugins#the-market)
- [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/)
- [npm provenance](https://docs.npmjs.com/generating-provenance-statements/)
