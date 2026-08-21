# Tools for Xero

A browser extension for the Xero accounting web app that adds small UI shortcuts and workflow improvements.

## What it does

- Toggles CSS changes for selected Xero UI regions
- Adds custom flyout menus to existing nav items
- Inserts menu items into existing Xero menus
- Syncs on/off state through browser storage

## Supported browsers

- Firefox
- Chrome

## Requirements

- Node.js `22.22.2`
- pnpm `11.18.0`

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
