import { containsAnsiEscape, renderAnsiTextInto } from './ansi';
import { renderHighlightedCodeInto, renderMarkdownInto, type RenderMarkdownOptions } from './markdown';
import type { Activity, ChatMessage } from '../types';

const activityExpansion = new Map<string, boolean>();
const activityBodyExpansion = new Map<string, boolean>();

export function toggleActivityBodyExpansion(activityId: string): boolean {
  const next = !activityBodyExpansion.get(activityId);
  activityBodyExpansion.set(activityId, next);
  return next;
}

export type MessageRenderOptions = RenderMarkdownOptions & {
  outputColors?: boolean;
};

export function createMessageElement(
  message: ChatMessage,
  showRole: boolean,
  messageIndex?: number,
  options: MessageRenderOptions = {}
): HTMLElement {
  const article = document.createElement('article');
  article.className = `message message--${message.role}${message.error ? ' message--error' : ''}${message.variant === 'thinking' ? ' message--thinking' : ''}`;

  const body = document.createElement('div');
  body.className = 'message__body';

  if (message.role === 'assistant' && !message.error) {
    renderMarkdownInto(body, message.text || '', options);
  } else {
    body.textContent = message.text || '';
  }

  if (showRole) {
    const role = document.createElement('div');
    role.className = 'message__role';
    role.textContent = roleLabel(message.role);
    article.append(role);
  }

  const activities = Array.isArray(message.activities) ? message.activities : [];
  const hasBody = Boolean(message.text || message.error || activities.length === 0);

  if (message.role !== 'assistant') {
    article.append(body);
    return article;
  }

  if (activities.length > 0) {
    article.append(createActivityListElement(activities, messageIndex, options));
  }

  if (hasBody) {
    if (activities.length > 0) {
      body.classList.add('message__body--after-activities');
    }

    article.append(body);
  }

  if (canCopyAssistantMessage(message) && typeof messageIndex === 'number') {
    article.append(createCopyButtonElement(messageIndex));
  }

  return article;
}

export function updateMessageBodyElement(
  article: HTMLElement,
  message: ChatMessage,
  options: MessageRenderOptions = {}
): boolean {
  const body = getDirectMessageBodyElement(article);

  if (!body) {
    return false;
  }

  body.className = 'message__body';

  if (message.role === 'assistant' && Array.isArray(message.activities) && message.activities.length > 0) {
    body.classList.add('message__body--after-activities');
  }

  if (message.role === 'assistant' && !message.error) {
    renderMarkdownInto(body, message.text || '', options);
  } else {
    body.textContent = message.text || '';
  }

  return true;
}

function getDirectMessageBodyElement(article: HTMLElement): HTMLElement | undefined {
  for (const child of Array.from(article.children)) {
    if (child instanceof HTMLElement && child.classList.contains('message__body')) {
      return child;
    }
  }

  return undefined;
}

function canCopyAssistantMessage(message: ChatMessage): boolean {
  return message.role === 'assistant'
    && !message.error
    && message.variant !== 'thinking'
    && Boolean(message.text);
}

function createCopyButtonElement(messageIndex: number): HTMLElement {
  const actions = document.createElement('div');
  actions.className = 'message__actions';

  const button = document.createElement('button');
  button.className = 'message__copy';
  button.type = 'button';
  button.title = 'Copy response';
  button.setAttribute('aria-label', 'Copy response');
  button.dataset.copyMessageIndex = String(messageIndex);
  button.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false"><path fill="currentColor" d="M5 1.75A1.75 1.75 0 0 1 6.75 0h6.5A1.75 1.75 0 0 1 15 1.75v6.5A1.75 1.75 0 0 1 13.25 10h-1.5v1.25A1.75 1.75 0 0 1 10 13H3.75A1.75 1.75 0 0 1 2 11.25v-6.5A1.75 1.75 0 0 1 3.75 3H5V1.75Zm1.75-.25a.25.25 0 0 0-.25.25V3H10a1.75 1.75 0 0 1 1.75 1.75V8.5h1.5a.25.25 0 0 0 .25-.25v-6.5a.25.25 0 0 0-.25-.25h-6.5ZM3.75 4.5a.25.25 0 0 0-.25.25v6.5c0 .138.112.25.25.25H10a.25.25 0 0 0 .25-.25v-6.5A.25.25 0 0 0 10 4.5H3.75Z"/></svg>';

  actions.append(button);
  return actions;
}

function createActivityListElement(activities: Activity[], messageIndex: number | undefined, options: MessageRenderOptions): HTMLElement {
  const list = document.createElement('div');
  list.className = 'activity-list';

  for (const activity of activities) {
    list.append(createActivityElement(activity, messageIndex, options));
  }

  return list;
}

function createActivityElement(activity: Activity, messageIndex: number | undefined, options: MessageRenderOptions): HTMLElement {
  const details = document.createElement('details');
  details.className = `activity activity--${activity.kind || 'rpc'} activity--${activity.status || 'info'}`;

  const activityId = typeof activity.id === 'string' ? activity.id : '';
  const savedOpenState = activityExpansion.get(activityId);
  details.open = typeof savedOpenState === 'boolean'
    ? savedOpenState
    : activity.status === 'running' || shouldKeepActivityOpen(activity);

  details.addEventListener('toggle', () => {
    if (activityId) {
      activityExpansion.set(activityId, details.open);
    }
  });

  const summary = document.createElement('summary');
  summary.className = 'activity__summary';

  const title = document.createElement('span');
  title.className = 'activity__title';
  title.textContent = typeof activity.title === 'string' ? activity.title : 'Activity';

  const status = document.createElement('span');
  status.className = 'activity__status';
  status.textContent = activityStatusLabel(activity.status);

  summary.append(title, status);

  if (typeof activity.summary === 'string' && activity.summary.length > 0) {
    const description = document.createElement('span');
    description.className = 'activity__description';
    description.textContent = activity.summary;
    summary.append(description);
  }

  details.append(summary);

  if (typeof activity.body === 'string' && activity.body.length > 0) {
    const bodyExpanded = Boolean(activityId && activityBodyExpansion.get(activityId) && activity.expandedBody);
    const bodyText = bodyExpanded && typeof activity.expandedBody === 'string' ? activity.expandedBody : activity.body;
    const body = document.createElement(activity.code ? 'pre' : 'div');
    body.className = `activity__body${activity.code ? ' activity__body--code' : ' activity__body--markdown'}${bodyExpanded ? ' activity__body--expanded' : ''}`;

    if (activity.code) {
      renderCodeActivityBody(body, activity, bodyText, {
        bodyExpanded,
        messageIndex,
        outputColors: options.outputColors !== false
      });
    } else {
      renderMarkdownInto(body, bodyText);
    }

    details.append(body);

    if (bodyExpanded && shouldScrollExpandedBodyToBottom(activity.body)) {
      scheduleActivityBodyScrollToBottom(body);
    }
  }

  return details;
}

function renderCodeActivityBody(
  element: HTMLElement,
  activity: Activity,
  bodyText: string,
  options: { bodyExpanded: boolean; messageIndex: number | undefined; outputColors: boolean }
): void {
  const activityId = typeof activity.id === 'string' ? activity.id : '';
  const filePath = getReadActivityPath(activity, bodyText);
  const hasExpandedToggle = Boolean(options.bodyExpanded && activityId && typeof activity.expandedBody === 'string');
  const marker = !options.bodyExpanded && activityId && typeof activity.expandedBody === 'string'
    ? findTruncationMarker(bodyText)
    : undefined;

  if (filePath && !containsAnsiEscape(bodyText)) {
    renderHighlightedActivityCodeInto(element, bodyText, filePath, marker, activityId, options.messageIndex, hasExpandedToggle);
  } else {
    renderAnsiActivityCodeInto(element, bodyText, marker, activityId, options.messageIndex, options.outputColors);
  }

  if (hasExpandedToggle) {
    if (!bodyText.endsWith('\n')) {
      element.append(document.createTextNode('\n'));
    }

    appendActivityBodyToggle(element, 'Show less', activityId, options.messageIndex, true);
  }
}

function getReadActivityPath(activity: Activity, bodyText: string): string | undefined {
  if (activity.kind !== 'tool_execution' || typeof activity.title !== 'string' || containsAnsiEscape(bodyText)) {
    return undefined;
  }

  return parseReadActivityPath(activity.title);
}

function renderHighlightedActivityCodeInto(
  element: HTMLElement,
  bodyText: string,
  filePath: string,
  marker: TruncationMarker | undefined,
  activityId: string,
  messageIndex: number | undefined,
  renderAsChild = false
): void {
  if (!marker) {
    if (renderAsChild) {
      element.replaceChildren();
      appendHighlightedCodeChunk(element, bodyText, filePath);
      return;
    }

    if (!renderHighlightedCodeInto(element, bodyText, filePath)) {
      element.textContent = bodyText;
    }
    return;
  }

  element.replaceChildren();
  appendHighlightedCodeChunk(element, marker.before, filePath);
  appendActivityBodyToggle(element, marker.text, activityId, messageIndex, false);
  appendHighlightedCodeChunk(element, marker.after, filePath);
}

function appendHighlightedCodeChunk(element: HTMLElement, value: string, filePath: string): void {
  if (!value) {
    return;
  }

  const code = document.createElement('code');

  if (!renderHighlightedCodeInto(code, value, filePath)) {
    code.textContent = value;
  }

  element.append(code);
}

function renderAnsiActivityCodeInto(
  element: HTMLElement,
  bodyText: string,
  marker: TruncationMarker | undefined,
  activityId: string,
  messageIndex: number | undefined,
  outputColors: boolean
): void {
  if (!marker) {
    renderAnsiTextInto(element, bodyText, outputColors);
    return;
  }

  element.replaceChildren();
  appendAnsiCodeChunk(element, marker.before, outputColors);
  appendActivityBodyToggle(element, marker.text, activityId, messageIndex, false);
  appendAnsiCodeChunk(element, marker.after, outputColors);
}

function appendAnsiCodeChunk(element: HTMLElement, value: string, outputColors: boolean): void {
  if (!value) {
    return;
  }

  const chunk = document.createElement('span');
  renderAnsiTextInto(chunk, value, outputColors);
  element.append(...Array.from(chunk.childNodes));
}

type TruncationMarker = {
  before: string;
  text: string;
  after: string;
};

function findTruncationMarker(value: string): TruncationMarker | undefined {
  const markerPattern = /^\.\.\. \((?:\d+ (?:more|earlier)[^)]+|output truncated)\)$/m;
  const match = markerPattern.exec(value);

  if (!match || match.index === undefined) {
    return undefined;
  }

  const text = match[0];
  const markerStart = match.index;
  const markerEnd = markerStart + text.length;

  return {
    before: value.slice(0, markerStart),
    text,
    after: value.slice(markerEnd)
  };
}

function shouldScrollExpandedBodyToBottom(collapsedBody: string): boolean {
  const marker = findTruncationMarker(collapsedBody);
  return Boolean(marker && marker.before.length === 0);
}

function scheduleActivityBodyScrollToBottom(element: HTMLElement): void {
  const scroll = () => {
    element.scrollTop = element.scrollHeight;
  };

  requestAnimationFrame(() => {
    scroll();
    requestAnimationFrame(scroll);
  });
  setTimeout(scroll, 80);
  setTimeout(scroll, 220);
}

function appendActivityBodyToggle(
  element: HTMLElement,
  label: string,
  activityId: string,
  messageIndex: number | undefined,
  expanded: boolean
): void {
  const button = document.createElement('button');
  button.className = 'activity__body-toggle';
  button.type = 'button';
  button.textContent = label;
  button.title = expanded ? 'Collapse output' : 'Show full output';
  button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  button.dataset.activityBodyToggle = activityId;

  if (typeof messageIndex === 'number') {
    button.dataset.messageIndex = String(messageIndex);
  }

  element.append(button);
}

function parseReadActivityPath(title: string): string | undefined {
  const match = title.match(/^read\s+(.+?)(?::\d+(?:-\d+)?)?$/);
  return match?.[1];
}

function shouldKeepActivityOpen(activity: Activity): boolean {
  return typeof activity.body === 'string' && activity.body.length > 0;
}

function roleLabel(role: string): string {
  if (role === 'user') {
    return 'You';
  }

  if (role === 'assistant') {
    return 'Pi';
  }

  return 'System';
}

function activityStatusLabel(status: string | undefined): string {
  if (status === 'running') {
    return 'Running';
  }

  if (status === 'completed') {
    return 'Done';
  }

  if (status === 'error') {
    return 'Error';
  }

  return 'Info';
}
