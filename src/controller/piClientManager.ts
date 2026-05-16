import type { PiRpcClientFactory, PiRpcClientLike } from '../rpc/clientTypes';
import type { PiRpcClientOptions, RpcEvent } from '../rpc/types';

type DisposableLike = {
  dispose(): void;
};

export type PiClientManagerOptions = {
  createClient: PiRpcClientFactory;
  getCwd?: () => string | undefined;
  getPiPath?: () => string | undefined;
  getCurrentSessionFile: () => string | undefined;
  getSessionGeneration: () => number;
  onEvent: (event: RpcEvent) => void;
  onError: (message: string) => void;
};

export class PiClientManager {
  private client: PiRpcClientLike | undefined;
  private nextSessionFile: string | undefined;
  private restartWhenIdle = false;
  private readonly disposables: DisposableLike[] = [];

  public constructor(private readonly options: PiClientManagerOptions) {}

  public get hasClient(): boolean {
    return Boolean(this.client);
  }

  public setNextSessionFile(sessionFile: string | undefined): void {
    this.nextSessionFile = sessionFile;
  }

  public requestRestartWhenIdle(): void {
    this.restartWhenIdle = true;
  }

  public getExistingClient(): PiRpcClientLike | undefined {
    if (!this.client?.isRunning()) {
      return undefined;
    }

    return this.client;
  }

  public getClient(): PiRpcClientLike {
    if (this.client) {
      return this.client;
    }

    const sessionFile = this.nextSessionFile ?? this.options.getCurrentSessionFile();
    this.nextSessionFile = undefined;

    const clientOptions: PiRpcClientOptions = { cwd: this.options.getCwd?.() };
    const piPath = this.options.getPiPath?.();

    if (piPath) {
      clientOptions.piPath = piPath;
    }

    if (sessionFile) {
      clientOptions.sessionFile = sessionFile;
    }

    const client = this.options.createClient(clientOptions);
    const sessionGeneration = this.options.getSessionGeneration();
    this.client = client;

    this.disposables.push(
      { dispose: client.onEvent((event) => {
        if (sessionGeneration === this.options.getSessionGeneration()) {
          this.options.onEvent(event);
        }
      }) },
      { dispose: client.onError((message) => {
        if (sessionGeneration === this.options.getSessionGeneration()) {
          this.options.onError(message);
        }
      }) }
    );

    return client;
  }

  public restartIfIdle(busy: boolean, beforeRestart?: () => void): boolean {
    if (!this.restartWhenIdle || busy) {
      return false;
    }

    this.restartNow(beforeRestart);
    return true;
  }

  public restartNow(beforeRestart?: () => void): void {
    this.restartWhenIdle = false;
    beforeRestart?.();
    this.disposeClient();
  }

  public disposeClient(): void {
    for (const disposable of this.disposables.splice(0)) {
      disposable.dispose();
    }

    this.client?.dispose();
    this.client = undefined;
  }
}
