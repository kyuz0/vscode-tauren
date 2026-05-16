import { StringDecoder } from 'string_decoder';
import type { RpcEvent, RpcResponse } from './types';

export type * from './types';

export function parseRpcEvent(value: unknown): RpcEvent | undefined {
  if (!isRecord(value) || typeof value.type !== 'string') {
    return undefined;
  }

  if (value.type === 'response') {
    return parseRpcResponseFromRecord(value);
  }

  return { ...value, type: value.type };
}

export function parseRpcResponse(value: unknown): RpcResponse | undefined {
  if (!isRecord(value) || value.type !== 'response') {
    return undefined;
  }

  return parseRpcResponseFromRecord(value);
}

export function attachJsonlLineReader(
  stream: NodeJS.ReadableStream,
  onLine: (line: string) => void
): () => void {
  const decoder = new StringDecoder('utf8');
  let buffer = '';

  const emitLine = (line: string): void => {
    onLine(line.endsWith('\r') ? line.slice(0, -1) : line);
  };

  const onData = (chunk: string | Buffer): void => {
    buffer += typeof chunk === 'string' ? chunk : decoder.write(chunk);

    while (true) {
      const newlineIndex = buffer.indexOf('\n');

      if (newlineIndex === -1) {
        return;
      }

      emitLine(buffer.slice(0, newlineIndex));
      buffer = buffer.slice(newlineIndex + 1);
    }
  };

  const onEnd = (): void => {
    buffer += decoder.end();

    if (buffer.length > 0) {
      emitLine(buffer);
      buffer = '';
    }
  };

  stream.on('data', onData);
  stream.on('end', onEnd);

  return () => {
    stream.off('data', onData);
    stream.off('end', onEnd);
  };
}

export function serializeJsonLine(value: unknown): string {
  return `${JSON.stringify(value)}\n`;
}

function parseRpcResponseFromRecord(record: Record<string, unknown>): RpcResponse {
  const response = omitKeys(record, ['type', 'command', 'id', 'success', 'error', 'data']) as RpcResponse;
  response.type = 'response';

  if (typeof record.command === 'string') {
    response.command = record.command;
  }

  if (typeof record.id === 'string') {
    response.id = record.id;
  }

  if (typeof record.success === 'boolean') {
    response.success = record.success;
  }

  if (typeof record.error === 'string') {
    response.error = record.error;
  }

  if ('data' in record) {
    response.data = record.data;
  }

  return response;
}

function omitKeys(record: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  const copy = { ...record };

  for (const key of keys) {
    delete copy[key];
  }

  return copy;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
