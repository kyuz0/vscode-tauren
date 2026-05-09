import * as assert from 'assert';
import { PassThrough } from 'stream';
import { attachJsonlLineReader, serializeJsonLine } from '../../piRpcProtocol';

suite('Pi RPC protocol helpers', () => {
  test('splits LF-delimited records and strips trailing CR', () => {
    const stream = new PassThrough();
    const lines: string[] = [];

    attachJsonlLineReader(stream, (line) => lines.push(line));
    stream.write('first\r\nsecond\n');

    assert.deepStrictEqual(lines, ['first', 'second']);
  });

  test('buffers partial records across chunks', () => {
    const stream = new PassThrough();
    const lines: string[] = [];

    attachJsonlLineReader(stream, (line) => lines.push(line));
    stream.write('par');
    stream.write('tial\nnext');
    stream.write('\n');

    assert.deepStrictEqual(lines, ['partial', 'next']);
  });

  test('preserves UTF-8 characters split across chunks', () => {
    const stream = new PassThrough();
    const lines: string[] = [];
    const chunk = Buffer.from('snow ☃\n', 'utf8');

    attachJsonlLineReader(stream, (line) => lines.push(line));
    stream.write(chunk.subarray(0, 6));
    stream.write(chunk.subarray(6));

    assert.deepStrictEqual(lines, ['snow ☃']);
  });

  test('emits a trailing final record when the stream ends', async () => {
    const stream = new PassThrough();
    const lines: string[] = [];

    attachJsonlLineReader(stream, (line) => lines.push(line));
    await endStream(stream, 'tail');

    assert.deepStrictEqual(lines, ['tail']);
  });

  test('remove listener cleanup stops future records', async () => {
    const stream = new PassThrough();
    const lines: string[] = [];
    const remove = attachJsonlLineReader(stream, (line) => lines.push(line));

    assert.strictEqual(stream.listenerCount('data'), 1);
    assert.strictEqual(stream.listenerCount('end'), 1);

    remove();

    assert.strictEqual(stream.listenerCount('data'), 0);
    assert.strictEqual(stream.listenerCount('end'), 0);

    stream.write('ignored\n');
    await endStream(stream, 'also ignored');

    assert.deepStrictEqual(lines, []);
  });

  test('serializes JSON values with a trailing newline', () => {
    assert.strictEqual(
      serializeJsonLine({ type: 'prompt', message: 'hello' }),
      '{"type":"prompt","message":"hello"}\n'
    );
  });
});

function endStream(stream: PassThrough, chunk: string): Promise<void> {
  return new Promise((resolve) => {
    stream.once('end', resolve);
    stream.end(chunk);
  });
}
