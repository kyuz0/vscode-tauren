import type { SpawnOptions } from 'node:child_process';

export type ReadyScriptProcess = {
  once(event: 'error', listener: (error: Error) => void): unknown;
  unref(): void;
};

export type ReadyScriptSpawnFactory = (
  command: string,
  args: readonly string[],
  options: SpawnOptions
) => ReadyScriptProcess;

export type RunReadyScriptOptions = {
  spawnFactory?: ReadyScriptSpawnFactory;
  onError?: (message: string) => void;
};

export type ReadyScriptStreamingBehavior = 'steer' | 'followUp';

export type ReadyScriptArmSnapshot = {
  currentRunArmed: boolean;
  queuedRuns: number;
};
