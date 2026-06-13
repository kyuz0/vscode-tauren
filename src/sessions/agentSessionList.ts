import { getKwardPathSetting } from '../settings/taurenSettings';
import type { WebviewSessionItem } from '../webviewProtocol/types';
import { listKwardSessions } from '../kward/sessionList';
import { listPiSessions } from './piSessionList';
import type { SessionListLoadMetrics } from './types';

export type AgentSessionBackend = 'pi' | 'kward';

export type ListAgentSessionsOptions = {
  backend: AgentSessionBackend;
  cwd?: string;
  currentSessionFile?: string;
  sessionMetadataCacheFile?: string;
  onProgress?: (sessions: WebviewSessionItem[]) => void;
  onMetrics?: (metrics: SessionListLoadMetrics) => void;
  previousSessions?: readonly WebviewSessionItem[];
};

export function listAgentSessions(options: ListAgentSessionsOptions): Promise<WebviewSessionItem[]> {
  if (options.backend === 'kward') {
    return listKwardSessions({
      cwd: options.cwd,
      currentSessionFile: options.currentSessionFile,
      kwardPath: getKwardPathSetting(),
      progress: {
        onProgress: options.onProgress,
        previousSessions: options.previousSessions
      }
    });
  }

  return listPiSessions({
    cwd: options.cwd,
    currentSessionFile: options.currentSessionFile,
    sessionMetadataCacheFile: options.sessionMetadataCacheFile,
    onProgress: options.onProgress,
    previousSessions: options.previousSessions,
    ...(options.onMetrics ? { onMetrics: options.onMetrics } : {})
  });
}
