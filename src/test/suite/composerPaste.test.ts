import * as assert from 'assert';
import { ComposerPasteBuffer } from '../../webview/composer/paste';

suite('ComposerPasteBuffer', () => {
  test('inserts normalized paste text at the selection', () => {
    const buffer = new ComposerPasteBuffer();
    const result = buffer.paste('hello world', 'one\r\ntwo\tthree\u0001', 6, 11);

    assert.strictEqual(result.text, 'hello one\ntwo    three');
    assert.strictEqual(result.cursor, result.text.length);
    assert.strictEqual(buffer.expand(result.text), result.text);
  });

  test('adds a separating space when pasting a path after a word character', () => {
    const buffer = new ComposerPasteBuffer();
    const result = buffer.paste('open', '/tmp/file', 4, 4);

    assert.strictEqual(result.text, 'open /tmp/file');
  });

  test('collapses large pastes and expands only valid markers', () => {
    const buffer = new ComposerPasteBuffer();
    const largePaste = Array.from({ length: 11 }, (_value, index) => `line ${index + 1}`).join('\n');
    const result = buffer.paste('before ', largePaste, 7, 7);

    assert.strictEqual(result.text, 'before [paste #1 +11 lines]');
    assert.strictEqual(buffer.expand(`${result.text} [paste #999 1234 chars]`), `before ${largePaste} [paste #999 1234 chars]`);
  });

  test('clears paste markers', () => {
    const buffer = new ComposerPasteBuffer();
    const result = buffer.paste('', 'x'.repeat(1001), 0, 0);

    assert.strictEqual(result.text, '[paste #1 1001 chars]');
    buffer.clear();
    assert.strictEqual(buffer.expand(result.text), result.text);
  });
});
