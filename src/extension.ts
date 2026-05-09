import * as vscode from 'vscode';
import { PiRpcClient, type RpcEvent } from './piRpcClient';

const viewType = 'piui.chatView';

type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  text: string;
  error?: boolean;
};

type WebviewMessage = {
  type?: unknown;
  text?: unknown;
};

export function activate(context: vscode.ExtensionContext): void {
  const provider = new PiChatViewProvider(context.extensionUri);

  context.subscriptions.push(
    provider,
    vscode.window.registerWebviewViewProvider(viewType, provider)
  );
}

export function deactivate(): void {}

class PiChatViewProvider implements vscode.WebviewViewProvider, vscode.Disposable {
  private webviewView: vscode.WebviewView | undefined;
  private client: PiRpcClient | undefined;
  private activeAssistantIndex: number | undefined;
  private busy = false;
  private readonly transcript: ChatMessage[] = [];
  private readonly disposables: vscode.Disposable[] = [];

  public constructor(private readonly extensionUri: vscode.Uri) {}

  public dispose(): void {
    for (const disposable of this.disposables.splice(0)) {
      disposable.dispose();
    }

    this.client?.dispose();
    this.client = undefined;
  }

  public resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.webviewView = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri]
    };

    webviewView.webview.html = this.getHtml();
    this.disposables.push(
      webviewView.webview.onDidReceiveMessage((message: WebviewMessage) => {
        void this.handleWebviewMessage(message);
      })
    );

    this.postState();
  }

  private async handleWebviewMessage(message: WebviewMessage): Promise<void> {
    if (message.type === 'ready') {
      this.postState();
      return;
    }

    if (message.type !== 'submit') {
      return;
    }

    const text = typeof message.text === 'string' ? message.text.trim() : '';

    if (!text || this.busy) {
      return;
    }

    this.transcript.push({ role: 'user', text });
    this.activeAssistantIndex = this.transcript.push({ role: 'assistant', text: '' }) - 1;
    this.busy = true;
    this.postState();

    try {
      await this.getClient().prompt(text);
    } catch (error) {
      this.markActiveAssistantError(getErrorMessage(error));
      this.busy = false;
      this.activeAssistantIndex = undefined;
      this.postState();
    }
  }

  private getClient(): PiRpcClient {
    if (this.client) {
      return this.client;
    }

    const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const client = new PiRpcClient({ cwd });
    this.client = client;
    this.disposables.push(
      { dispose: client.onEvent((event) => this.handleRpcEvent(event)) },
      { dispose: client.onError((message) => this.handleClientError(message)) }
    );

    return client;
  }

  private handleRpcEvent(event: RpcEvent): void {
    switch (event.type) {
      case 'agent_start':
        this.busy = true;
        this.postState();
        break;
      case 'message_update':
        this.handleMessageUpdate(event);
        break;
      case 'agent_end':
        this.busy = false;
        this.activeAssistantIndex = undefined;
        this.postState();
        break;
      case 'extension_ui_request':
        this.handleExtensionUiRequest(event);
        break;
      case 'extension_error':
        this.addErrorMessage(formatExtensionError(event));
        break;
      case 'response':
        this.handleUnmatchedResponse(event);
        break;
    }
  }

  private handleMessageUpdate(event: RpcEvent): void {
    const assistantMessageEvent = event.assistantMessageEvent;

    if (!isRecord(assistantMessageEvent)) {
      return;
    }

    if (assistantMessageEvent.type === 'text_delta') {
      const delta = typeof assistantMessageEvent.delta === 'string' ? assistantMessageEvent.delta : '';
      this.appendAssistantDelta(delta);
      return;
    }

    if (assistantMessageEvent.type === 'error') {
      const reason = getRecordString(assistantMessageEvent, 'reason')
        ?? getRecordString(assistantMessageEvent, 'error')
        ?? 'Pi reported an error while responding.';
      this.markActiveAssistantError(reason);
      this.postState();
    }
  }

  private handleExtensionUiRequest(event: RpcEvent): void {
    const method = typeof event.method === 'string' ? event.method : '';

    if (method === 'notify') {
      this.showNotification(event);
      return;
    }

    if (method === 'select' || method === 'confirm' || method === 'input' || method === 'editor') {
      const id = typeof event.id === 'string' ? event.id : undefined;

      if (id) {
        void this.client?.cancelExtensionUiRequest(id).catch((error) => {
          this.addErrorMessage(getErrorMessage(error));
        });
      }
    }
  }

  private showNotification(event: RpcEvent): void {
    const message = typeof event.message === 'string' ? event.message : 'Pi notification';
    const notifyType = typeof event.notifyType === 'string' ? event.notifyType : 'info';

    if (notifyType === 'error') {
      void vscode.window.showErrorMessage(message);
      return;
    }

    if (notifyType === 'warning') {
      void vscode.window.showWarningMessage(message);
      return;
    }

    void vscode.window.showInformationMessage(message);
  }

  private handleUnmatchedResponse(event: RpcEvent): void {
    if (event.success !== false) {
      return;
    }

    const error = typeof event.error === 'string' ? event.error : 'Pi command failed.';
    this.addErrorMessage(error);
  }

  private handleClientError(message: string): void {
    this.addErrorMessage(message);
    this.busy = false;
    this.postState();
  }

  private appendAssistantDelta(delta: string): void {
    if (!delta) {
      return;
    }

    const index = this.ensureActiveAssistantMessage();
    this.transcript[index].text += delta;
    this.postState();
  }

  private markActiveAssistantError(message: string): void {
    const index = this.ensureActiveAssistantMessage();
    this.transcript[index].text = message;
    this.transcript[index].error = true;
  }

  private addErrorMessage(message: string): void {
    if (this.activeAssistantIndex !== undefined) {
      this.markActiveAssistantError(message);
    } else {
      this.transcript.push({ role: 'system', text: message, error: true });
    }

    this.postState();
  }

  private ensureActiveAssistantMessage(): number {
    if (this.activeAssistantIndex !== undefined) {
      return this.activeAssistantIndex;
    }

    this.activeAssistantIndex = this.transcript.push({ role: 'assistant', text: '' }) - 1;
    return this.activeAssistantIndex;
  }

  private postState(): void {
    void this.webviewView?.webview.postMessage({
      type: 'state',
      messages: this.transcript,
      busy: this.busy
    });
  }

  private getHtml(): string {
    const nonce = getNonce();

    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <title>Pi</title>
  <style>
    :root {
      color-scheme: light dark;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
    }

    .pi-view {
      display: grid;
      grid-template-rows: 1fr auto;
      min-height: 100vh;
    }

    .messages {
      min-height: 0;
      padding: 12px;
      overflow-y: auto;
    }

    .empty-state {
      margin: 0;
      color: var(--vscode-descriptionForeground);
    }

    .message {
      margin: 0 0 14px;
    }

    .message:last-child {
      margin-bottom: 0;
    }

    .message__role {
      margin-bottom: 4px;
      color: var(--vscode-descriptionForeground);
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .message__body {
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      line-height: 1.45;
    }

    .message--user .message__body {
      color: var(--vscode-input-foreground);
    }

    .message--error .message__body {
      color: var(--vscode-errorForeground);
    }

    .status {
      margin-top: 8px;
      color: var(--vscode-descriptionForeground);
      font-size: 12px;
    }

    .composer {
      display: flex;
      padding: 10px 12px 12px;
      gap: 8px;
      align-items: flex-end;
      border-top: 1px solid var(--vscode-sideBar-border, transparent);
      background: var(--vscode-sideBar-background);
    }

    textarea {
      width: 100%;
      min-height: 38px;
      max-height: 140px;
      resize: vertical;
      padding: 8px 10px;
      color: var(--vscode-input-foreground);
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border, transparent);
      border-radius: 4px;
      font: inherit;
      line-height: 1.4;
    }

    textarea:focus {
      outline: 1px solid var(--vscode-focusBorder);
      outline-offset: -1px;
    }

    button {
      flex: 0 0 auto;
      min-height: 32px;
      padding: 5px 12px;
      color: var(--vscode-button-foreground);
      background: var(--vscode-button-background);
      border: 1px solid var(--vscode-button-border, transparent);
      border-radius: 4px;
      font: inherit;
      cursor: pointer;
    }

    button:hover:not(:disabled) {
      background: var(--vscode-button-hoverBackground);
    }

    button:focus {
      outline: 1px solid var(--vscode-focusBorder);
      outline-offset: 2px;
    }

    button:disabled {
      opacity: 0.6;
      cursor: default;
    }
  </style>
</head>
<body>
  <main class="pi-view">
    <section class="messages" aria-live="polite" aria-label="Pi conversation">
      <p class="empty-state">Ask Pi about this workspace.</p>
    </section>
    <form class="composer" aria-label="Pi message input">
      <textarea rows="1" aria-label="Message" placeholder="Ask Pi"></textarea>
      <button type="submit" disabled>Submit</button>
    </form>
  </main>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const messagesElement = document.querySelector('.messages');
    const form = document.querySelector('.composer');
    const textarea = document.querySelector('textarea');
    const submitButton = document.querySelector('button');
    let state = { messages: [], busy: false };

    window.addEventListener('message', (event) => {
      if (event.data?.type !== 'state') {
        return;
      }

      state = {
        messages: Array.isArray(event.data.messages) ? event.data.messages : [],
        busy: Boolean(event.data.busy)
      };
      render();
    });

    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      const text = textarea.value.trim();

      if (!text || state.busy) {
        return;
      }

      vscode.postMessage({ type: 'submit', text });
      textarea.value = '';
      syncSubmit();
    });

    textarea?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        form?.requestSubmit();
      }
    });

    textarea?.addEventListener('input', syncSubmit);

    function render() {
      messagesElement.replaceChildren();

      if (state.messages.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'empty-state';
        empty.textContent = 'Ask Pi about this workspace.';
        messagesElement.append(empty);
      }

      for (const message of state.messages) {
        messagesElement.append(createMessageElement(message));
      }

      if (state.busy) {
        const status = document.createElement('div');
        status.className = 'status';
        status.textContent = 'Pi is working...';
        messagesElement.append(status);
      }

      messagesElement.scrollTop = messagesElement.scrollHeight;
      syncSubmit();
    }

    function createMessageElement(message) {
      const article = document.createElement('article');
      article.className = \`message message--\${message.role}\${message.error ? ' message--error' : ''}\`;

      const role = document.createElement('div');
      role.className = 'message__role';
      role.textContent = roleLabel(message.role);

      const body = document.createElement('div');
      body.className = 'message__body';
      body.textContent = message.text || '';

      article.append(role, body);
      return article;
    }

    function roleLabel(role) {
      if (role === 'user') {
        return 'You';
      }

      if (role === 'assistant') {
        return 'Pi';
      }

      return 'System';
    }

    function syncSubmit() {
      submitButton.disabled = state.busy || textarea.value.trim().length === 0;
    }

    vscode.postMessage({ type: 'ready' });
    render();
  </script>
</body>
</html>`;
  }
}

function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let nonce = '';

  for (let index = 0; index < 32; index += 1) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return nonce;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getRecordString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
}

function formatExtensionError(event: RpcEvent): string {
  const extensionPath = typeof event.extensionPath === 'string' ? event.extensionPath : 'extension';
  const error = typeof event.error === 'string' ? event.error : 'Unknown extension error.';

  return `Pi ${extensionPath} error: ${error}`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
