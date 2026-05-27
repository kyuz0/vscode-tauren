import * as vscode from 'vscode';
import {
  getPromptImageTooLargeMessage,
  getSupportedPromptImageMimeType,
  getUnsupportedPromptImageMessage,
  maxPromptImageBytes
} from './imageAttachments';

export type PromptImageAttachment = {
  id: string;
  type: 'image';
  data: string;
  mimeType: string;
  label: string;
  title: string;
  sizeBytes: number;
};

export type DroppedPromptImageFile = {
  data: string;
  label: string;
  title?: string;
  sizeBytes: number;
};

export async function createPromptImageAttachment(uri: vscode.Uri): Promise<PromptImageAttachment | string> {
  const mimeType = getSupportedPromptImageMimeType(uri.fsPath);
  const label = getPathBasename(uri.fsPath);

  if (!mimeType) {
    return getUnsupportedPromptImageMessage(label);
  }

  let stat: vscode.FileStat;
  try {
    stat = await vscode.workspace.fs.stat(uri);
  } catch {
    return `Cannot read attachment: ${label}.`;
  }

  if (stat.type !== vscode.FileType.File) {
    return `Unsupported attachment: ${label} is not a file.`;
  }

  if (stat.size > maxPromptImageBytes) {
    return getPromptImageTooLargeMessage(label);
  }

  let data: Uint8Array;
  try {
    data = await vscode.workspace.fs.readFile(uri);
  } catch {
    return `Cannot read attachment: ${label}.`;
  }

  return {
    id: createPromptImageId(),
    type: 'image',
    data: Buffer.from(data).toString('base64'),
    mimeType,
    label,
    title: uri.fsPath,
    sizeBytes: stat.size
  };
}

export function createPromptImageAttachmentFromDroppedFile(file: DroppedPromptImageFile): PromptImageAttachment | string {
  const label = file.label;
  const mimeType = getSupportedPromptImageMimeType(label);

  if (!mimeType) {
    return getUnsupportedPromptImageMessage(label);
  }

  if (file.sizeBytes > maxPromptImageBytes) {
    return getPromptImageTooLargeMessage(label);
  }

  return {
    id: createPromptImageId(),
    type: 'image',
    data: file.data,
    mimeType,
    label,
    title: file.title || label,
    sizeBytes: file.sizeBytes
  };
}

export function parseDroppedPromptImageUri(value: string): vscode.Uri | undefined {
  try {
    if (/^[a-zA-Z]:[\\/]/.test(value) || value.startsWith('/') || value.startsWith('\\\\')) {
      return vscode.Uri.file(value);
    }

    const uri = vscode.Uri.parse(value, true);
    return uri.scheme === 'file' || uri.scheme === 'vscode-remote' ? uri : undefined;
  } catch {
    return undefined;
  }
}

function getPathBasename(filePath: string): string {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const lastSlashIndex = normalizedPath.lastIndexOf('/');
  return lastSlashIndex === -1 ? normalizedPath : normalizedPath.slice(lastSlashIndex + 1);
}

function createPromptImageId(): string {
  return `prompt-image-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
