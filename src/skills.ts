/**
 * dsh-kimi-computer-use companion plugin: mounts a dsh-skill-filesystem
 * provider scoped to this package's own bundled `skills/` directory, so the
 * Kimi Computer Use skill is discovered without a manual copy step. Resolves
 * its own installed location through `createRequire`, the same technique
 * DeepSeek Harness's own dsh-web-app bundle uses to resolve its installed
 * frontend dist.
 * @module dsh-kimi-computer-use/skills
 */

import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import * as SkillFilesystem from '@deepseek-ai/dsh-skill-filesystem'

/** Stable Cordis plugin name. */
export const name = 'kimi-computer-use-skills'

/** Provider name registered on `ctx.skills` by the mounted filesystem provider. */
export const SKILL_PROVIDER_NAME = 'kimi-computer-use'

/**
 * Resolve the absolute path of this package's bundled `skills/` directory
 * from its own installed location, independent of the caller's cwd.
 * @returns the absolute path to the bundled skills directory.
 */
export function resolveBundledSkillsDir(): string {
  const require = createRequire(import.meta.url)
  const packageJsonPath = require.resolve('../package.json')
  return join(dirname(packageJsonPath), 'skills')
}

/**
 * Mount the bundled skill directory as an isolated dsh-skill-filesystem
 * provider, contributing only this package's own skill and no default roots.
 * @param ctx - plugin context; skill-filesystem injects `skills` from it.
 */
export function apply(ctx: Context): void {
  ctx.plugin(SkillFilesystem, {
    providerName: SKILL_PROVIDER_NAME,
    includeDefaultRoots: false,
    customSkillDirs: [resolveBundledSkillsDir()],
  })
}
