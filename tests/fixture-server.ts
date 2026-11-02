/**
 * Minimal MCP server over stdio for testing dsh-kimi-computer-use's patch.
 * Stands in for the real KimiCU.app binary so the suite proves real Cordis
 * Loader / dsh-mcp-client tool discovery without requiring macOS or the
 * proprietary KimiCU application.
 *
 * Run: node fixture-server.ts
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const server = new McpServer(
  { name: 'kimi-cu-fixture-server', version: '1.0.0' },
  { capabilities: { tools: { listChanged: true } } },
)

server.registerTool('list_apps', {
  title: 'List Apps Tool',
  description: 'Lists open macOS applications (fixture: always returns one fixed app).',
  inputSchema: {},
}, async () => ({
  content: [{ type: 'text', text: JSON.stringify([{ pid: 1, name: 'Fixture App' }]) }],
}))

const transport = new StdioServerTransport()
await server.connect(transport)
