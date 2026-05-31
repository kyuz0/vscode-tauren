# Pi Extensions

Tauren supports Pi extensions through a VS Code/webview bridge. This lets extensions built for the Pi runtime appear inside the Tauren sidebar without depending directly on VS Code APIs.

## What Tauren can render

Tauren supports several extension UI surfaces:

- notifications,
- confirms,
- input prompts,
- selection dialogs,
- widgets above and below the composer,
- one-line status/footer text,
- custom terminal-style UI surfaces,
- ANSI output and terminal keyboard input.

The bridge is intentionally runtime-oriented. Extensions describe UI intent through Pi APIs; Tauren decides how that intent appears in the sidebar.

## Widgets and status

Pi extensions can add small UI elements around the composer. Tauren exposes settings for:

- above-composer widgets,
- below-composer widgets,
- status/footer text,
- background colors,
- monospace font rendering.

Open **Settings → Extensions** to adjust these.

## Custom UI themes

The `tauren.customUiTheme` setting changes the visual style of terminal-like extension panels. Available themes are:

- Default
- Modern
- CRT
- Amber
- Matrix

The theme changes Tauren's host styling. It does not change extension logic.

## Keyboard behavior

When a custom UI surface is focused, Tauren forwards terminal-style keys to the Pi extension. This is why some extension UIs can behave more like a TUI than a normal web form.

Press `Esc` to leave or close many Tauren surfaces. Exact behavior depends on what is focused.

## Reloading extensions

After changing Pi extension files or configuration, reload runtime resources:

```text
/reload
```

This refreshes keybindings, extensions, skills, prompts, themes, and metadata where supported. If Pi cannot reload in place, Tauren may restart the runtime and reconnect the persisted session.

## Troubleshooting extension UI

If an extension UI looks wrong:

1. Check **Settings → Extensions** for disabled surfaces.
2. Enable output colors if ANSI output is hard to read.
3. Try a different custom UI theme.
4. Run `/reload` after extension changes.
5. Open diagnostics if the extension reports runtime errors.
