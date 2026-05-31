import * as assert from 'assert';
import * as vscode from 'vscode';

type PackageJson = {
  name?: unknown;
  contributes?: {
    keybindings?: Array<{ command?: unknown; key?: unknown; mac?: unknown; when?: unknown; args?: unknown }>;
    menus?: {
      'view/title'?: Array<{ command?: unknown; when?: unknown }>;
    };
  };
};

suite('Tauren extension', () => {
  test('activates the development extension', async () => {
    const extension = findTaurenExtension();

    assert.ok(extension, 'Expected the Tauren extension to be available');
    await extension.activate();

    assert.strictEqual(extension.isActive, true);
  });

  test('registers contributed commands', async () => {
    const extension = findTaurenExtension();

    assert.ok(extension, 'Expected the Tauren extension to be available');
    await extension.activate();

    const commands = await vscode.commands.getCommands(true);

    assert.ok(commands.includes('tauren.newSession'));
    assert.ok(commands.includes('tauren.resume'));
    assert.ok(commands.includes('tauren.fork'));
    assert.ok(commands.includes('tauren.clone'));
    assert.ok(commands.includes('tauren.showSessionTree'));
    assert.ok(commands.includes('tauren.toggleSessionList'));
    assert.ok(commands.includes('tauren.openSessionDiff'));
    assert.ok(commands.includes('tauren.renameSession'));
    assert.ok(commands.includes('tauren.compactSession'));
    assert.ok(commands.includes('tauren.exportSession'));
    assert.ok(commands.includes('tauren.moveSessionToTrash'));
    assert.ok(commands.includes('tauren.reloadPi'));
    assert.ok(commands.includes('tauren.copyLastResponse'));
    assert.ok(commands.includes('tauren.searchTranscript'));
    assert.ok(commands.includes('tauren.scroll'));
    assert.ok(commands.includes('tauren.openModelPicker'));
    assert.ok(commands.includes('tauren.toggleSettings'));
    assert.ok(commands.includes('tauren.toggleHelp'));
    assert.ok(commands.includes('tauren.stop'));
    assert.ok(commands.includes('tauren.toggleSteerFollowUp'));
    assert.ok(commands.includes('tauren.addContext'));
    assert.ok(commands.includes('tauren.traceOrigin'));
  });

  test('contributes active pane scroll keybindings scoped to sidebar focus', () => {
    const extension = findTaurenExtension();

    assert.ok(extension, 'Expected the Tauren extension to be available');

    const packageJson = extension.packageJSON as PackageJson;
    const keybindings = packageJson.contributes?.keybindings ?? [];
    const scrollTopKeybinding = keybindings.find((entry) => entry.command === 'tauren.scroll' && entry.key === 'ctrl+pageup');
    const scrollBottomKeybinding = keybindings.find((entry) => entry.command === 'tauren.scroll' && entry.key === 'ctrl+pagedown');

    assert.deepStrictEqual(scrollTopKeybinding, {
      command: 'tauren.scroll',
      key: 'ctrl+pageup',
      mac: 'cmd+pageup',
      when: 'tauren.sidebarFocus',
      args: {
        direction: 'up',
        amount: 'edge'
      }
    });
    assert.deepStrictEqual(scrollBottomKeybinding, {
      command: 'tauren.scroll',
      key: 'ctrl+pagedown',
      mac: 'cmd+pagedown',
      when: 'tauren.sidebarFocus',
      args: {
        direction: 'down',
        amount: 'edge'
      }
    });
  });

  test('keeps native new session action visible while busy', () => {
    const extension = findTaurenExtension();

    assert.ok(extension, 'Expected the Tauren extension to be available');

    const packageJson = extension.packageJSON as PackageJson;
    const newSessionMenu = packageJson.contributes?.menus?.['view/title']?.find((entry) => entry.command === 'tauren.newSession');

    assert.ok(newSessionMenu, 'Expected tauren.newSession in the native view title menu');
    assert.strictEqual(newSessionMenu.when, 'view == tauren.chatView');
  });
});

function findTaurenExtension(): vscode.Extension<unknown> | undefined {
  return vscode.extensions.all.find((extension) => {
    const packageJson = extension.packageJSON as PackageJson;

    return packageJson.name === 'tauren';
  });
}
