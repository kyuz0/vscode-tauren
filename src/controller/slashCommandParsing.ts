import { isBuiltinSlashCommand } from '../slashCommands';

export function parseLocalSlashCommand(text: string): { name: string; args: string } | undefined {
  const match = text.trim().match(/^\/([^\s]+)(?:\s+([\s\S]*))?$/);

  if (!match) {
    return undefined;
  }

  const name = match[1];

  if (!isBuiltinSlashCommand(name)) {
    return undefined;
  }

  return { name, args: match[2]?.trim() ?? '' };
}
