# Slash Commands

Slash commands run from the Tauren composer. Type `/` to open suggestions.

| Command | Use |
| --- | --- |
| `/model` | Select a model. You can type part of a provider or model name after the command. |
| `/name` | Set or clear the current session name. |
| `/session` | Show current session information and stats. |
| `/compact` | Manually compact context. Optional text becomes compaction instructions. |
| `/copy` | Copy the last assistant response. |
| `/export` | Export the current session to HTML. Optional path chooses the output file. |
| `/new` | Start a new session. |
| `/settings` | Open Tauren settings. |
| `/scoped-models` | Open scoped model cycling settings. |
| `/import <path.jsonl>` | Import and resume a JSONL session. |
| `/share` | Share the current session as a secret GitHub Gist. Requires authenticated `gh`. |
| `/changelog` | Show Pi and Tauren changelogs. |
| `/hotkeys` | Show Tauren keyboard shortcuts. |
| `/fork` | Fork from a previous user message. |
| `/clone` | Duplicate the current session. |
| `/tree` | Open the Pi session tree. |
| `/login` | Configure provider authentication. |
| `/logout` | Remove stored provider authentication. |
| `/resume` | Open the session list. |
| `/reload` | Reload keybindings, extensions, skills, prompts, themes, and metadata. |

## Unsupported terminal command

| Command | Behavior |
| --- | --- |
| `/quit` | Not supported in the VS Code sidebar. Use the normal VS Code UI to close Tauren. |

## Notes

Some commands are local Tauren commands. Others delegate to Pi runtime behavior. If a command depends on the runtime and Pi is not ready, Tauren may first start or refresh the SDK client.
