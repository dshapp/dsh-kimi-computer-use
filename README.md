# dsh-kimi-computer-use

[中文](README.zh.md)

A [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/deepseek-harness) bundle that wires [Kimi Computer Use](https://www.kimi.com/)'s stdio MCP server into DSH through the generic [`@deepseek-ai/dsh-mcp-client`](https://www.npmjs.com/package/@deepseek-ai/dsh-mcp-client) bridge, plus a bundled skill that drives it once connected.

This is a third-party interoperability plugin. Its inclusion does not imply endorsement, recommendation, partnership, or ongoing support by DeepSeek or by Moonshot AI (the maker of Kimi Computer Use).

## What this bundle does and does not do

| Concern | This bundle | You / KimiCU.app |
|---|---|---|
| Insert one `@deepseek-ai/dsh-mcp-client` row that starts `kimi-cu mcp` over stdio | Yes | — |
| Discover and register KimiCU's MCP tools as `mcp__cu__<tool>` | Yes | — |
| Register the bundled `kimi-computer-use` skill (interaction loop + safety rules) | Yes | — |
| Download, verify, or install `KimiCU.app` | No | Yes — install from the official Kimi channel |
| Bundle ID / arm64 / Team ID / `codesign` verification | No | Handled by KimiCU.app's own installer |
| Start, stop, or supervise the KimiCU background service | No | Yes — keep the app running yourself |
| Grant Accessibility / Screen Recording permissions | No | Yes — grant them in the KimiCU.app UI |

DSH starts and stops the `kimi-cu mcp` stdio child process with this plugin's lifecycle; it does not manage KimiCU.app itself.

## Requirements

- Apple Silicon Mac, macOS 14 or later.
- [`KimiCU.app`](https://www.kimi.com/) installed from the official Kimi channel and left running, with Accessibility and Screen Recording granted in its own UI.
- A DSH installation (`@deepseek-ai/dsh`) whose `dsh` CLI ships `@deepseek-ai/dsh-mcp-client` in-box (true for published `@deepseek-ai/dsh >= 0.1.1-rc.2`).

## Install

Into a profile (see the [plugin-and-profile tutorial](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/publish.md) for the full mechanism):

```sh
dsh plugin --profile demo add dsh-kimi-computer-use          # once published to npm
dsh plugin --profile demo add ./dsh-kimi-computer-use        # from a local checkout
dsh plugin --profile demo add github:<you>/dsh-kimi-computer-use#<sha>   # from git, pinned to a commit
```

The git form runs this package's `prepare` script to build `lib/skills.js` from source; pnpm ≥10 blocks that script until you allow it. If `dsh plugin` reports the build was blocked, add the exact package key it printed to the profile's `pnpm-workspace.yaml`:

```yaml
allowBuilds:
  dsh-kimi-computer-use: true
```

then re-run the `add` command. Only allow builds for a package whose source you trust, and pin a commit so a later push cannot silently change what runs at install time.

Verify without booting, then boot:

```sh
dsh --profile demo --dump-config   # shows a "# == dsh-kimi-computer-use" layer
dsh --profile demo
```

Remove with `dsh plugin --profile demo remove dsh-kimi-computer-use`.

## Verify

1. After boot, wait for the `mcp__cu__*` tools to appear (discovery is asynchronous).
2. Ask the agent to list open applications. Confirm it calls `mcp__cu__list_apps` (or the equivalent discovered tool) and returns a real result from your running KimiCU.app.
3. For any GUI action, the bundled skill instructs the agent to state what will happen and get your confirmation before anything hard to reverse (sending, deleting, purchasing, publishing).

## Security

KimiCU.app's own installer verifies its Bundle ID, arm64 architecture, and Apple `codesign` signature before installing itself; none of that runs through this bundle. Only install `KimiCU.app` from the official Kimi channel. Only allow a git-hosted install's build script for a source you trust, pinned to a specific commit.

## Development

```sh
npm install
npm run check   # build then test
npm pack --dry-run
```

## License

MIT
