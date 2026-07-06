import type { AgentClient } from '../agent/clientTypes';
import type { KwardMcpServerStatus, KwardToolInfo, KwardToolInventory, KwardToolSource } from './types';

export type KwardToolInventoryClient = AgentClient & {
  getToolInventory(): Promise<KwardToolInventory>;
};

export function hasKwardToolInventory(client: AgentClient): client is KwardToolInventoryClient {
  return typeof (client as { getToolInventory?: unknown }).getToolInventory === 'function';
}

export function formatKwardMcpInventory(inventory: KwardToolInventory): string {
  const lines = ['Kward MCP'];
  const servers = [...(inventory.mcpServers ?? [])].sort(compareServerStatus);
  const mcpTools = inventory.tools
    .filter((tool) => tool.source === 'mcp')
    .sort(compareTools);

  lines.push('', 'Servers:');
  if (servers.length === 0) {
    lines.push('- No MCP servers reported.');
  } else {
    for (const server of servers) {
      lines.push(`- ${formatServerStatus(server)}`);
    }
  }

  lines.push('', 'MCP tools:');
  if (mcpTools.length === 0) {
    lines.push('- No MCP tools exposed.');
  } else {
    for (const [serverName, tools] of groupMcpTools(mcpTools)) {
      lines.push(`- ${serverName}`);
      for (const tool of tools) {
        lines.push(`  - ${formatToolLabel(tool)}`);
      }
    }
  }

  return lines.join('\n');
}

export function formatKwardToolInventory(inventory: KwardToolInventory): string {
  const lines = ['Available Kward Tools'];
  const servers = [...(inventory.mcpServers ?? [])].sort(compareServerStatus);

  if (servers.length > 0) {
    lines.push('', 'MCP servers:');
    for (const server of servers) {
      lines.push(`- ${formatServerStatus(server)}`);
    }
  }

  for (const source of ['mcp', 'builtin', 'web', 'skill', 'ui', 'unknown'] satisfies KwardToolSource[]) {
    const tools = inventory.tools.filter((tool) => tool.source === source).sort(compareTools);
    if (tools.length === 0) {
      continue;
    }

    lines.push('', `${formatSourceHeading(source)}:`);
    for (const tool of tools) {
      lines.push(`- ${formatToolLabel(tool)}${tool.description ? ` — ${tool.description}` : ''}`);
    }
  }

  if (lines.length === 1) {
    lines.push('', 'No tools reported.');
  }

  return lines.join('\n');
}

function groupMcpTools(tools: KwardToolInfo[]): Array<[string, KwardToolInfo[]]> {
  const grouped = new Map<string, KwardToolInfo[]>();
  for (const tool of tools) {
    const serverName = tool.serverName ?? 'unknown';
    grouped.set(serverName, [...(grouped.get(serverName) ?? []), tool]);
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([serverName, serverTools]) => [serverName, serverTools.sort(compareTools)]);
}

function formatServerStatus(server: KwardMcpServerStatus): string {
  const marker = server.status === 'available' ? '✓' : server.status === 'unavailable' ? '✕' : '?';
  const toolCount = typeof server.toolCount === 'number' ? ` — ${server.toolCount} tool${server.toolCount === 1 ? '' : 's'}` : '';
  const error = server.error ? `: ${server.error}` : '';
  return `${marker} ${server.name}${toolCount}${error}`;
}

function formatToolLabel(tool: KwardToolInfo): string {
  return tool.displayName === tool.name ? tool.displayName : `${tool.displayName} (${tool.name})`;
}

function formatSourceHeading(source: KwardToolSource): string {
  switch (source) {
    case 'mcp':
      return 'MCP tools';
    case 'builtin':
      return 'Builtin tools';
    case 'web':
      return 'Web tools';
    case 'skill':
      return 'Skill tools';
    case 'ui':
      return 'UI tools';
    case 'unknown':
      return 'Other tools';
  }
}

function compareServerStatus(left: KwardMcpServerStatus, right: KwardMcpServerStatus): number {
  return left.name.localeCompare(right.name);
}

function compareTools(left: KwardToolInfo, right: KwardToolInfo): number {
  return left.displayName.localeCompare(right.displayName) || left.name.localeCompare(right.name);
}
