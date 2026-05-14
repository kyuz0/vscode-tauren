import { localSlashCommands as sharedLocalSlashCommands } from '../slashCommands';
import type { SlashCommand } from './types';

export const localSlashCommands: SlashCommand[] = sharedLocalSlashCommands.map((command) => ({ ...command }));

export const messagesBottomThreshold = 4;
export const maxTextareaHeight = 180;
export const minTextareaHeight = 22;
