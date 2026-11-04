# Tools for Xero

A browser extension for the Xero accounting web app that adds small UI shortcuts and workflow improvements.

## What it does

- Toggles CSS changes for selected Xero UI regions
- Applies configurable Dark Reader styling, following system, dark, or light mode
- Adds custom flyout menus to existing nav items
- Inserts menu items into existing Xero menus
- Persists theme settings and on/off state through browser storage

## Supported browsers

- Firefox
- Chrome

## Navigation appearance

To reduce light flashes, the extension uses the `scripting` permission to register
startup CSS before page scripts run. Dark mode uses a dark canvas; Follow system
uses it only when the OS prefers dark colors. Light mode registers no dark CSS.
The temporary colors hand off to Dark Reader's base styles while it processes
the page, and appearance adjustments do not disable and rebuild the theme.

Theme settings are stored in extension storage; a background coordinator keeps
startup CSS registrations in sync. No theme preferences are stored in Xero's
cookies or page storage. Save failures are shown in the popup.

This reduces flashes rather than eliminating them: browser painting before
extension injection and the first navigation after install or registration
repair can still show light colors. Registration and storage updates are not
atomic across browser crashes. Startup colors cover the canvas and body, not
every independently colored page element.

## Requirements

- Node.js `22.22.2`
- pnpm `12.15.0`

## Install

```bash
pnpm install
```

## Run locally

```bash
pnpm dev
```

## Build

```bash
pnpm build
pnpm build:firefox
pnpm zip
pnpm zip:firefox
```

## Test

```bash
pnpm test
pnpm compile
```

## Project structure

- `src/entrypoints/content.ts` — content script that applies styles, flyouts, and menu items
- `src/entrypoints/popup/` — popup UI for toggling features
- `src/lib/toggles.ts` — CSS-based UI toggles
- `src/lib/flyouts.ts` — flyout menu definitions
- `src/lib/menu-items.ts` — inserted menu item definitions
- `src/lib/storage.ts` — shared toggle state storage
- `src/lib/toggle-style.ts` — pure CSS generation logic
- `src/lib/apply-flyouts.ts` — flyout DOM injection logic
- `src/lib/apply-menu-items.ts` — menu item injection logic

## Verification

See `BUILD.md` for the reproducible build and release verification steps.

## License

MIT
