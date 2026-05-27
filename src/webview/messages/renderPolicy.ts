import type { ChatMessage } from '../types';

export function shouldRenderMarkdown(message: Pick<ChatMessage, 'role' | 'error'>): boolean {
  return !message.error && message.role !== 'user';
}
