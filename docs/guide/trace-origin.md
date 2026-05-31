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
