export type WebviewDom = {
  toolbarTitleElement: HTMLButtonElement;
  toolbarTitleTextElement: HTMLElement;
  sessionToggleButton: HTMLButtonElement;
  sessionMenuElement: HTMLElement;
  messagesElement: HTMLElement;
  sessionsElement: HTMLElement;
  form: HTMLFormElement;
  textarea: HTMLTextAreaElement;
  slashMenuElement: HTMLElement;
  contextBadgesElement: HTMLElement;
  busySubmitElement: HTMLElement;
  busySubmitHintElement: HTMLElement;
  streamingBehaviorButtonElements: HTMLButtonElement[];
  newSessionButton: HTMLButtonElement;
  contextElement: HTMLElement;
  contextValueElement: HTMLElement;
  contextTooltipElement: HTMLElement;
  modelElement: HTMLButtonElement;
  modelMenuElement: HTMLElement;
  modelSelectElement: HTMLSelectElement;
  thinkingSelectElement: HTMLSelectElement;
  submitButton: HTMLButtonElement;
};

export function getWebviewDom(): WebviewDom {
  return {
    toolbarTitleElement: queryRequired<HTMLButtonElement>('.pi-toolbar__title'),
    toolbarTitleTextElement: queryRequired<HTMLElement>('.pi-toolbar__title-text'),
    sessionToggleButton: queryRequired<HTMLButtonElement>('.pi-toolbar__sessions'),
    sessionMenuElement: queryRequired<HTMLElement>('.pi-toolbar__session-menu'),
    messagesElement: queryRequired<HTMLElement>('.messages'),
    sessionsElement: queryRequired<HTMLElement>('.sessions'),
    form: queryRequired<HTMLFormElement>('.composer'),
    textarea: queryRequired<HTMLTextAreaElement>('textarea'),
    slashMenuElement: queryRequired<HTMLElement>('.composer__slash-menu'),
    contextBadgesElement: queryRequired<HTMLElement>('.composer__context-badges'),
    busySubmitElement: queryRequired<HTMLElement>('.composer__busy-submit'),
    busySubmitHintElement: queryRequired<HTMLElement>('.composer__busy-submit-hint'),
    streamingBehaviorButtonElements: queryAll<HTMLButtonElement>('.composer__mode-button'),
    newSessionButton: queryRequired<HTMLButtonElement>('.composer__add'),
    contextElement: queryRequired<HTMLElement>('.composer__context'),
    contextValueElement: queryRequired<HTMLElement>('.composer__context-value'),
    contextTooltipElement: queryRequired<HTMLElement>('.composer__context-tooltip'),
    modelElement: queryRequired<HTMLButtonElement>('.composer__model'),
    modelMenuElement: queryRequired<HTMLElement>('.composer__model-menu'),
    modelSelectElement: queryRequired<HTMLSelectElement>('.composer__model-select'),
    thinkingSelectElement: queryRequired<HTMLSelectElement>('.composer__thinking-select'),
    submitButton: queryRequired<HTMLButtonElement>('.composer__submit')
  };
}

function queryRequired<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Missing required webview element: ${selector}`);
  }

  return element;
}

function queryAll<T extends Element>(selector: string): T[] {
  return Array.from(document.querySelectorAll<T>(selector));
}
