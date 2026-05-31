# Commands

Tauren contributes these VS Code commands. Run them from the Command Palette or from the UI locations where they are exposed.

| Command | Title | Use |
| --- | --- | --- |
| `tauren.newSession` | New Session | Start a fresh Tauren/Pi session. |
| `tauren.resume` | Toggle Session List | Open or close the session list. |
| `tauren.fork` | Fork Session | Fork from a previous user message. |
| `tauren.clone` | Clone Session | Duplicate the current session. |
| `tauren.showSessionTree` | Toggle Session Tree | Open or close the Pi session tree. |
| `tauren.toggleSessionList` | Toggle Session List | Open or close the session list. |
| `tauren.openSessionDiff` | Open Session Diff | Review changes tracked for the current session. |
| `tauren.renameSession` | Rename Session | Rename the active session. |
| `tauren.compactSession` | Compact Session | Compact the current session context. |
| `tauren.exportSession` | Export as HTML | Export the current session to an HTML file. |
| `tauren.moveSessionToTrash` | Move to Trash | Move the selected/current session to Trash. |
| `tauren.reloadPi` | Reload Pi Engine | Reload Pi runtime resources or restart/reconnect when needed. |
| `tauren.copyLastResponse` | Copy Last Response | Copy the most recent assistant response. |
| `tauren.searchTranscript` | Search in Transcript | Open transcript search. |
| `tauren.scrollTranscriptToTop` | Scroll Transcript to Top | Jump to the top of the transcript. |
| `tauren.scrollTranscriptToBottom` | Scroll Transcript to Bottom | Jump to the bottom of the transcript. |
| `tauren.openModelPicker` | Open Model Picker | Open model and thinking controls. |
| `tauren.raiseThinkingLevel` | Raise Thinking Level | Increase the active thinking level. |
| `tauren.lowerThinkingLevel` | Lower Thinking Level | Decrease the active thinking level. |
| `tauren.toggleSettings` | Toggle Settings | Open or close Tauren settings. |
| `tauren.toggleHelp` | Toggle Help | Open or close sidebar help. |
| `tauren.stop` | Stop Current Response | Stop the active response. |
| `tauren.toggleSteerFollowUp` | Toggle Steer / Follow-up | Switch steering/follow-up behavior while busy. |
| `tauren.addContext` | Add Context | Add editor context to the Tauren composer/session. |
| `tauren.sendSelectionToComposer` | Send Selection to Composer | Put the active editor selection into the composer. |
| `tauren.traceOrigin` | Trace Origin | Find likely session origin for selected code. |
| `tauren.showDiagnostics` | Show Diagnostics | Open Tauren diagnostics. |

Notes:

- `tauren.resume` and `tauren.toggleSessionList` are both current commands for opening the Session List Lane.
- Slash-command equivalents are listed separately in [Slash Commands](./slash-commands.md).

## Default keybindings

These keybindings apply when the Tauren sidebar has focus:

| Key | macOS | Command |
| --- | --- | --- |
| `Ctrl+N` | `Cmd+N` | New session |
| `Ctrl+F` | `Cmd+F` | Search transcript |
| `Ctrl+Up` | `Cmd+Up` | Scroll transcript to top |
| `Ctrl+Down` | `Cmd+Down` | Scroll transcript to bottom |
