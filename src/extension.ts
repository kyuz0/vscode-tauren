import * as vscode from 'vscode';

const viewType = 'piui.chatView';

export function activate(context: vscode.ExtensionContext): void {
  const provider = new PiChatViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(viewType, provider)
  );
}

export function deactivate(): void {}

class PiChatViewProvider implements vscode.WebviewViewProvider {
  public constructor(private readonly extensionUri: vscode.Uri) {}

  public resolveWebviewView(webviewView: vscode.WebviewView): void {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri]
    };

    webviewView.webview.html = this.getHtml();
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
      padding: 0;
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
    }

    .pi-view {
      display: flex;
      min-height: 100vh;
      padding: 12px;
    }

    .composer {
      display: flex;
      width: 100%;
      margin-top: auto;
      gap: 8px;
      align-items: flex-end;
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

    button:hover {
      background: var(--vscode-button-hoverBackground);
    }

    button:focus {
      outline: 1px solid var(--vscode-focusBorder);
      outline-offset: 2px;
    }
  </style>
</head>
<body>
  <main class="pi-view">
    <form class="composer" aria-label="Pi message input">
      <textarea rows="1" aria-label="Message" placeholder="Ask Pi"></textarea>
      <button type="submit">Submit</button>
    </form>
  </main>

  <script nonce="${nonce}">
    const form = document.querySelector('.composer');

    form?.addEventListener('submit', (event) => {
      event.preventDefault();
    });
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
