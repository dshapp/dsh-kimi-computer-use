---
name: kimi-computer-use
description: Use Kimi Computer Use when the user asks the agent to inspect or operate a macOS graphical application, including clicking, typing, scrolling, dragging, reading visible UI state, or capturing an application screenshot.
---

# Kimi Computer Use

Use the KimiCU MCP server for macOS application interaction. It works through a background service and should not require moving the user's physical pointer.

## Before operating an app

1. If the `mcp__cu__*` tools are missing or fail to connect, tell the user to check that `KimiCU.app` is installed and running, and that this plugin's `cordis.patch.yml` layer is active in the current profile (`dsh --dump-config`).
2. Discover the available Kimi Computer Use tools directly by their `mcp__cu__` prefix — no separate adapter or proxy step is needed.
3. Start with `mcp__cu__list_apps`, then call `mcp__cu__get_app_state` for the target application.

## Interaction loop

1. Read fresh state with `mcp__cu__get_app_state`.
2. Choose an element index or screenshot coordinate from that state.
3. Perform one focused action such as `click`, `type_text`, `press_key`, `scroll`, `set_value`, `perform_secondary_action`, `select_text`, or `drag` (each exposed as `mcp__cu__<action>`).
4. Read state again and verify the visible result.

Never reuse an index or coordinate after the interface changes. If an element is outside the visible area, scroll and obtain fresh state before acting.

Prefer `set_value` for ordinary form fields and `type_text` for chat boxes, rich text editors, or web-based inputs. Prefer an element's supported secondary action over coordinate dragging when both are available.

## Safety

Before sending, submitting, deleting, purchasing, publishing, or performing another difficult-to-reverse action, state exactly what will happen and obtain the user's confirmation. Do not inspect or repeat unrelated sensitive content visible in screenshots.
