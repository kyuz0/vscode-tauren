import * as assert from 'assert';
import { createWebviewHtml, createWebviewStateMessage } from '../../chatWebview';
import type { ChatState } from '../../chatSession';

suite('Chat webview helpers', () => {
  test('createWebviewStateMessage adds message type and model label', () => {
    const state: ChatState = {
      messages: [
        { role: 'user', text: 'hello' },
        { role: 'assistant', text: 'hi' }
      ],
      busy: true
    };

    assert.deepStrictEqual(createWebviewStateMessage(state, 'gpt-test High'), {
      type: 'state',
      messages: state.messages,
      busy: true,
      modelLabel: 'gpt-test High'
    });
  });

  test('createWebviewStateMessage defaults to an empty model label', () => {
    assert.deepStrictEqual(
      createWebviewStateMessage({ messages: [], busy: false }),
      {
        type: 'state',
        messages: [],
        busy: false,
        modelLabel: ''
      }
    );
  });

  test('createWebviewHtml wires CSP nonce and stable composer markup', () => {
    const html = createWebviewHtml();
    const scriptMatch = html.match(/<script nonce="([A-Za-z0-9]{32})">/);

    assert.ok(scriptMatch);
    const nonce = scriptMatch[1];

    assert.ok(
      html.includes(
        `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">`
      )
    );
    assert.ok(html.includes('class="messages" aria-live="polite" aria-label="Pi conversation"'));
    assert.ok(html.includes('<form class="composer" aria-label="Pi message input">'));
    assert.ok(html.includes('class="composer__button composer__add"'));
    assert.ok(html.includes('class="composer__button composer__submit"'));
    assert.ok(html.includes("vscode.postMessage({ type: 'ready' });"));
  });
});
