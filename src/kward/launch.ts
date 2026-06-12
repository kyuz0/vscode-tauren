import { statSync } from 'node:fs';
import { dirname } from 'node:path';

export type KwardLaunchCommand = {
  command: string;
  args: string[];
  cwd: string;
};

export function resolveKwardLaunch(path: string): KwardLaunchCommand {
  if (isFile(path)) {
    return {
      command: path,
      args: ['rpc'],
      cwd: dirname(path)
    };
  }

  return {
    command: 'bundle',
    args: ['exec', 'ruby', 'lib/main.rb', 'rpc'],
    cwd: path
  };
}

function isFile(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}
