import * as assert from 'assert';
import {
  hiddenLocalSlashCommandNames,
  isBuiltinSlashCommand,
  isKwardOnlyBuiltinSlashCommand,
  isSupportedBuiltinSlashCommand,
  localSlashCommandNames,
  kwardLocalSlashMenuCommands,
  localSlashCommands,
  localSlashMenuCommands
} from '../../commands/slashCommands';

suite('Slash commands', () => {
  test('uses shared metadata for local menu commands and controller support checks', () => {
    const names = localSlashCommands.map((command) => command.name);

    assert.strictEqual(new Set(names).size, names.length);
    assert.ok(names.includes('model'));
    assert.ok(names.includes('settings'));
    assert.ok(names.includes('scoped-models'));
    assert.ok(names.includes('tree'));
    assert.ok(names.includes('import'));
    assert.ok(names.includes('share'));
    assert.ok(names.includes('login'));
    assert.ok(names.includes('logout'));
    assert.ok(names.includes('hotkeys'));
    assert.ok(names.includes('mcp'));
    assert.ok(names.includes('tools'));
    assert.deepStrictEqual(localSlashCommandNames, names);
    assert.deepStrictEqual(hiddenLocalSlashCommandNames, []);

    for (const command of localSlashCommands) {
      assert.strictEqual(isBuiltinSlashCommand(command.name), true);
      assert.strictEqual('supported' in command, false);
      assert.strictEqual('hidden' in command, false);
    }

    const menuNames = localSlashMenuCommands.map((command) => command.name);
    assert.ok(menuNames.includes('model'));
    assert.ok(menuNames.includes('settings'));
    assert.ok(menuNames.includes('scoped-models'));
    assert.ok(menuNames.includes('tree'));
    assert.ok(menuNames.includes('import'));
    assert.ok(menuNames.includes('share'));
    assert.ok(menuNames.includes('login'));
    assert.ok(menuNames.includes('logout'));
    assert.ok(menuNames.includes('hotkeys'));
    assert.strictEqual(menuNames.includes('mcp'), false);
    assert.strictEqual(menuNames.includes('tools'), false);

    const kwardMenuNames = kwardLocalSlashMenuCommands.map((command) => command.name);
    assert.deepStrictEqual(kwardMenuNames, ['mcp', 'tools']);
    assert.strictEqual(isKwardOnlyBuiltinSlashCommand('mcp'), true);
    assert.strictEqual(isKwardOnlyBuiltinSlashCommand('tools'), true);
    assert.strictEqual(isKwardOnlyBuiltinSlashCommand('model'), false);

    for (const command of localSlashMenuCommands) {
      assert.strictEqual(isBuiltinSlashCommand(command.name), true);
      assert.strictEqual(isSupportedBuiltinSlashCommand(command.name), true);
      assert.strictEqual('supported' in command, false);
      assert.strictEqual('hidden' in command, false);
    }

    assert.strictEqual(isSupportedBuiltinSlashCommand('model'), true);
    assert.strictEqual(isSupportedBuiltinSlashCommand('resume'), true);
    assert.strictEqual(isSupportedBuiltinSlashCommand('tree'), true);
    assert.strictEqual(isSupportedBuiltinSlashCommand('import'), true);
    assert.strictEqual(isSupportedBuiltinSlashCommand('share'), true);
    assert.strictEqual(isSupportedBuiltinSlashCommand('login'), true);
    assert.strictEqual(isSupportedBuiltinSlashCommand('logout'), true);
    assert.strictEqual(isSupportedBuiltinSlashCommand('settings'), true);
    assert.strictEqual(isSupportedBuiltinSlashCommand('scoped-models'), true);
    assert.strictEqual(isSupportedBuiltinSlashCommand('hotkeys'), true);
    assert.strictEqual(isSupportedBuiltinSlashCommand('unknown'), false);
    assert.strictEqual(isBuiltinSlashCommand('unknown'), false);
  });
});
