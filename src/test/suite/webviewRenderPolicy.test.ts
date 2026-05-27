import * as assert from 'assert';
import { shouldRenderMarkdown } from '../../webview/messages/renderPolicy';

suite('Webview render policy', () => {
  test('renders user messages as plain text so prompt newlines are preserved by CSS', () => {
    assert.strictEqual(shouldRenderMarkdown({ role: 'user', error: false }), false);
  });

  test('keeps markdown rendering for assistant and system messages', () => {
    assert.strictEqual(shouldRenderMarkdown({ role: 'assistant', error: false }), true);
    assert.strictEqual(shouldRenderMarkdown({ role: 'system', error: false }), true);
  });

  test('renders error messages as plain text', () => {
    assert.strictEqual(shouldRenderMarkdown({ role: 'assistant', error: true }), false);
  });
});
