# Troubleshooting

Start with the visible error message. Tauren surfaces startup failures, SDK diagnostics, extension errors, and runtime errors in the UI when possible.

## Open diagnostics

Run **Tauren: Show Diagnostics** from the Command Palette.

Diagnostics are the best first place to check when:

- the sidebar opens but Pi does not become ready,
- model metadata is missing,
- extensions fail to load,
- a session cannot be resumed,
- performance debugging is enabled.

## The sidebar opens but no model is available

Try:

1. Open **Settings → Login** and confirm authentication.
2. Open **Settings → Runtime** and confirm provider/model defaults.
3. Run `/reload`.
4. Check diagnostics for provider or SDK errors.

Tauren may show cached model data briefly, but live Pi state should replace it after startup.

## A session resumes in the wrong project

Tauren uses the first VS Code workspace folder as the runtime working directory. Close the wrong workspace and open the intended project folder before starting a new session.

Imported sessions may refer to a working directory that no longer exists. Tauren can ask whether to continue from the current workspace.

## Extension UI does not appear

Check **Settings → Extensions**. Above widgets, below widgets, status text, background colors, or monospace rendering may be disabled.

After changing Pi extension files, run:

```text
/reload
```

## File links do not open

By default, Tauren restricts sidebar file references to the workspace. If a legitimate file is outside the workspace, either open the correct workspace or review `tauren.restrictFileReferencesToWorkspace`.

Do not disable workspace restrictions unless you understand the trust boundary.

## Agent changed files outside the workspace

Enable `tauren.rejectEditWriteOutsideWorkspace` if you want Tauren to reject Pi edit/write tool mutations outside the active workspace folder.

This does not block shell commands. Review prompts and tool output carefully when running broad tasks.

## Local docs build fails

For this documentation site, run:

```sh
npm run docs:build
```

If the build fails after editing docs, check broken links, Markdown syntax, and generated files under `docs/.vitepress/`. The generated `.temp` and `dist` folders should remain ignored.
