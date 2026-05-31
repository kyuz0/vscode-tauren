# Adding Context

Good context makes Tauren more useful. The goal is to give the agent enough information to work accurately without flooding the session.

## File suggestions

Type `@` in the composer to search for workspace files. Accept a suggestion to add that file reference to your prompt.

Use this when a task depends on a specific file, test, configuration, or error log.

## Editor selection

Select code in VS Code and use:

- **Tauren: Add Context** to attach it as context.
- **Tauren: Send Selection to Composer** to place the selected text into the prompt.

Selections are useful for targeted questions:

```text
Explain why this function rejects paths outside the workspace.
```

## Images and attachments

Tauren supports image attachments in the composer where the active provider/model supports images. You can add images by drag-and-drop, paste, or file interaction depending on the environment.

## Remote images

By default, Tauren blocks remote HTTPS images embedded in chat markdown. This protects against unwanted external image requests from rendered assistant output.

Change `tauren.blockHttpsImages` only if you trust the content and need remote image rendering.

## Practical context rules

- Add the smallest useful file or selection.
- Mention the expected outcome clearly.
- Include failing commands or error text when debugging.
- Tell Tauren what not to change if the task has boundaries.
- Start a new session for unrelated work.

A precise prompt with two relevant files usually beats a vague prompt with the whole project attached.
