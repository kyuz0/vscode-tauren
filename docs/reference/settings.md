# Settings

This page lists Tauren-owned VS Code settings. Pi-owned runtime settings are available inside the Tauren settings UI and are stored by Pi.

## Appearance

| Setting | Default | Description |
| --- | --- | --- |
| `tauren.outputColors` | `true` | Enable ANSI and syntax colors in Tauren output boxes. When disabled, ANSI escape sequences are stripped. |
| `tauren.animationsEnabled` | `true` | Enable animations in the Tauren sidebar. Reduced-motion preferences still disable motion. |
| `tauren.showWelcome` | `true` | Show the Welcome to Tauren empty state for new chats. |
| `tauren.customUiTheme` | `default` | Visual theme for Pi extension custom UI terminal panels. Options: `default`, `modern`, `crt`, `amber`, `matrix`. |

## Extension surfaces

| Setting | Default | Description |
| --- | --- | --- |
| `tauren.extensions.aboveWidgetsEnabled` | `true` | Show Pi extension widgets above the composer. |
| `tauren.extensions.belowWidgetsEnabled` | `true` | Show Pi extension widgets below the composer. |
| `tauren.extensions.statusBarEnabled` | `true` | Show one-line Pi extension status updates below the composer. |
| `tauren.extensions.backgroundColorsEnabled` | `true` | Render background colors sent by Pi extension widgets. |
| `tauren.extensions.monospaceFontEnabled` | `true` | Use the editor monospace font for Pi extension widgets and status. |

## Safety

| Setting | Default | Description |
| --- | --- | --- |
| `tauren.blockHttpsImages` | `true` | Block remote HTTPS images in Tauren chat markdown while still allowing Pi image data and workspace images. |
| `tauren.confirmSessionDeletion` | `true` | Ask for confirmation before moving Tauren sessions to Trash. |
| `tauren.restrictFileReferencesToWorkspace` | `true` | Only open Tauren sidebar file references when they resolve inside the workspace. |
| `tauren.rejectEditWriteOutsideWorkspace` | `false` | Reject Pi edit/write tool mutations outside the active workspace folder. This does not restrict shell commands. |

## Advanced

| Setting | Default | Description |
| --- | --- | --- |
| `tauren.debugPerformance` | `false` | Collect Tauren performance diagnostics in the output channel and diagnostics view. |
| `tauren.readyScript` | `""` | Path to an executable script to run when Pi becomes ready. Relative paths resolve from the workspace folder. |
| `tauren.readyScriptEnabled` | `true` | Enable or temporarily disable the configured ready script. |

## Pi runtime settings

The Tauren settings UI also exposes Pi-owned runtime controls such as provider, model, thinking level, compaction, retry, steering, follow-up behavior, image handling, enabled models, and skill commands.

Pi remains the source of truth for those values. Tauren displays and edits them through the SDK runtime.
