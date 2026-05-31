# Session Diffs

Session diffs show what changed during a Tauren session. They are designed for agent review, not as a replacement for Git.

## What session diffs answer

Use session diffs to answer:

- Which files did this session touch?
- How many lines changed?
- What did the agent write or edit?
- Does the final result match the prompt?

Tauren tracks diffs per session. That matters when multiple sessions are open or running in the background.

## Open a session diff

Use **Tauren: Open Session Diff** from the Command Palette, the view toolbar, or the changes control shown during a run.

Tauren opens a read-only comparison based on the session's tracked snapshot. Review it like any other VS Code diff.

## How Tauren tracks changes

Tauren maintains per-session changed-line baselines and reconstructed file snapshots. It also records edit/write tool output as a fallback when needed.

This is intentionally separate from `git diff`:

- Git shows repository state relative to Git history.
- Tauren shows changes attributable to a session.

Those views often overlap, but they are not the same thing.

## When to use Git too

Always use Git before committing. Session diffs help with review, but Git remains the source of truth for repository history.

A good review loop is:

1. Ask Tauren to make or explain a change.
2. Open the session diff.
3. Inspect the actual files.
4. Run tests or compile.
5. Use `git diff` before committing.

## Limitations

Session diffs are best for file edits and writes that happen while Tauren is tracking the active workspace. They may be less useful if external tools rewrite large files, generated output changes, or shell commands mutate files in ways the agent did not explicitly report.

For generated files, prefer reviewing source changes first and regenerate only when needed.
