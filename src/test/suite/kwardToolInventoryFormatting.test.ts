import * as assert from 'assert';
import { formatKwardMcpInventory, formatKwardToolInventory } from '../../kward/toolInventoryFormatting';

suite('Kward tool inventory formatting', () => {
  test('formats MCP server and tool discovery', () => {
    assert.strictEqual(
      formatKwardMcpInventory({
        mcpServers: [
          { name: 'linear', transport: 'stdio', status: 'unavailable', toolCount: 0, error: 'command not found' },
          { name: 'github', transport: 'stdio', status: 'available', toolCount: 2 }
        ],
        tools: [
          {
            name: 'github__create_issue',
            displayName: 'github.create_issue',
            source: 'mcp',
            serverName: 'github',
            remoteName: 'create_issue'
          },
          {
            name: 'github__search_issues',
            displayName: 'github.search_issues',
            source: 'mcp',
            serverName: 'github',
            remoteName: 'search_issues'
          },
          { name: 'read_file', displayName: 'read_file', source: 'builtin' }
        ]
      }),
      [
        'Kward MCP',
        '',
        'Servers:',
        '- ✓ github — 2 tools',
        '- ✕ linear — 0 tools: command not found',
        '',
        'MCP tools:',
        '- github',
        '  - github.create_issue (github__create_issue)',
        '  - github.search_issues (github__search_issues)'
      ].join('\n')
    );
  });

  test('formats full Kward tool inventory by source', () => {
    assert.strictEqual(
      formatKwardToolInventory({
        tools: [
          { name: 'read_file', displayName: 'read_file', source: 'builtin', description: 'Read files.' },
          { name: 'github__search', displayName: 'github.search', source: 'mcp' },
          { name: 'mystery', displayName: 'mystery', source: 'unknown' }
        ]
      }),
      [
        'Available Kward Tools',
        '',
        'MCP tools:',
        '- github.search (github__search)',
        '',
        'Builtin tools:',
        '- read_file — Read files.',
        '',
        'Other tools:',
        '- mystery'
      ].join('\n')
    );
  });
});
