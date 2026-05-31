# Diff Lifecycle

Tauren's session diff system tracks file changes by session. It is separate from Git and exists to make agent work reviewable.

## Main files

- `src/diff/sessionDiffController.ts` owns controller integration, session-file binding, snapshot restore/save, refresh dedupe, and state posting.
- `src/diff/sessionDiffTracker.ts` owns changed-line baselines, net line diff stats, reconstructed per-file snapshot diffs, and edit/write fallback diffs.
- `src/diff/sessionDiffViewer.ts` owns read-only virtual snapshot documents and the VS Code multi-file diff adapter.
- `src/diff/sessionDiffUri.ts` owns Tauren diff URI helpers.
- `src/diff/sessionDiffStorage.ts` owns storage and file-watcher helpers.

## Why not just Git diff

Git diff answers: "What differs from Git history?"

Tauren session diff answers: "What changed during this session?"

Those are related but not identical, especially with background sessions, resumed sessions, generated files, or unrelated local edits.

## Tracking model

The tracker maintains per-session baselines and reconstructs diffs from observed file state. Tool edit/write records provide fallback detail when available.

The viewer presents those snapshots through read-only virtual documents so VS Code can display a normal diff UI.

## Contributor guidance

- Keep Git integration separate from session-diff tracking.
- Do not replace the sidebar counter or session changes view with raw `git diff`.
- Keep the current VS Code diff adapter isolated so a future custom annotated diff UI can replace it later.
- Add tests for tracker behavior when changing diff reconstruction logic.

## Verification

For diff changes, verify:

- fresh session edits,
- resumed sessions,
- write tool output,
- edit tool output,
- deleted or renamed files where applicable,
- background session changes,
- unsupported or generated files.
