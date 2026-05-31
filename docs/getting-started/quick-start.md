# Quick Start

This walkthrough creates a first Tauren session and shows the main controls you will use most often.

## 1. Open a project

Open the repository or workspace you want Tauren to work in. Tauren uses the first VS Code workspace folder as the Pi runtime working directory.

## 2. Open the Tauren sidebar

Select the Tauren icon in the Activity Bar. The sidebar opens to the chat surface.

The main pieces are:

- **Transcript:** the conversation and runtime output.
- **Composer:** the prompt box at the bottom.
- **Session List Lane:** the left-side session switcher, opened with `/resume` or the session-list command.
- **Session Tree Lane:** the right-side tree view, opened with `/tree`.
- **Settings Face:** Tauren and Pi settings, opened with the gear icon or `/settings`.

## 3. Confirm model and authentication

If Tauren asks for authentication or a model, use the settings flow to complete it. You can also run:

```text
/login
```

To change model later, use the model picker in the composer controls or run:

```text
/model
```

## 4. Send a prompt

Type a small request in the composer and press `Enter`.

Example:

```text
Summarize this repository and point out the main extension entry points.
```

Tauren streams the response in the transcript and shows tool activity as it happens.

## 5. Add context when needed

Use `@` in the composer to attach or reference files. You can also select code in the editor and use **Tauren: Add Context** or **Tauren: Send Selection to Composer**.

Prefer adding the smallest useful context. Tauren can inspect files, but direct context helps the agent start in the right place.

## 6. Review changes

When a session changes files, use **Open Session Diff** or the changes control in the busy bar to review the session diff.

Session diffs are scoped to the active Tauren session. They are meant to answer: "What did this agent session change?"

## 7. Continue later

Tauren sessions are resumable. Use:

```text
/resume
```

or **Tauren: Toggle Session List** to switch sessions.

## Useful first commands

| Command | Use |
| --- | --- |
| `/settings` or **Tauren: Toggle Settings** | Open Tauren settings. |
| `/model` or **Tauren: Open Model Picker** | Select a model. |
| `/resume` or **Tauren: Toggle Session List** | Open the session list. |
| `/tree` or **Tauren: Toggle Session Tree** | Open the Pi session tree. |
| `/reload` or **Tauren: Reload Pi Engine** | Reload Pi runtime resources after extension, skill, prompt, or theme changes. |
| **Tauren: Send Selection to Composer** | Put the active editor selection into the composer. |
| **Tauren: Trace Origin** | Find the likely Tauren session origin for selected code. |
| **Tauren: Show Diagnostics** | Open diagnostics for startup, SDK, extension, or performance issues. |
| `/hotkeys` | Show keyboard shortcuts. |
| `/session` | Print session information and stats. |

Next: read the [Sessions guide](../guide/sessions.md) to understand Tauren's workflow model.
