import * as assert from 'assert';
import { mkdir, mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { listKwardSessions } from '../../kward/sessionList';

suite('Kward session list', () => {
  test('filters unnamed empty sessions while keeping named or non-empty sessions', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'tauren-kward-sessions-'));
    const originalConfigPath = process.env.KWARD_CONFIG_PATH;

    try {
      const cwd = join(dir, 'workspace');
      const configPath = join(dir, '.kward', 'config.json');
      const sessionDir = join(dir, '.kward', 'sessions', safeCwd(cwd));
      await mkdir(sessionDir, { recursive: true });
      process.env.KWARD_CONFIG_PATH = configPath;

      const emptyUnnamedPath = join(sessionDir, 'empty-unnamed.jsonl');
      const emptyNamedPath = join(sessionDir, 'empty-named.jsonl');
      const nonEmptyUnnamedPath = join(sessionDir, 'non-empty-unnamed.jsonl');

      await writeFile(emptyUnnamedPath, [
        JSON.stringify({ type: 'session', id: 'empty-unnamed', timestamp: '2026-01-01T00:00:00.000Z', cwd })
      ].join('\n') + '\n');
      await writeFile(emptyNamedPath, [
        JSON.stringify({ type: 'session', id: 'empty-named', timestamp: '2026-01-01T00:00:00.000Z', cwd }),
        JSON.stringify({ type: 'session_info', name: 'Named draft' })
      ].join('\n') + '\n');
      await writeFile(nonEmptyUnnamedPath, [
        JSON.stringify({ type: 'session', id: 'non-empty-unnamed', timestamp: '2026-01-01T00:00:00.000Z', cwd }),
        JSON.stringify({ type: 'message', message: { role: 'user', content: 'Keep this session' } })
      ].join('\n') + '\n');

      const sessions = await listKwardSessions({ cwd, kwardPath: join(dir, 'missing-kward-rpc') });

      assert.deepStrictEqual(sessions.map((session) => session.path).sort(), [
        emptyNamedPath,
        nonEmptyUnnamedPath
      ].sort());
      assert.strictEqual(sessions.find((session) => session.path === emptyNamedPath)?.name, 'Named draft');
      assert.strictEqual(sessions.find((session) => session.path === nonEmptyUnnamedPath)?.firstMessage, 'Keep this session');
    } finally {
      if (originalConfigPath === undefined) {
        delete process.env.KWARD_CONFIG_PATH;
      } else {
        process.env.KWARD_CONFIG_PATH = originalConfigPath;
      }
      await rm(dir, { recursive: true, force: true });
    }
  });
});

function safeCwd(cwd: string): string {
  return `--${resolve(cwd).replace(/^[/\\]/, '').replace(/[/\\:]/g, '-')}--`;
}
