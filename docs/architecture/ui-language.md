# Tau UI Language

## Product names

- Tau: the VS Code extension and UI/workflow product.
- Pi: the backend agent engine and SDK runtime.
- Pi extension/plugin: package running inside the Pi runtime.
- Tau bridge: Tau-side adapter that maps Pi runtime/UI intent into VS Code/webview behavior.

## Surfaces

- View: the VS Code contributed sidebar view containing Tau.
- Native View Toolbar: VS Code title toolbar for Tau's view.
- Tau Header: internal top row inside the webview.
- Lane: one of the spatial side surfaces around chat.
  - Session List Lane: left lane for session files.
  - Chat Lane: center lane for transcript/composer.
  - Session Tree Lane: right lane for Pi tree navigation.
- Chat Face: front/back state of the Chat Lane.
  - Main Face: transcript/composer.
  - Settings Face: internal Tau/Pi settings surface.

## Runtime UI

- Custom UI Surface: Pi extension UI rendered inside Tau.
- Custom UI Theme: visual styling for Custom UI Surface.
- Plugin Bridge: Tau bridge for Pi extension UI calls.
- Composer: prompt input area.
