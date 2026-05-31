# Trace Origin

Trace Origin helps connect code in your workspace back to the agent session that likely produced it.

## Why use it

Agent-assisted work can be hard to audit later. Trace Origin is Tauren's answer to questions like:

- Why does this code exist?
- Which session introduced it?
- What prompt led to this implementation?
- Was there related reasoning or context?

## Run Trace Origin

Select code in the editor, then run **Tauren: Trace Origin** from the Command Palette or editor context menu.

Tauren searches available session history and Git context to find relevant session origins. If it finds a useful match, you can reopen the related session and inspect the transcript and diffs.

## Example workflow: suspicious generated code

You are reviewing a pull request and find code that looks generated or overly broad:

```ts
if (process.env.NODE_ENV !== 'test') {
  await refreshAllProviderMetadata({ force: true });
}
```

The code may be valid, but you do not remember why it was added.

1. Select the suspicious lines in the editor.
2. Run **Tauren: Trace Origin** from the Command Palette or editor context menu.
3. Tauren searches session history and Git context for likely matches.
4. When Tauren identifies the originating session, reopen it.
5. Read the nearby conversation: the prompt, the assistant response, and any tool calls around the edit.
6. Open the session diff for that session.
7. Compare the original task with the current code.

A useful result might show that the code came from a session named `Fix metadata refresh during startup`. The transcript explains that tests were timing out because provider metadata refreshed too often, and the session diff shows only the startup path was changed.

Now you can decide whether the code still makes sense, should be narrowed, or should be removed. Trace Origin improves transparency by turning "where did this come from?" into a reviewable session, diff, and conversation history.

## What works best

Trace Origin is most useful when:

- sessions are named,
- changes were made through Tauren,
- session diffs were tracked,
- Git commits are reasonably scoped,
- selected code is specific enough to match.

Small, distinctive selections usually work better than selecting an entire file.

## What to do after tracing

Once you find the likely origin:

1. Read the surrounding transcript.
2. Check the tool calls and file edits.
3. Open the session diff.
4. Compare the original intent with the current code.

Trace Origin is a review aid. It should make history easier to inspect, not replace code review.
