import type { SlashCommand } from './types';

export const messagesBottomThreshold = 4;
export const maxTextareaHeight = 180;
export const minTextareaHeight = 22;

export const localSlashCommands: SlashCommand[] = [
  { name: 'model', description: 'Select model', source: 'builtin' },
  { name: 'name', description: 'Set or clear session name', source: 'builtin' },
  { name: 'session', description: 'Show session info and stats', source: 'builtin' },
  { name: 'compact', description: 'Manually compact context', source: 'builtin' },
  { name: 'copy', description: 'Copy last Pi response', source: 'builtin' },
  { name: 'export', description: 'Export session to HTML', source: 'builtin' },
  { name: 'new', description: 'Start a new session', source: 'builtin' },
  { name: 'settings', description: 'Terminal-only: use VS Code settings instead', source: 'unsupported' },
  { name: 'scoped-models', description: 'Terminal-only: scoped model cycling is not supported here yet', source: 'unsupported' },
  { name: 'import', description: 'Terminal-only: session import is not supported here yet', source: 'unsupported' },
  { name: 'share', description: 'Not supported here yet', source: 'unsupported' },
  { name: 'changelog', description: 'Not supported here yet', source: 'unsupported' },
  { name: 'hotkeys', description: 'Terminal-only: use VS Code keybindings instead', source: 'unsupported' },
  { name: 'fork', description: 'Fork from a previous user message', source: 'builtin' },
  { name: 'clone', description: 'Duplicate the current session', source: 'builtin' },
  { name: 'tree', description: 'Navigate session tree', source: 'builtin' },
  { name: 'login', description: 'Terminal-only: run pi in a terminal to authenticate', source: 'unsupported' },
  { name: 'logout', description: 'Terminal-only: run pi in a terminal to manage auth', source: 'unsupported' },
  { name: 'resume', description: 'Resume a different session', source: 'builtin' },
  { name: 'reload', description: 'Reload keybindings, extensions, skills, prompts, and themes', source: 'builtin' },
  { name: 'quit', description: 'Not supported here', source: 'unsupported' }
];
