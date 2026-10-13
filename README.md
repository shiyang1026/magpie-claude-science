# Claude Science for Magpie

English · [简体中文](README.zh-CN.md)

[![npm](https://img.shields.io/npm/v/magpie-claude-science)](https://www.npmjs.com/package/magpie-claude-science)
[![CI](https://github.com/shiyang1026/magpie-claude-science/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/shiyang1026/magpie-claude-science/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/shiyang1026/magpie-claude-science)](https://github.com/shiyang1026/magpie-claude-science/releases)

Use Magpie's models in Claude Science while keeping the original macOS app icon. Choose a model in **Magpie → Agent → Claude Science**, then open Science as usual.

**Experimental.** An Agent plugin, scoped middleware and an explicitly installed background service. No CSP required. Tested with Science **0.1.60** and Magpie **0.1.1219**.

## Quick start

Requires macOS, an official Node.js 22+ distribution, and installed Claude Science and Magpie. Start Magpie and enable at least one model. From a checkout:

```sh
npm ci --ignore-scripts
node src/cli.js install
```

Choose a model when prompted. For unattended setup, supply `--model` with an ID from your Magpie catalog. The installer reads Magpie's gateway port and finds available local ports; overrides are listed by `node src/cli.js --help`.

**Adding the plugin in Magpie alone does not complete setup.** The installer creates a macOS LaunchAgent and copies its runtime, production dependencies and Node into a private release directory. The installed service no longer depends on the checkout or npm cache. Node builds linked to external libraries, such as some Homebrew builds, are refused.

Open the original **Claude Science.app**. The first “Sign in” confirms a local browser session, not an Anthropic login. Keep Magpie running and select models from its Agent page.

## Manage

```sh
node src/cli.js doctor
node src/cli.js restart
node src/cli.js upgrade    # Run from the updated checkout/package
node src/cli.js rollback   # Restore the previous managed runtime release
node src/cli.js uninstall  # Restore original config; retain session data
```

Stop active Science tasks before lifecycle changes. Upgrade preserves local identity and sessions and restores the previous service if startup fails. Migrating an early checkout-based installation is supported through `upgrade`; a previous managed release is required for `rollback`.

## How it works

```text
Claude Science → local compatibility service → Magpie → selected provider/model
```

Data, local identity and versioned runtime files live under `~/.config/magpie/claude-science-runtime/`. Original credentials and app binaries are preserved. The original config is redirected only after an owned Science daemon passes readiness checks. Disabling or uninstalling restores it; conflicting user edits are retained for manual resolution.

## Limitations

- Sonnet, Opus and Haiku slots all use the single Magpie-selected model.
- Anthropic-hosted search, MCP and account services are not provided.
- Full scientific workflows, long sessions and image support remain unverified.
- Owned-orphan recovery and executable-change detection have automated tests. Real macOS reboot races and future Science versions still need validation. Finish current tasks before restarting after a Science update.
- Custom XDG roots and relocated Science data directories are not supported.

## Development and releases

```sh
npm test
npm run check:package
npm run test:integration  # Requires Magpie and Bun; uses a temporary home and mock upstream
```

CI tests Node 22/24 on Linux/macOS, the packed/deployed CLI and a pinned Magpie version. Release Please prepares a version and [CHANGELOG](CHANGELOG.md) PR from conventional commits. You review and merge it; the same workflow creates a GitHub Release, tests that exact commit and waits for `npm` environment approval before publishing through OIDC. Manual tag dispatch remains available for recovery. See [release setup (中文)](docs/publishing.md).

Report bugs through [Issues](https://github.com/shiyang1026/magpie-claude-science/issues), including versions, `doctor` output and reproduction steps. Omit credentials and private logs. See [operations (中文)](docs/operations.zh-CN.md) and [Magpie's guide](https://usemagpie.ai/docs/plugins).

## License

[MIT](LICENSE). Independent community project; not affiliated with Anthropic or Magpie.
