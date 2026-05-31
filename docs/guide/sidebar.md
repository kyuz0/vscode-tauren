# Tauren Sidebar

The Tauren sidebar is the main interface for working with Pi inside VS Code.

## Main surfaces

Tauren uses a three-lane model:

```text
| Session List | Chat | Session Tree |
```

- **Session List Lane:** browse, search, rename, fork, clone, compact, export, or delete sessions.
- **Chat Lane:** read the transcript, send prompts, use the composer, and open settings.
- **Session Tree Lane:** navigate the Pi session tree for the active session.

The center lane can also show settings. In Tauren's UI language this is the **Settings Face** of the Chat Lane.

## Composer

The composer is where you type prompts and slash commands. It supports:

- `Enter` to send,
- `Shift+Enter` for a newline,
- `/` slash-command suggestions,
- `@` file suggestions,
- pasted or dropped image attachments where supported.

Submit is disabled while Pi is streaming. Tauren does not queue follow-up prompts behind a running response.

## Busy state

When Pi is running, Tauren shows busy state in the chat surface. Use **Stop Current Response** if the run should end early.

If file changes are detected, Tauren can show session diff status so you can review what changed before committing.

## Settings and help

Use the title toolbar buttons or slash commands:

```text
/settings
/hotkeys
```

Settings are split between Tauren-owned controls and Pi-owned runtime controls. Pi remains the source of truth for model and provider state.
