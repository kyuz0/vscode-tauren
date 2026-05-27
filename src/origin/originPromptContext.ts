import * as vscode from 'vscode';
import type { PiPromptContextInput, PiPromptTraceOriginLinkedCommit } from '../prompt/types';
import type { TraceOriginInput, TraceOriginMatch } from './sessionOriginTracer';

export function createTraceOriginInputs(context: PiPromptContextInput[], document: vscode.TextDocument): TraceOriginInput[] {
  const absolutePath = document.uri.scheme === 'file' ? document.uri.fsPath : undefined;

  return context.map((entry) => ({
    kind: entry.kind,
    path: entry.path,
    absolutePath,
    text: entry.text
  }));
}

export function createGitOriginPromptContext(
  context: PiPromptContextInput[],
  traceLinkedCommit: PiPromptTraceOriginLinkedCommit
): PiPromptContextInput[] {
  return context.map((entry) => ({
    ...entry,
    source: 'origin',
    label: `Origin: ${entry.label ?? getPathBasename(entry.path)}`,
    title: `${entry.title ?? entry.path}\nGit commit: ${traceLinkedCommit.shortSha} ${traceLinkedCommit.subject}`,
    traceOrigin: {
      currentRelativePath: entry.path,
      git: { traceLinkedCommit }
    }
  }));
}

export function createOriginPromptContext(
  context: PiPromptContextInput[],
  match: TraceOriginMatch,
  traceLinkedCommit: PiPromptTraceOriginLinkedCommit | undefined
): PiPromptContextInput[] {
  return context.map((entry) => ({
    ...entry,
    source: 'origin',
    label: `Origin: ${entry.label ?? getPathBasename(entry.path)}`,
    title: `${entry.title ?? entry.path}\nTraced to Tauren session: ${match.sessionPath}`,
    traceOrigin: {
      historicalPath: match.filePath,
      currentRelativePath: entry.path,
      origin: {
        ...(match.sessionId ? { sessionId: match.sessionId } : {}),
        toolName: match.toolName,
        ...(match.recordId ? { recordId: match.recordId } : {}),
        ...(match.timestamp ? { matchedAt: match.timestamp } : {}),
        ...(match.sessionEndedAt ? { sessionEndedAt: match.sessionEndedAt } : {})
      },
      ...(traceLinkedCommit ? { git: { traceLinkedCommit } } : {})
    }
  }));
}

function getPathBasename(filePath: string): string {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const lastSlashIndex = normalizedPath.lastIndexOf('/');
  return lastSlashIndex === -1 ? normalizedPath : normalizedPath.slice(lastSlashIndex + 1);
}
