import {
  emptySessionDiffStats,
  SessionDiffTracker,
  type SessionDiffSnapshot,
  type SessionDiffStats,
  type ToolExecutionInput
} from './sessionDiffTracker';

export type SessionDiffControllerOptions = {
  initialSessionFile?: string;
  getSessionGeneration: () => number;
  postState: () => void;
  loadSnapshot?: (sessionFile: string) => SessionDiffSnapshot | undefined;
  saveSnapshot?: (sessionFile: string, snapshot: SessionDiffSnapshot) => void;
};

export class SessionDiffController {
  private currentSessionFile: string | undefined;
  private stats = emptySessionDiffStats();
  private refreshInFlight: Promise<void> | undefined;
  private readonly tracker: SessionDiffTracker;

  public constructor(private readonly options: SessionDiffControllerOptions) {
    this.currentSessionFile = options.initialSessionFile;
    this.tracker = new SessionDiffTracker(this.loadSnapshot(this.currentSessionFile));
    this.stats = this.tracker.getStats();
  }

  public getStats(): SessionDiffStats {
    return { ...this.stats };
  }

  public async refresh(): Promise<void> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    const sessionGeneration = this.options.getSessionGeneration();
    const refresh = this.tracker.restoreFromSessionFile(this.currentSessionFile)
      .then((stats) => {
        if (sessionGeneration !== this.options.getSessionGeneration()) {
          return;
        }

        this.applyStats(stats);
      })
      .finally(() => {
        if (this.refreshInFlight === refresh) {
          this.refreshInFlight = undefined;
        }
      });

    this.refreshInFlight = refresh;
    return refresh;
  }

  public reset(sessionFile: string | undefined): void {
    this.currentSessionFile = sessionFile;
    this.tracker.restore(this.loadSnapshot(sessionFile));
    this.stats = this.tracker.getStats();
    void this.refresh();
  }

  public applySessionFile(sessionFile: string | undefined): void {
    const previousSessionFile = this.currentSessionFile;
    const currentSnapshot = this.tracker.snapshot();
    this.currentSessionFile = sessionFile;

    if (sessionFile && !previousSessionFile && hasSessionDiffStats(currentSnapshot.stats) && !this.loadSnapshot(sessionFile)) {
      this.saveSnapshot();
      return;
    }

    this.tracker.restore(this.loadSnapshot(sessionFile));
    this.stats = this.tracker.getStats();
    void this.refresh();
  }

  public addToolExecution(input: unknown): void {
    const stats = this.tracker.addToolExecution(input as ToolExecutionInput);
    this.applyStats(stats);
  }

  private applyStats(stats: SessionDiffStats): void {
    const addedLines = normalizeDiffLineCount(stats.addedLines);
    const removedLines = normalizeDiffLineCount(stats.removedLines);

    this.saveSnapshot();

    if (addedLines === this.stats.addedLines && removedLines === this.stats.removedLines) {
      return;
    }

    this.stats = { addedLines, removedLines };
    this.options.postState();
  }

  private loadSnapshot(sessionFile: string | undefined): SessionDiffSnapshot | undefined {
    return sessionFile ? this.options.loadSnapshot?.(sessionFile) : undefined;
  }

  private saveSnapshot(): void {
    if (!this.currentSessionFile) {
      return;
    }

    this.options.saveSnapshot?.(this.currentSessionFile, this.tracker.snapshot());
  }
}

function normalizeDiffLineCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function hasSessionDiffStats(stats: SessionDiffStats | undefined): boolean {
  return Boolean(stats && (stats.addedLines > 0 || stats.removedLines > 0));
}
