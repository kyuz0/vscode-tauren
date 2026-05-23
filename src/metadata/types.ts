import type { SettingValue, PiSettingId } from '../settings/settingsRegistry';
import type { WebviewModelOption, WebviewSlashCommand } from '../webviewProtocol/types';

export type TauChatModelMeta = {
  label: string;
  provider: string;
  id: string;
  reasoning: boolean;
  thinkingLevel: string;
};

export type TauChatContextUsage = {
  label: string;
  title: string;
  level: string;
};

export type TauChatSessionMetaSnapshot = {
  model?: TauChatModelMeta;
  modelOptions?: WebviewModelOption[];
  contextUsage?: TauChatContextUsage;
};

export type PiRuntimeSettingsMeta = Partial<Record<PiSettingId, SettingValue>>;

export type SessionMetadataWebviewState = {
  model: {
    label: string;
    provider: string;
    id: string;
    reasoning: boolean;
    thinkingLevel: string;
    options: WebviewModelOption[];
  };
  contextUsage: TauChatContextUsage;
  metadataRefreshing: boolean;
  slashCommands: WebviewSlashCommand[];
  slashCommandsRefreshing: boolean;
  piSettings: PiRuntimeSettingsMeta;
};

export type SessionMetadataCacheStorage = {
  get<T>(key: string): T | undefined;
  update(key: string, value: unknown): PromiseLike<void> | void;
};
