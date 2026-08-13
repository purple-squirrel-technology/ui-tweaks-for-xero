# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A cross-browser (Chrome + Firefox) browser extension that operates only on `https://go.xero.com` (the main Xero accounting app; other Xero subdomains are intentionally out of scope). It provides bookkeeping tools and shortcuts for Xero users. The current feature is a popup with checkboxes that apply/remove predefined CSS rules to regions of the Xero UI via injected CSS.

Built with [WXT](https://wxt.dev) (Vite-based, TypeScript-first cross-browser extension framework) and pnpm.

## Commands

```
pnpm install         # install deps (also runs `wxt prepare`, generating .wxt/ types)
pnpm dev              # dev build + watch, targets Chrome by default
pnpm dev:firefox      # dev build + watch, targets Firefox
pnpm build            # production build -> .output/chrome-mv3
pnpm build:firefox    # production build -> .output/firefox-mv2
pnpm zip              # build + zip for Chrome Web Store submission
pnpm zip:firefox      # build + zip for AMO submission
pnpm compile           # tsc --noEmit typecheck
pnpm test              # run vitest once
pnpm test:watch        # vitest watch mode
```

Run a single test file: `pnpm exec vitest run lib/toggle-style.test.ts`.

`pnpm install` triggers a `postinstall` hook (`wxt prepare`) that regenerates the `.wxt/` directory (gitignored). If TypeScript can't resolve `#imports`, WXT globals (`defineContentScript`, etc.), or `wxt/*` types, run `pnpm exec wxt prepare` to regenerate it.

## Architecture

**Entrypoint-driven, WXT convention over configuration.** Anything under `entrypoints/` is auto-detected and turned into a manifest entry — there is no hand-written `manifest.json`; manifest fields (name, permissions, `host_permissions`) are set in `wxt.config.ts`.

- `entrypoints/content.ts` — content script matched against `https://go.xero.com/*` (kept in sync with `host_permissions` in `wxt.config.ts` — both must be updated together if the scope ever changes). Injects a single `<style id="tools-for-xero-toggle-style">` element and rewrites its contents whenever the persisted toggle state changes (reads once on load via `toggleStateItem.getValue()`, then subscribes via `toggleStateItem.watch()`).
- `entrypoints/popup/` — the browser action popup (`index.html` + `main.ts`). Renders one checkbox per entry in `TOGGLES`, reading/writing state through the same `toggleStateItem` storage handle.
- `lib/toggles.ts` — the single source of truth for which page regions can be styled: `TOGGLES: ElementToggle[]`, each with a stable `id`, display `label`, CSS `selectors`, and CSS declarations in `css`. **The current selectors are placeholders** — Xero's actual DOM/class names need to be confirmed by inspecting the live app before this is functionally complete. Add new styleable regions here.
- `lib/toggle-style.ts` — pure function `buildToggleStyle(toggles, state) -> string` that turns enabled toggles into CSS rule blocks. Kept free of browser APIs so it's unit-testable without mocking `chrome`/`browser`.
- `lib/storage.ts` — the one `storage.defineItem` (`local:toggleState`) shared between the popup and content script. Popup writes, content script reads/watches. If new persisted state is needed, add another `storage.defineItem` here rather than reaching for `chrome.storage` directly.

**Data flow:** popup checkbox change → `toggleStateItem.setValue()` → `browser.storage.local` → content script's `watch()` callback fires → `buildToggleStyle` recomputes → `<style>` tag content replaced. There is no message-passing between popup and content script; storage is the sole channel, so both sides can be developed/tested independently.

**Testing:** `vitest.config.ts` uses `WxtVitest()` from `wxt/testing/vitest-plugin`, which provides WXT's module resolution (`#imports`, auto-imports) and a fake `browser` global inside tests. Only `lib/toggle-style.ts` has tests today since it's the only pure logic; UI code in `entrypoints/` is intentionally left thin so most logic can live in and be tested from `lib/`.

## Adding a new styleable element

1. Inspect the target element on xero.com and find a stable selector (prefer `data-automationid` attributes if present over generated class names).
2. Add an entry to `TOGGLES` in `lib/toggles.ts`, including the selector list and the CSS declarations to apply while the toggle is on.
3. No other changes needed — the popup and content script both derive from `TOGGLES` automatically.
