/**
 * Proves this bundle's cordis.patch.yml loads through the real Cordis
 * Loader, that its dsh-mcp-client row discovers a tool from the officially
 * documented KimiCU stdio contract (`kimi-cu mcp`, verified here against a
 * package-owned fixture server instead of the real macOS-only binary), and
 * that its companion skills.ts row registers the bundled SKILL.md.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import type { PatchOptions } from '@deepseek-ai/cordis-plugin-include'
import { boot, loadOverlayPatches } from '@deepseek-ai/dsh-app-boot'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import ToolRegistry from '@deepseek-ai/dsh-tools'
import SkillRegistry from '@deepseek-ai/dsh-skill'
import * as McpClient from '@deepseek-ai/dsh-mcp-client'
import * as KimiCuSkills from '../src/skills.ts'

interface InsertedRow {
  id?: string
  name?: string
  config?: Record<string, unknown>
}

const root = resolve(import.meta.dirname, '..')
const patchFile = resolve(root, 'cordis.patch.yml')
const baseConfig = resolve(import.meta.dirname, 'fixtures/base.cordis.yml')
const fixtureServer = resolve(import.meta.dirname, 'fixture-server.ts')

const liveContexts = new Set<Context>()

afterEach(async () => {
  await Promise.all([...liveContexts].map(async ctx => ctx.fiber.dispose()))
  liveContexts.clear()
})

function insertedRows(patches: PatchOptions[]): InsertedRow[] {
  expect(patches).toHaveLength(1)
  const insert = patches[0]?.insert
  expect(insert).toHaveLength(2)
  return insert as InsertedRow[]
}

async function waitFor(predicate: () => boolean, description: string): Promise<void> {
  const deadline = Date.now() + 10_000
  while (!predicate()) {
    if (Date.now() >= deadline) throw new Error(`timed out waiting for ${description}`)
    await new Promise(resolveWait => setTimeout(resolveWait, 25))
  }
}

describe('dsh-kimi-computer-use bundle patch', () => {
  it('declares the documented generic MCP boundary with no embedded secrets', () => {
    const source = readFileSync(patchFile, 'utf8')
    const [mcpRow, skillsRow] = insertedRows(loadOverlayPatches('kimi-cu-config-test', patchFile))

    expect(mcpRow?.id).toBe('computer-use-kimi-cu')
    expect(mcpRow?.name).toBe('@deepseek-ai/dsh-mcp-client')
    expect(mcpRow?.config?.serverName).toBe('cu')
    expect(mcpRow?.config?.transport).toBe('stdio')
    expect(mcpRow?.config?.args).toEqual(['mcp'])

    expect(skillsRow?.id).toBe('computer-use-kimi-cu-skills')
    expect(skillsRow?.name).toBe('dsh-kimi-computer-use/skills')

    expect(source).not.toMatch(/\bsk-[A-Za-z0-9_-]{8,}\b/)
    expect(source).not.toContain('DEEPSEEK_API_KEY')
  })

  it('loads through the real Loader and discovers a fixture MCP tool plus the bundled skill', async () => {
    const patches = loadOverlayPatches('kimi-cu-config-test', patchFile)
    const [mcpRow, skillsRow] = insertedRows(patches)
    // The static test above verifies the checked-in real package names. This
    // test remaps both rows to `cordis:` builtins so the Loader/MCP/skill
    // wiring proves out with no macOS, real KimiCU.app, or self-referencing
    // package resolution involved (the Loader consults `builtins` only for a
    // `cordis:`-prefixed name; an ordinary bare specifier always goes through
    // real Node resolution instead).
    if (mcpRow !== undefined) mcpRow.name = 'cordis:kimi-cu-test-mcp-client'
    if (skillsRow !== undefined) skillsRow.name = 'cordis:kimi-cu-test-skills-plugin'
    const fixturePatch: PatchOptions = {
      id: 'computer-use-kimi-cu',
      config: {
        serverName: 'cu',
        transport: 'stdio',
        command: process.execPath,
        args: [fixtureServer],
        env: {},
        cwd: root,
        toolCallTimeoutMs: 5_000,
      },
    }
    const ctx = await boot(
      'kimi-cu-config-test',
      baseConfig,
      [...patches, fixturePatch],
      (ctx) => {
        ctx.loader.builtins['kimi-cu-test-system-prompt'] = SystemPrompt
        ctx.loader.builtins['kimi-cu-test-tools'] = ToolRegistry
        ctx.loader.builtins['kimi-cu-test-skills'] = SkillRegistry
        ctx.loader.builtins['kimi-cu-test-mcp-client'] = McpClient
        ctx.loader.builtins['kimi-cu-test-skills-plugin'] = KimiCuSkills
      },
    )
    liveContexts.add(ctx)

    await waitFor(
      () => ctx.tools.schemas().some(schema => schema.name === 'mcp__cu__list_apps'),
      'mcp__cu__list_apps',
    )

    const skills = await ctx.skills.list()
    expect(skills.some(skill => skill.name === 'kimi-computer-use')).toBe(true)
  }, 15_000)
})
