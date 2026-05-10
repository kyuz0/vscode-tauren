import { renderMarkdownInto } from './markdown';
import type { Activity, ChatMessage } from './types';

const activityExpansion = new Map<string, boolean>();

export function createMessageElement(message: ChatMessage, showRole: boolean): HTMLElement {
  const article = document.createElement('article');
  article.className = `message message--${message.role}${message.error ? ' message--error' : ''}${message.variant === 'thinking' ? ' message--thinking' : ''}`;

  const body = document.createElement('div');
  body.className = 'message__body';

  if (message.role === 'assistant' && !message.error) {
    renderMarkdownInto(body, message.text || '');
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
    article.append(createActivityListElement(activities));
  }

  if (hasBody) {
    if (activities.length > 0) {
      body.classList.add('message__body--after-activities');
    }

    article.append(body);
  }

  return article;
}

function createActivityListElement(activities: Activity[]): HTMLElement {
  const list = document.createElement('div');
  list.className = 'activity-list';

  for (const activity of activities) {
    list.append(createActivityElement(activity));
  }

  return list;
}

function createActivityElement(activity: Activity): HTMLElement {
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
    const body = document.createElement(activity.code ? 'pre' : 'div');
    body.className = `activity__body${activity.code ? ' activity__body--code' : ' activity__body--markdown'}`;

    if (activity.code) {
      body.textContent = activity.body;
    } else {
      renderMarkdownInto(body, activity.body);
    }

    details.append(body);
  }

  return details;
}

function shouldKeepActivityOpen(activity: Activity): boolean {
  return activity.kind === 'thinking'
    && typeof activity.body === 'string'
    && activity.body.length > 0;
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
