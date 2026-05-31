# Installation

Tauren is a VS Code extension. Install it like any other extension, then configure the Pi runtime from the Tauren sidebar.

## Install the extension

Use the installation path that matches how you received Tauren:

- **Marketplace build:** install Tauren from the VS Code Extensions view.
- **Local VSIX:** run **Extensions: Install from VSIX...** from the Command Palette and select the `.vsix` file.
- **Development checkout:** clone the repository, run `npm install`, and launch the VS Code Extension Host from the workspace.

After installation, reload VS Code if the Tauren Activity Bar icon does not appear immediately.

## Open Tauren

1. Open a workspace folder in VS Code.
2. Select the Tauren icon in the Activity Bar.
3. Wait for the sidebar to finish loading.

Tauren uses the first workspace folder as the runtime working directory. For best results, open the project you want the agent to work on before starting a session.

## Configure a provider

Open the settings gear in the Tauren sidebar and use the **Login** or **Runtime** sections to configure provider authentication and model defaults.

If you already use Pi outside VS Code, Tauren can use the existing Pi runtime configuration where applicable. If not, use the built-in Tauren settings flow to configure authentication.

## Development install

For local development from this repository:

```sh
npm install
npm run compile
```

Then launch the extension host from VS Code.

To package and install a local VSIX, use:

```sh
npm run install:local
```

This command compiles the extension, builds a local VSIX, installs it into VS Code, and restarts the extension host helper used by this project.

## Verify the install

A healthy install should let you:

- open the Tauren sidebar,
- open settings,
- select or confirm a model,
- send a prompt,
- stop a running response if needed.

If startup fails, open **Tauren: Show Diagnostics** from the Command Palette and review the error message.
