# Settings

Tauren settings combine two kinds of state: Tauren-owned UI/workspace controls and Pi-owned runtime controls.

## Open settings

Use the gear icon in the Tauren view toolbar or run:

```text
/settings
```

To open scoped model configuration directly:

```text
/scoped-models
```

## Settings sections

Tauren groups settings into practical sections:

- **Login:** provider authentication.
- **Appearance:** sidebar colors, animation, welcome message, and custom UI theme.
- **Extensions:** Pi extension widgets and status rendering.
- **Runtime:** Pi provider, model, thinking, compaction, retry, steering, and follow-up behavior.
- **Scoped Models:** model cycling configuration.
- **Safety:** workspace and remote-content guardrails.
- **Advanced:** diagnostics and ready-script behavior.

## Tauren-owned settings

Tauren-owned settings affect the VS Code extension host and webview. Examples:

- `tauren.outputColors`
- `tauren.animationsEnabled`
- `tauren.customUiTheme`
- `tauren.blockHttpsImages`
- `tauren.restrictFileReferencesToWorkspace`
- `tauren.rejectEditWriteOutsideWorkspace`

Most Tauren-owned UI settings apply immediately.

## Pi-owned settings

Pi-owned settings affect the runtime. Examples include provider, model, thinking level, compaction, retry, and enabled model lists.

Pi remains the source of truth for those values. Tauren may show cached metadata on first paint, then refresh after the runtime starts.

## Safety settings

Two settings are especially important:

- `tauren.restrictFileReferencesToWorkspace`: only open sidebar file references that resolve inside the workspace.
- `tauren.rejectEditWriteOutsideWorkspace`: reject Pi edit/write tool mutations outside the active workspace folder.

The second setting does not restrict arbitrary shell commands. Treat it as a guardrail, not a sandbox.

## Ready script

`tauren.readyScript` points to an executable script Tauren runs when the Pi engine becomes ready. Relative paths resolve from the workspace folder.

Use it for lightweight workspace preparation. Avoid long-running scripts because they can make the runtime feel stuck.
