import { defineConfig } from 'tsdown'

/**
 * Self-contained build for a git/tarball install: transpiles `src/` directly
 * with no project references or sibling monorepo checkout assumed, so pnpm's
 * post-install `prepare` script (the only script a git dependency runs) can
 * produce `lib/skills.js` on a clean checkout. Every non-relative import stays
 * external: `@deepseek-ai/dsh-skill-filesystem`, `@deepseek-ai/dsh-skill`, and
 * `@deepseek-ai/cordis` are in-box packages a real dsh installation already
 * ships (the same resolution story as this bundle's `cordis.patch.yml` row for
 * `@deepseek-ai/dsh-mcp-client`); bundling them would duplicate that code and
 * strand their own unresolved transitive imports in this package's output.
 */
export default defineConfig({
  entry: ['src/skills.ts'],
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2022',
  fixedExtension: false,
  dts: false,
  clean: true,
  deps: {
    neverBundle: [/^@deepseek-ai\//, /^node:/],
  },
})
