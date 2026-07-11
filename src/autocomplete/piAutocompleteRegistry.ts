import type { AutocompleteProviderFactory } from '@earendil-works/pi-coding-agent';
import { createTaurenBaseAutocompleteProvider, type PiAutocompleteItem, type PiAutocompleteProvider } from './baseProvider';
import type { ComposerCompletionApplication, ComposerCompletionApplied, ComposerCompletionRequest, ComposerCompletionResult } from './types';

const maxItems = 50;

type CachedCompletion = { requestId: string; item: PiAutocompleteItem; prefix: string; lines: string[]; cursorLine: number; cursorCol: number; provider: PiAutocompleteProvider };

/** Owns the Pi-only provider chain for one SDK client/runtime lifecycle. */
export class PiAutocompleteRegistry {
  private readonly factories: AutocompleteProviderFactory[] = [];
  private readonly completions = new Map<string, CachedCompletion>();
  private sequence = 0;

  public add(factory: AutocompleteProviderFactory): void {
    this.factories.push(factory);
  }

  public reset(): void {
    this.factories.length = 0;
    this.completions.clear();
  }

  public async complete(request: ComposerCompletionRequest, cwd: string | undefined, signal: AbortSignal): Promise<ComposerCompletionResult> {
    this.completions.clear();
    const parsed = parseRequest(request);
    if (!parsed || signal.aborted) {
      return { id: request.id, items: [] };
    }

    const provider = this.createProvider(cwd);
    try {
      const suggestions = await provider.getSuggestions(parsed.lines, parsed.cursorLine, parsed.cursorCol, { signal });
      if (signal.aborted || !suggestions || !isSuggestions(suggestions)) {
        return { id: request.id, items: [] };
      }

      const items = suggestions.items.slice(0, maxItems).map((item) => {
        const id = `completion-${++this.sequence}`;
        this.completions.set(id, { requestId: request.id, item, prefix: suggestions.prefix, ...parsed, provider });
        return { id, value: item.value, label: item.label, ...(item.description ? { description: item.description } : {}) };
      });
      return { id: request.id, items };
    } catch {
      return { id: request.id, items: [] };
    }
  }

  public apply(application: ComposerCompletionApplication): ComposerCompletionApplied | undefined {
    const cached = this.completions.get(application.itemId);
    this.completions.clear();
    if (!cached || cached.requestId !== application.id) {
      return undefined;
    }

    try {
      const applied = cached.provider.applyCompletion(cached.lines, cached.cursorLine, cached.cursorCol, cached.item, cached.prefix);
      if (!isApplied(applied)) {
        return undefined;
      }
      const text = applied.lines.join('\n');
      const selectionStart = lineColumnToOffset(applied.lines, applied.cursorLine, applied.cursorCol);
      return { id: application.id, text, selectionStart, selectionEnd: selectionStart };
    } catch {
      return undefined;
    }
  }

  private createProvider(cwd: string | undefined): PiAutocompleteProvider {
    let current = createTaurenBaseAutocompleteProvider(cwd);
    for (const factory of this.factories) {
      try {
        const next = (factory as unknown as (provider: PiAutocompleteProvider) => PiAutocompleteProvider)(current);
        if (isProvider(next)) {
          current = next;
        }
      } catch {
        // An extension provider is optional; retain the previous usable chain.
      }
    }
    return current;
  }
}

function parseRequest(request: ComposerCompletionRequest): { lines: string[]; cursorLine: number; cursorCol: number } | undefined {
  if (!Number.isInteger(request.selectionStart) || request.selectionStart < 0 || request.selectionStart !== request.selectionEnd || request.selectionStart > request.text.length) {
    return undefined;
  }
  const lines = request.text.split('\n');
  let offset = request.selectionStart;
  for (let cursorLine = 0; cursorLine < lines.length; cursorLine += 1) {
    const line = lines[cursorLine];
    if (offset <= line.length) {
      return { lines, cursorLine, cursorCol: offset };
    }
    offset -= line.length + 1;
  }
  return undefined;
}

function lineColumnToOffset(lines: string[], line: number, col: number): number {
  return lines.slice(0, line).reduce((offset, value) => offset + value.length + 1, 0) + col;
}

function isProvider(value: unknown): value is PiAutocompleteProvider {
  return typeof value === 'object' && value !== null && typeof (value as PiAutocompleteProvider).getSuggestions === 'function' && typeof (value as PiAutocompleteProvider).applyCompletion === 'function';
}
function isSuggestions(value: unknown): value is { prefix: string; items: PiAutocompleteItem[] } {
  return typeof value === 'object' && value !== null && typeof (value as { prefix?: unknown }).prefix === 'string' && Array.isArray((value as { items?: unknown }).items) && (value as { items: unknown[] }).items.every((item) => typeof item === 'object' && item !== null && typeof (item as PiAutocompleteItem).value === 'string' && typeof (item as PiAutocompleteItem).label === 'string' && ((item as PiAutocompleteItem).description === undefined || typeof (item as PiAutocompleteItem).description === 'string'));
}
function isApplied(value: unknown): value is { lines: string[]; cursorLine: number; cursorCol: number } {
  return typeof value === 'object' && value !== null && Array.isArray((value as { lines?: unknown }).lines) && (value as { lines: unknown[] }).lines.every((line) => typeof line === 'string') && Number.isInteger((value as { cursorLine?: unknown }).cursorLine) && Number.isInteger((value as { cursorCol?: unknown }).cursorCol) && (value as { cursorLine: number }).cursorLine >= 0 && (value as { cursorCol: number }).cursorCol >= 0;
}
