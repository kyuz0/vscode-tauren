import * as assert from 'assert';
import { resolveKwardLaunch } from '../../kward/launch';

suite('Kward launch', () => {
  test('resolves the existing source checkout launch command', () => {
    assert.deepStrictEqual(resolveKwardLaunch('/repo/kward'), {
      command: 'bundle',
      args: ['exec', 'ruby', 'lib/main.rb', 'rpc'],
      cwd: '/repo/kward'
    });
  });
});
