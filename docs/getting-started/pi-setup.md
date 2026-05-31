# Pi Setup

Tauren uses Pi as its agent engine. The extension hosts Pi through the bundled SDK runtime instead of launching an external `pi` process for the main chat UI.

## What Tauren owns

Tauren owns the VS Code-facing workflow:

- the sidebar UI,
- transcript rendering,
- session switching,
- session diffs,
- editor context,
- custom UI rendering for Pi extensions,
- workspace safety controls.

## What Pi owns

Pi remains the source of truth for runtime behavior:

- provider authentication,
- model and thinking settings,
- session files and state,
- tool execution,
- skills, prompts, themes, and extensions,
- session tree operations.

Tauren caches some metadata for first paint, but live Pi state replaces that cache as soon as the runtime is available.

## Authentication

Open Tauren settings and use the **Login** section to configure provider credentials. Depending on your Pi setup, Tauren may also pick up existing Pi configuration.

You can also use slash commands:

```text
/login
/logout
```

## Reloading Pi resources

After changing Pi skills, prompts, extensions, themes, or keybindings, reload runtime resources with:

```text
/reload
```

or run **Tauren: Reload Pi Engine** from the Command Palette.

## Optional Pi CLI setup

The Pi CLI is useful if you also want to use Pi from a terminal. Tauren's main sidebar does not depend on spawning `pi --mode rpc`, but a normal Pi installation can still be useful for shared configuration and troubleshooting.

## Workspace directory

Tauren starts Pi with the first VS Code workspace folder as the runtime `cwd`. If you open the wrong folder, the agent may inspect or modify the wrong project. Open the intended workspace before starting new sessions.
