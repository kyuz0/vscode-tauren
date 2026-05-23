import * as path from 'node:path';

export function getUnsafeCwdReason(cwd: string | undefined): string | undefined {
  const trimmed = cwd?.trim();

  if (!trimmed) {
    return 'no workspace folder is open';
  }

  const resolved = path.resolve(trimmed);
  const root = path.parse(resolved).root;

  if (resolved === root) {
    return `the workspace folder resolves to the filesystem root (${resolved})`;
  }

  return undefined;
}

export function assertSafeWorkspaceCwd(cwd: string | undefined): string {
  const reason = getUnsafeCwdReason(cwd);

  if (reason) {
    throw new Error(`Tau cannot start Pi because ${reason}. Open a project folder and try again.`);
  }

  return path.resolve(cwd as string);
}

export function isSafeWorkspaceCwd(cwd: string | undefined): boolean {
  return !getUnsafeCwdReason(cwd);
}
