import type { RpcEvent } from '../rpc/types';

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export function isUnsupportedReloadCommandError(error: unknown): boolean {
  return /unknown command:?\s+reload/i.test(getErrorMessage(error));
}

export function isAbortMessage(message: string): boolean {
  return message.trim().toLowerCase() === 'aborted';
}

export function isClientLifecycleError(message: string): boolean {
  const normalized = message.trim().toLowerCase();

  return normalized.startsWith('pi rpc process exited')
    || normalized.startsWith('failed to start pi rpc process')
    || normalized.startsWith('failed to parse pi rpc output')
    || normalized.startsWith('received malformed pi rpc output')
    || normalized.includes('pi rpc process is not running')
    || normalized.includes('pi rpc client disposed');
}

export function isMessageUpdateStart(event: RpcEvent): boolean {
  const assistantMessageEvent = event.assistantMessageEvent;

  return typeof assistantMessageEvent === 'object'
    && assistantMessageEvent !== null
    && 'type' in assistantMessageEvent
    && assistantMessageEvent.type === 'start';
}
