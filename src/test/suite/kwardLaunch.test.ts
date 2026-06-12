import * as assert from 'assert';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveKwardLaunch } from '../../kward/launch';

suite('Kward launch', () => {
  test('resolves the existing source checkout launch command for directories or missing paths', () => {
    assert.deepStrictEqual(resolveKwardLaunch('/repo/kward'), {
      command: 'bundle',
      args: ['exec', 'ruby', 'lib/main.rb', 'rpc'],
      cwd: '/repo/kward'
    });
  });

  test('resolves executable file paths as direct kward commands', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'tauren-kward-launch-'));
    const executable = join(dir, 'kward');

    try {
      await writeFile(executable, '#!/usr/bin/env ruby\n');

      assert.deepStrictEqual(resolveKwardLaunch(executable), {
        command: executable,
        args: ['rpc'],
        cwd: dir
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
