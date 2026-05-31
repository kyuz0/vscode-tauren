# Sessions

Session code is split so Tauren can keep multiple live sessions open while preserving clear ownership.

## Core session state

`src/chat/chatSession.ts` is pure in-memory transcript and session state. It should not depend on VS Code or Pi process details.

Use this file for state operations that can be tested without launching the extension host.

## Open-session management

`src/sessions/taurenSessionManager.ts` owns the open-session switcher and coordinates multiple live `TaurenChatController` instances.

Supporting files include:

- `sessionViewController.ts` for extension-side session UI state,
- `sessionHistoryController.ts` for history adoption,
- `sessionClientActions.ts` for background session-client actions,
- `sessionFormatting.ts` for display formatting,
- `piSessionList.ts` for persisted Pi session JSONL parsing,
- `piSessionTree.ts` for SDK-backed tree formatting.

## Local slash commands

Session-related slash commands are implemented in `src/controller/localSlashCommandController.ts`.

Examples:

- `/new`
- `/resume`
- `/fork`
- `/clone`
- `/compact`
- `/export`
- `/share`
- `/import`

## Design constraints

- Keep session state testable without real Pi CLI calls.
- Do not treat locally cached transcript as the source of truth after reconnecting to a persisted session file.
- Restore sidebar history from Pi `getMessages()` when reconnecting.
- Keep background sessions running unless the user explicitly stops or replaces them.

## Testing

Run the full test suite after changing core session behavior:

```sh
npm test
```

For smaller changes, at least run compile and the relevant session tests.
