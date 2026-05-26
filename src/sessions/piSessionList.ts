import { existsSync, type Stats } from 'fs';
import { readdir, readFile, stat } from 'fs/promises';
import { homedir } from 'os';
import { dirname, isAbsolute, join, resolve } from 'path';
import { readSessionJsonlHeader } from '../pi/sessionJsonl';
import { readSessionMetadataCache, writeSessionMetadataCache, type CachedSessionInfo } from './sessionMetadataCache';
import { readSessionSummary } from './sessionSummaryParser';
import type { ListPiSessionsOptions, PiSessionCandidate, PiSessionListItem, RawSessionInfo, SessionTreeNode } from './types';
export type { ListPiSessionsOptions, PiSessionCandidate, PiSessionListItem } from './types';

const piSessionDirEnvName = 'PI_CODING_AGENT_SESSION_DIR';
const maxConcurrentSessionFileReads = 8;
const maxCachedSessionInfos = 5000;
const sessionListProgressBatchSize = 50;

const sessionInfoCache = new Map<string, { mtimeMs: number; size: number; session: RawSessionInfo }>();

type SessionFileStats = {
  path: string;
  stats: Stats;
};

export async function listPiSessions(options: ListPiSessionsOptions = {}): Promise<PiSessionListItem[]> {
  const env = options.env ?? process.env;
  const sessionDir = options.sessionDir
    ?? await resolveConfiguredSessionDir(options.cwd, options.currentSessionFile, env);
  const sessions = sessionDir ? await listSessionsFromDir(sessionDir, options) : [];

  return decorateSessions(sessions, options.currentSessionFile);
}

export async function listPiSessionCandidates(options: ListPiSessionsOptions = {}): Promise<PiSessionCandidate[]> {
  const env = options.env ?? process.env;
  const sessionDir = options.sessionDir
    ?? await resolveConfiguredSessionDir(options.cwd, options.currentSessionFile, env);

  return sessionDir ? listSessionCandidatesFromDir(sessionDir) : [];
}

async function listSessionsFromDir(sessionDir: string, options: ListPiSessionsOptions): Promise<RawSessionInfo[]> {
  if (!existsSync(sessionDir)) {
    return [];
  }

  let names: string[];

  try {
    names = await readdir(sessionDir);
  } catch {
    return [];
  }

  const fileStats = await mapWithConcurrency(
    names
      .filter((name) => name.endsWith('.jsonl'))
      .map((name) => join(sessionDir, name)),
    maxConcurrentSessionFileReads,
    statSessionFile
  );
  const existingFiles = fileStats.filter((file): file is SessionFileStats => Boolean(file));
  const persistedCache = await readSessionMetadataCache(options.sessionMetadataCacheFile);
  const cachedEntries: CachedSessionInfo[] = [];
  const filesToParse: SessionFileStats[] = [];

  for (const file of existingFiles) {
    const cached = persistedCache.get(file.path);

    if (cached && cached.mtimeMs === file.stats.mtimeMs && cached.size === file.stats.size) {
      cachedEntries.push({
        mtimeMs: cached.mtimeMs,
        size: cached.size,
        session: { ...cached.session, path: file.path }
      });
    } else {
      filesToParse.push(file);
    }
  }

  const parsedEntries: CachedSessionInfo[] = [];
  const publishProgress = (): void => {
    options.onProgress?.(decorateSessions(
      [...cachedEntries, ...parsedEntries].map((entry) => entry.session),
      options.currentSessionFile
    ));
  };

  if (cachedEntries.length > 0) {
    publishProgress();
  }

  await parseSessionInfoFiles(filesToParse, (entry) => {
    parsedEntries.push(entry);

    if (parsedEntries.length % sessionListProgressBatchSize === 0) {
      publishProgress();
    }
  });

  const entries = [...cachedEntries, ...parsedEntries];
  options.onMetrics?.({
    sessionCount: entries.length,
    totalBytes: existingFiles.reduce((total, file) => total + file.stats.size, 0),
    cacheHits: cachedEntries.length,
    cacheMisses: filesToParse.length
  });

  if (parsedEntries.length > 0 || persistedCache.size !== entries.length) {
    await writeSessionMetadataCache(options.sessionMetadataCacheFile, entries);
  }

  return entries.map((entry) => entry.session);
}

async function listSessionCandidatesFromDir(sessionDir: string): Promise<PiSessionCandidate[]> {
  if (!existsSync(sessionDir)) {
    return [];
  }

  let names: string[];

  try {
    names = await readdir(sessionDir);
  } catch {
    return [];
  }

  const sessions = await mapWithConcurrency(
    names
      .filter((name) => name.endsWith('.jsonl'))
      .map((name) => join(sessionDir, name)),
    maxConcurrentSessionFileReads,
    buildSessionCandidate
  );

  return sessions.filter((session): session is PiSessionCandidate => Boolean(session));
}

function decorateSessions(
  sessions: RawSessionInfo[],
  currentSessionFile: string | undefined
): PiSessionListItem[] {
  const currentPath = canonicalizePath(currentSessionFile);

  return flattenSessionTree(buildSessionTree(sessions)).map((item) => ({
    ...item,
    current: currentPath !== undefined && canonicalizePath(item.path) === currentPath
  }));
}

async function resolveConfiguredSessionDir(
  cwd: string | undefined,
  currentSessionFile: string | undefined,
  env: NodeJS.ProcessEnv
): Promise<string | undefined> {
  const envSessionDir = env[piSessionDirEnvName];

  if (envSessionDir) {
    return resolveSessionDirPath(envSessionDir, cwd);
  }

  const settingsSessionDir = await readConfiguredSessionDir(cwd);

  if (settingsSessionDir) {
    return resolveSessionDirPath(settingsSessionDir, cwd);
  }

  if (cwd) {
    return getDefaultSessionDir(cwd);
  }

  return currentSessionFile ? dirname(currentSessionFile) : undefined;
}

async function readConfiguredSessionDir(cwd: string | undefined): Promise<string | undefined> {
  const [globalSettings, projectSettings] = await Promise.all([
    readSettings(join(homedir(), '.pi', 'agent', 'settings.json')),
    cwd ? readSettings(join(cwd, '.pi', 'settings.json')) : Promise.resolve(undefined)
  ]);

  const value = projectSettings?.sessionDir ?? globalSettings?.sessionDir;
  return typeof value === 'string' && value ? value : undefined;
}

async function readSettings(path: string): Promise<{ sessionDir?: unknown } | undefined> {
  try {
    const content = await readFile(path, 'utf8');
    const parsed: unknown = JSON.parse(content);
    return isRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function getDefaultSessionDir(cwd: string): string {
  const safePath = `--${cwd.replace(/^[/\\]/, '').replace(/[/\\:]/g, '-')}--`;
  return join(getDefaultSessionsRoot(), safePath);
}

function getDefaultSessionsRoot(): string {
  return join(homedir(), '.pi', 'agent', 'sessions');
}

function resolveSessionDirPath(path: string, cwd: string | undefined): string {
  const expanded = expandTildePath(path);
  return isAbsolute(expanded) || !cwd ? expanded : resolve(cwd, expanded);
}

function expandTildePath(path: string): string {
  if (path === '~') {
    return homedir();
  }

  if (path.startsWith('~/')) {
    return join(homedir(), path.slice(2));
  }

  return path;
}

async function buildSessionCandidate(filePath: string): Promise<PiSessionCandidate | undefined> {
  try {
    const stats = await stat(filePath);
    const header = await readSessionJsonlHeader(filePath);

    if (!header || typeof header.id !== 'string') {
      return undefined;
    }

    return {
      path: filePath,
      id: header.id,
      cwd: typeof header.cwd === 'string' ? header.cwd : undefined,
      mtimeMs: stats.mtimeMs,
      size: stats.size
    };
  } catch {
    return undefined;
  }
}

async function buildSessionInfo(filePath: string, knownStats?: Stats): Promise<RawSessionInfo | undefined> {
  try {
    const stats = knownStats ?? await stat(filePath);
    const cached = getCachedSessionInfo(filePath, stats);

    if (cached) {
      return cached;
    }

    const session = await readSessionSummary(filePath, stats);

    if (!session) {
      return undefined;
    }

    rememberSessionInfo(filePath, stats, session);
    return session;
  } catch {
    return undefined;
  }
}

async function statSessionFile(filePath: string): Promise<SessionFileStats | undefined> {
  try {
    return { path: filePath, stats: await stat(filePath) };
  } catch {
    return undefined;
  }
}

async function parseSessionInfoFiles(
  files: SessionFileStats[],
  onSession: (entry: CachedSessionInfo) => void
): Promise<void> {
  let nextIndex = 0;

  async function worker(): Promise<void> {
    for (;;) {
      const index = nextIndex;
      nextIndex += 1;

      if (index >= files.length) {
        return;
      }

      const file = files[index];
      const session = await buildSessionInfo(file.path, file.stats);

      if (session) {
        onSession({
          mtimeMs: file.stats.mtimeMs,
          size: file.stats.size,
          session
        });
      }
    }
  }

  const workerCount = Math.min(maxConcurrentSessionFileReads, files.length);
  await Promise.all(Array.from({ length: workerCount }, worker));
}

function getCachedSessionInfo(filePath: string, stats: Stats): RawSessionInfo | undefined {
  const cached = sessionInfoCache.get(filePath);

  if (!cached || cached.mtimeMs !== stats.mtimeMs || cached.size !== stats.size) {
    return undefined;
  }

  sessionInfoCache.delete(filePath);
  sessionInfoCache.set(filePath, cached);
  return { ...cached.session };
}

function rememberSessionInfo(filePath: string, stats: Stats, session: RawSessionInfo): void {
  if (sessionInfoCache.has(filePath)) {
    sessionInfoCache.delete(filePath);
  }

  sessionInfoCache.set(filePath, {
    mtimeMs: stats.mtimeMs,
    size: stats.size,
    session: { ...session }
  });

  if (sessionInfoCache.size <= maxCachedSessionInfos) {
    return;
  }

  const oldestKey = sessionInfoCache.keys().next().value;

  if (typeof oldestKey === 'string') {
    sessionInfoCache.delete(oldestKey);
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    for (;;) {
      const index = nextIndex;
      nextIndex += 1;

      if (index >= items.length) {
        return;
      }

      results[index] = await task(items[index]);
    }
  }

  const workerCount = Math.min(Math.max(limit, 1), items.length);
  await Promise.all(Array.from({ length: workerCount }, worker));
  return results;
}

function buildSessionTree(sessions: RawSessionInfo[]): SessionTreeNode[] {
  const byPath = new Map<string, SessionTreeNode>();

  for (const session of sessions) {
    byPath.set(canonicalizePath(session.path) ?? session.path, { session, children: [] });
  }

  const roots: SessionTreeNode[] = [];

  for (const session of sessions) {
    const sessionPath = canonicalizePath(session.path) ?? session.path;
    const node = byPath.get(sessionPath);

    if (!node) {
      continue;
    }

    const parentPath = canonicalizePath(session.parentSessionPath);

    if (parentPath && byPath.has(parentPath)) {
      byPath.get(parentPath)?.children.push(node);
    } else {
      roots.push(node);
    }
  }

  sortSessionTree(roots);
  return roots;
}

function sortSessionTree(nodes: SessionTreeNode[]): void {
  nodes.sort((left, right) => new Date(right.session.modified).getTime() - new Date(left.session.modified).getTime());

  for (const node of nodes) {
    sortSessionTree(node.children);
  }
}

function flattenSessionTree(roots: SessionTreeNode[]): Array<Omit<PiSessionListItem, 'current'>> {
  const result: Array<Omit<PiSessionListItem, 'current'>> = [];

  const walk = (
    node: SessionTreeNode,
    depth: number,
    ancestorContinues: boolean[],
    isLast: boolean
  ): void => {
    result.push({
      ...node.session,
      depth,
      isLast,
      ancestorContinues
    });

    node.children.forEach((child, index) => {
      walk(child, depth + 1, [...ancestorContinues, depth > 0 ? !isLast : false], index === node.children.length - 1);
    });
  };

  roots.forEach((root, index) => {
    walk(root, 0, [], index === roots.length - 1);
  });

  return result;
}

function canonicalizePath(path: string | undefined): string | undefined {
  return path ? resolve(path) : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
