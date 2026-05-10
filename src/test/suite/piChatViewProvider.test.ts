import * as assert from 'assert';
import * as vscode from 'vscode';
import { PiChatViewProvider, type PiRpcClientLike } from '../../piChatViewProvider';
import type { WebviewStateMessage } from '../../chatWebview';
import type {
  ExtensionUiResponse,
  PiModel,
  PiSessionState,
  PiSessionStats,
  RpcEvent
} from '../../piRpcClient';

suite('PiChatViewProvider', () => {
  test('posts cached model metadata and persists refreshed model metadata', async () => {
    const workspaceState = new FakeMemento({
      'piui.cachedModelMeta': {
        label: 'cached-model High',
        provider: 'anthropic',
        id: 'cached-model',
        reasoning: true,
        thinkingLevel: 'high'
      }
    });
    const client = new FakePiClient({
      model: { provider: 'openai', id: 'live-model', reasoning: true },
      thinkingLevel: 'medium'
    });
    const provider = new PiChatViewProvider(
      vscode.Uri.file('/extension'),
      () => client,
      workspaceState
    );
    const view = new FakeWebviewView();

    provider.resolveWebviewView(view.asWebviewView());

    assert.strictEqual(lastPostedState(view).modelLabel, 'cached-model High');
    assert.strictEqual(client.stateCalls, 0);

    view.webview.fireMessage({ type: 'refreshMetadata' });
    await flushPromises();

    assert.strictEqual(lastPostedState(view).modelLabel, 'live-model Medium');
    assert.deepStrictEqual(workspaceState.get<unknown>('piui.cachedModelMeta'), {
      label: 'live-model Medium',
      provider: 'openai',
      id: 'live-model',
      reasoning: true,
      thinkingLevel: 'medium'
    });
    provider.dispose();
  });

  test('clears webview-specific disposables when views are replaced, disposed, or provider is disposed', () => {
    const provider = new PiChatViewProvider(vscode.Uri.file('/extension'), () => {
      throw new Error('Unexpected Pi client creation');
    });

    const first = new FakeWebviewView();
    provider.resolveWebviewView(first.asWebviewView());

    assert.strictEqual(first.webviewDisposableCount, 2);
    assert.strictEqual(first.disposedWebviewDisposableCount, 0);

    const second = new FakeWebviewView();
    provider.resolveWebviewView(second.asWebviewView());

    assert.strictEqual(first.disposedWebviewDisposableCount, 2);
    assert.strictEqual(second.webviewDisposableCount, 2);
    assert.strictEqual(second.disposedWebviewDisposableCount, 0);

    first.fireDispose();
    assert.strictEqual(second.disposedWebviewDisposableCount, 0);

    second.fireDispose();
    assert.strictEqual(second.disposedWebviewDisposableCount, 2);

    const third = new FakeWebviewView();
    provider.resolveWebviewView(third.asWebviewView());
    provider.dispose();

    assert.strictEqual(third.disposedWebviewDisposableCount, 2);
  });
});

class FakeWebviewView {
  public readonly webview = new FakeWebview();
  public visible = true;
  private readonly disposeListeners = new Set<() => void>();
  private readonly disposables: TrackableDisposable[] = [];

  public asWebviewView(): vscode.WebviewView {
    return this as unknown as vscode.WebviewView;
  }

  public onDidDispose(listener: () => void): vscode.Disposable {
    this.disposeListeners.add(listener);
    const disposable = new TrackableDisposable(() => {
      this.disposeListeners.delete(listener);
    });
    this.disposables.push(disposable);

    return disposable;
  }

  public show(_preserveFocus?: boolean): void {}

  public fireDispose(): void {
    for (const listener of [...this.disposeListeners]) {
      listener();
    }
  }

  public get webviewDisposableCount(): number {
    return this.disposables.length + this.webview.disposableCount;
  }

  public get disposedWebviewDisposableCount(): number {
    return this.disposables.filter((disposable) => disposable.disposed).length + this.webview.disposedDisposableCount;
  }
}

class FakeWebview {
  public options: vscode.WebviewOptions | undefined;
  public html = '';
  private readonly messageListeners = new Set<(message: unknown) => void>();
  private readonly disposables: TrackableDisposable[] = [];

  public asWebviewUri(uri: vscode.Uri): vscode.Uri {
    return uri;
  }

  public onDidReceiveMessage(listener: (message: unknown) => void): vscode.Disposable {
    this.messageListeners.add(listener);
    const disposable = new TrackableDisposable(() => {
      this.messageListeners.delete(listener);
    });
    this.disposables.push(disposable);

    return disposable;
  }

  public readonly messages: unknown[] = [];

  public postMessage(message: unknown): Promise<boolean> {
    this.messages.push(message);
    return Promise.resolve(true);
  }

  public fireMessage(message: unknown): void {
    for (const listener of [...this.messageListeners]) {
      listener(message);
    }
  }

  public get disposableCount(): number {
    return this.disposables.length;
  }

  public get disposedDisposableCount(): number {
    return this.disposables.filter((disposable) => disposable.disposed).length;
  }
}

class TrackableDisposable implements vscode.Disposable {
  public disposed = false;

  public constructor(private readonly onDispose: () => void) {}

  public dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    this.onDispose();
  }
}

class FakeMemento implements vscode.Memento {
  private readonly data = new Map<string, unknown>();

  public constructor(initial: Record<string, unknown> = {}) {
    for (const [key, value] of Object.entries(initial)) {
      this.data.set(key, value);
    }
  }

  public get<T>(key: string): T | undefined;
  public get<T>(key: string, defaultValue: T): T;
  public get<T>(key: string, defaultValue?: T): T | undefined {
    if (this.data.has(key)) {
      return this.data.get(key) as T;
    }

    return defaultValue;
  }

  public update(key: string, value: unknown): Thenable<void> {
    if (value === undefined) {
      this.data.delete(key);
    } else {
      this.data.set(key, value);
    }

    return Promise.resolve();
  }

  public keys(): readonly string[] {
    return [...this.data.keys()];
  }
}

class FakePiClient implements PiRpcClientLike {
  public stateCalls = 0;
  private disposed = false;
  private readonly state: PiSessionState;

  public constructor(state: PiSessionState) {
    this.state = state;
  }

  public onEvent(_listener: (event: RpcEvent) => void): () => void {
    return () => {};
  }

  public onError(_listener: (message: string) => void): () => void {
    return () => {};
  }

  public async prompt(_message: string): Promise<void> {}

  public isRunning(): boolean {
    return !this.disposed;
  }

  public async getState(): Promise<PiSessionState> {
    this.stateCalls += 1;
    return this.state;
  }

  public async getSessionStats(): Promise<PiSessionStats> {
    return {};
  }

  public async getAvailableModels(): Promise<{ models?: PiModel[] }> {
    return { models: [] };
  }

  public async setModel(_provider: string, _modelId: string): Promise<PiModel> {
    return {};
  }

  public async setThinkingLevel(_level: string): Promise<void> {}

  public async respondExtensionUiRequest(_response: ExtensionUiResponse): Promise<void> {}

  public dispose(): void {
    this.disposed = true;
  }
}

function lastPostedState(view: FakeWebviewView): WebviewStateMessage {
  for (let index = view.webview.messages.length - 1; index >= 0; index -= 1) {
    const message = view.webview.messages[index];

    if (isWebviewStateMessage(message)) {
      return message;
    }
  }

  assert.fail('Expected a state message to be posted');
}

function isWebviewStateMessage(value: unknown): value is WebviewStateMessage {
  return typeof value === 'object'
    && value !== null
    && 'type' in value
    && value.type === 'state';
}

async function flushPromises(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));
}
