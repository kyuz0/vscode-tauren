import * as assert from 'assert';
import {
  getSessionItemCommandIcon,
  getSessionItemCommandLabel,
  parseSessionItemCommand,
  sessionItemMenuCommands
} from '../../webview/sessionItemCommands';

suite('Webview session item commands', () => {
  test('parses only supported session item commands', () => {
    for (const command of sessionItemMenuCommands) {
      assert.strictEqual(parseSessionItemCommand(command), command);
      assert.ok(getSessionItemCommandLabel(command));
      assert.ok(getSessionItemCommandIcon(command).includes('<svg'));
    }

    assert.strictEqual(parseSessionItemCommand('unknown'), undefined);
    assert.strictEqual(parseSessionItemCommand(null), undefined);
  });
});
