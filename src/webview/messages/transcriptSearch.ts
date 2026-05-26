export type TranscriptSearchMatchRange = {
  start: number;
  end: number;
};

type TranscriptSearchMatchView = {
  elements: HTMLElement[];
};

type TextSegment = {
  node: Text;
  start: number;
  end: number;
};

type SegmentMatch = {
  index: number;
  start: number;
  end: number;
};

export type TranscriptSearchControllerOptions = {
  messagesElement: HTMLElement;
  messagesContentElement: HTMLElement;
  isChatMainVisible: () => boolean;
  onClose: () => void;
};

export class TranscriptSearchController {
  private readonly element: HTMLElement;
  private readonly input: HTMLInputElement;
  private readonly countElement: HTMLElement;
  private readonly previousButton: HTMLButtonElement;
  private readonly nextButton: HTMLButtonElement;
  private readonly closeButton: HTMLButtonElement;
  private query = '';
  private open = false;
  private pendingFocus = false;
  private matches: TranscriptSearchMatchView[] = [];
  private currentIndex: number | undefined;

  public constructor(private readonly options: TranscriptSearchControllerOptions) {
    const { element, input, countElement, previousButton, nextButton, closeButton } = createTranscriptSearchElement();
    this.element = element;
    this.input = input;
    this.countElement = countElement;
    this.previousButton = previousButton;
    this.nextButton = nextButton;
    this.closeButton = closeButton;

    this.options.messagesElement.parentElement?.insertBefore(this.element, this.options.messagesElement);
    this.attachEventListeners();
    this.syncVisibility();
  }

  public openSearch(): void {
    this.open = true;
    this.pendingFocus = true;
    this.syncVisibility();
    this.refreshHighlights({ resetCurrent: this.currentIndex === undefined });
  }

  public closeSearch(): void {
    if (!this.open && !this.query) {
      return;
    }

    this.open = false;
    this.pendingFocus = false;
    this.query = '';
    this.input.value = '';
    this.currentIndex = undefined;
    this.clearHighlights();
    this.syncVisibility();
    this.options.onClose();
  }

  public syncForRender(): void {
    this.syncVisibility();

    if (this.open && this.query) {
      this.refreshHighlights({ preserveCurrent: true });
    }
  }

  public refreshHighlights(options: { resetCurrent?: boolean; preserveCurrent?: boolean } = {}): void {
    this.clearHighlights();

    const query = this.query;
    if (!query) {
      this.matches = [];
      this.currentIndex = undefined;
      this.syncCount();
      return;
    }

    this.matches = highlightTranscriptMatches(this.options.messagesContentElement, query);

    if (this.matches.length === 0) {
      this.currentIndex = undefined;
      this.syncCount();
      return;
    }

    if (options.resetCurrent || this.currentIndex === undefined) {
      this.currentIndex = 0;
    } else if (options.preserveCurrent) {
      this.currentIndex = Math.min(this.currentIndex, this.matches.length - 1);
    }

    this.syncCurrentMatch({ scroll: Boolean(this.open && this.options.isChatMainVisible()) });
  }

  public handleGlobalKeydown(event: KeyboardEvent): boolean {
    if (isTranscriptSearchShortcut(event)) {
      if (!this.options.isChatMainVisible()) {
        return false;
      }

      event.preventDefault();
      event.stopPropagation();
      this.openSearch();
      return true;
    }

    if (event.key === 'Escape' && this.open && isWithinElement(event.target, this.element)) {
      event.preventDefault();
      event.stopPropagation();
      this.closeSearch();
      return true;
    }

    return false;
  }

  private attachEventListeners(): void {
    this.input.addEventListener('input', () => {
      this.query = this.input.value;
      this.refreshHighlights({ resetCurrent: true });
    });

    this.input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        this.moveCurrentMatch(event.shiftKey ? -1 : 1);
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        this.closeSearch();
      }
    });

    this.previousButton.addEventListener('click', () => this.moveCurrentMatch(-1));
    this.nextButton.addEventListener('click', () => this.moveCurrentMatch(1));
    this.closeButton.addEventListener('click', () => this.closeSearch());
  }

  private moveCurrentMatch(direction: -1 | 1): void {
    this.currentIndex = moveTranscriptSearchMatchIndex(this.currentIndex, this.matches.length, direction);
    this.syncCurrentMatch({ scroll: true });
    this.input.focus({ preventScroll: true });
  }

  private syncCurrentMatch(options: { scroll: boolean }): void {
    const current = this.currentIndex;

    for (const element of this.options.messagesContentElement.querySelectorAll('.tauren-transcript-search-match--current')) {
      element.classList.remove('tauren-transcript-search-match--current');
    }

    if (current === undefined) {
      this.syncCount();
      return;
    }

    const match = this.matches[current];
    for (const element of match?.elements ?? []) {
      element.classList.add('tauren-transcript-search-match--current');
    }

    if (options.scroll) {
      match?.elements[0]?.scrollIntoView({ block: 'center', inline: 'nearest' });
    }

    this.syncCount();
  }

  private syncCount(): void {
    if (!this.query) {
      this.countElement.textContent = '';
    } else if (this.matches.length === 0 || this.currentIndex === undefined) {
      this.countElement.textContent = 'No results';
    } else {
      this.countElement.textContent = `${this.currentIndex + 1}/${this.matches.length}`;
    }

    const disabled = this.matches.length === 0;
    this.previousButton.disabled = disabled;
    this.nextButton.disabled = disabled;
  }

  private syncVisibility(): void {
    const visible = this.open && this.options.isChatMainVisible();
    this.element.classList.toggle('tauren-transcript-search--open', visible);
    this.element.setAttribute('aria-hidden', visible ? 'false' : 'true');
    this.element.inert = !visible;

    if (visible && this.pendingFocus) {
      this.pendingFocus = false;
      requestAnimationFrame(() => {
        if (this.open && this.options.isChatMainVisible()) {
          this.input.focus({ preventScroll: true });
          this.input.select();
        }
      });
    }
  }

  private clearHighlights(): void {
    clearTranscriptSearchHighlights(this.options.messagesContentElement);
    this.matches = [];
  }
}

export function findPlainTextMatches(text: string, query: string): TranscriptSearchMatchRange[] {
  const normalizedQuery = query.toLocaleLowerCase();

  if (!text || !normalizedQuery) {
    return [];
  }

  const normalizedText = text.toLocaleLowerCase();
  const matches: TranscriptSearchMatchRange[] = [];
  let index = normalizedText.indexOf(normalizedQuery);

  while (index !== -1) {
    matches.push({ start: index, end: index + normalizedQuery.length });
    index = normalizedText.indexOf(normalizedQuery, index + normalizedQuery.length);
  }

  return matches;
}

export function moveTranscriptSearchMatchIndex(currentIndex: number | undefined, matchCount: number, direction: -1 | 1): number | undefined {
  if (matchCount <= 0) {
    return undefined;
  }

  if (currentIndex === undefined || currentIndex < 0 || currentIndex >= matchCount) {
    return direction < 0 ? matchCount - 1 : 0;
  }

  return (currentIndex + direction + matchCount) % matchCount;
}

function highlightTranscriptMatches(root: HTMLElement, query: string): TranscriptSearchMatchView[] {
  const { text, segments } = collectTranscriptText(root);
  const ranges = findPlainTextMatches(text, query);

  if (ranges.length === 0) {
    return [];
  }

  for (let segmentIndex = segments.length - 1; segmentIndex >= 0; segmentIndex -= 1) {
    const segment = segments[segmentIndex];
    const overlaps = getSegmentMatches(segment, ranges);

    if (overlaps.length > 0) {
      wrapSegmentMatches(segment.node, overlaps);
    }
  }

  return ranges.map((_range, index) => ({
    elements: Array.from(root.querySelectorAll<HTMLElement>(`[data-transcript-search-match-index="${index}"]`))
  }));
}

function collectTranscriptText(root: HTMLElement): { text: string; segments: TextSegment[] } {
  const segments: TextSegment[] = [];
  let text = '';
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => isSearchableTranscriptTextNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
  });
  let current = walker.nextNode();

  while (current) {
    const node = current as Text;
    const value = node.textContent ?? '';
    segments.push({ node, start: text.length, end: text.length + value.length });
    text += value;
    current = walker.nextNode();
  }

  return { text, segments };
}

function getSegmentMatches(segment: TextSegment, ranges: TranscriptSearchMatchRange[]): SegmentMatch[] {
  const matches: SegmentMatch[] = [];

  for (const [index, range] of ranges.entries()) {
    const start = Math.max(range.start, segment.start);
    const end = Math.min(range.end, segment.end);

    if (start < end) {
      matches.push({ index, start: start - segment.start, end: end - segment.start });
    }
  }

  return matches;
}

function wrapSegmentMatches(node: Text, matches: SegmentMatch[]): void {
  let currentNode = node;

  for (const match of matches.sort((a, b) => b.start - a.start)) {
    const after = currentNode.splitText(match.end);
    const matched = currentNode.splitText(match.start);
    const marker = document.createElement('mark');
    marker.className = 'tauren-transcript-search-match';
    marker.dataset.transcriptSearchMatchIndex = String(match.index);
    marker.append(matched);
    currentNode.parentNode?.insertBefore(marker, after);
  }
}

function clearTranscriptSearchHighlights(root: HTMLElement): void {
  const markers = Array.from(root.querySelectorAll<HTMLElement>('.tauren-transcript-search-match'));

  for (const marker of markers) {
    const text = document.createTextNode(marker.textContent ?? '');
    marker.replaceWith(text);
    text.parentElement?.normalize();
  }
}

function isSearchableTranscriptTextNode(node: Node): boolean {
  const text = node.textContent ?? '';
  const parent = node.parentElement;

  return Boolean(parent && text && !parent.closest([
    '.tauren-transcript-search',
    '.tauren-icon-action-tooltip',
    '.message__actions',
    '.tauren-code-block__actions',
    'button',
    'input',
    'textarea',
    'select',
    '[hidden]',
    '[aria-hidden="true"]'
  ].join(',')));
}

function createTranscriptSearchElement(): {
  element: HTMLElement;
  input: HTMLInputElement;
  countElement: HTMLElement;
  previousButton: HTMLButtonElement;
  nextButton: HTMLButtonElement;
  closeButton: HTMLButtonElement;
} {
  const element = document.createElement('div');
  element.className = 'tauren-transcript-search';
  element.setAttribute('role', 'search');

  const input = document.createElement('input');
  input.className = 'tauren-transcript-search__input';
  input.type = 'search';
  input.placeholder = 'Search transcript';
  input.setAttribute('aria-label', 'Search transcript');
  input.spellcheck = false;

  const countElement = document.createElement('span');
  countElement.className = 'tauren-transcript-search__count';
  countElement.setAttribute('aria-live', 'polite');

  const previousButton = createSearchButton('Previous match', 'up');
  const nextButton = createSearchButton('Next match', 'down');
  const closeButton = createCloseButton();

  const actions = document.createElement('span');
  actions.className = 'tauren-transcript-search__actions';
  actions.setAttribute('role', 'group');
  actions.setAttribute('aria-label', 'Transcript search navigation');
  actions.append(previousButton, nextButton, closeButton);

  element.append(input, countElement, actions);
  return { element, input, countElement, previousButton, nextButton, closeButton };
}

function createSearchButton(label: string, direction: 'up' | 'down'): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = 'tauren-transcript-search__button';
  button.type = 'button';
  button.setAttribute('aria-label', label);
  button.innerHTML = direction === 'up'
    ? '<svg aria-hidden="true" width="15" height="15" viewBox="0 0 18 18" fill="none"><path d="M4.5 11.25L9 6.75L13.5 11.25" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    : '<svg aria-hidden="true" width="15" height="15" viewBox="0 0 18 18" fill="none"><path d="M4.5 6.75L9 11.25L13.5 6.75" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  return button;
}

function createCloseButton(): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = 'tauren-transcript-search__button tauren-transcript-search__button--close';
  button.type = 'button';
  button.setAttribute('aria-label', 'Close transcript search');
  button.innerHTML = '<svg aria-hidden="true" width="15" height="15" viewBox="0 0 18 18" fill="none"><path d="M5.25 5.25L12.75 12.75M12.75 5.25L5.25 12.75" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';
  return button;
}

function isTranscriptSearchShortcut(event: KeyboardEvent): boolean {
  return event.key.toLowerCase() === 'f' && (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey;
}

function isWithinElement(target: EventTarget | null, element: HTMLElement): boolean {
  return target instanceof Node && element.contains(target);
}
