import * as assert from 'assert';
import {
  findPlainTextMatches,
  moveTranscriptSearchMatchIndex
} from '../../webview/messages/transcriptSearch';

suite('Webview transcript search', () => {
  test('finds plain text matches case-insensitively', () => {
    assert.deepStrictEqual(findPlainTextMatches('Alpha beta ALPHA', 'alpha'), [
      { start: 0, end: 5 },
      { start: 11, end: 16 }
    ]);
    assert.deepStrictEqual(findPlainTextMatches('aaaa', 'aa'), [
      { start: 0, end: 2 },
      { start: 2, end: 4 }
    ]);
    assert.deepStrictEqual(findPlainTextMatches('needle', ''), []);
    assert.deepStrictEqual(findPlainTextMatches('needle', 'missing'), []);
  });

  test('wraps next and previous match navigation', () => {
    assert.strictEqual(moveTranscriptSearchMatchIndex(undefined, 3, 1), 0);
    assert.strictEqual(moveTranscriptSearchMatchIndex(undefined, 3, -1), 2);
    assert.strictEqual(moveTranscriptSearchMatchIndex(0, 3, -1), 2);
    assert.strictEqual(moveTranscriptSearchMatchIndex(2, 3, 1), 0);
    assert.strictEqual(moveTranscriptSearchMatchIndex(8, 3, 1), 0);
    assert.strictEqual(moveTranscriptSearchMatchIndex(0, 0, 1), undefined);
  });
});
