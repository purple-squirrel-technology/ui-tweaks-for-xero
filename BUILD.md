# Build verification

Use these steps to reproduce the Firefox extension from source.

## Requirements

- Node.js `22.22.2` (`.node-version`)
- pnpm `11.18.0` (`packageManager` in `package.json`)

## Build

```bash
pnpm install
pnpm build:firefox
pnpm zip:firefox
```

## Outputs

- Firefox build: `.output/firefox-mv2/`
- Firefox package: `.output/firefox-mv2.zip`

## Verify against a published release

1. Check out the exact git tag for the release.
2. Run the build commands above.
3. Compare the resulting `.output/firefox-mv2.zip` to the published release artifact.

For stronger verification, publish a checksum alongside each release zip and compare it with:

```bash
sha256sum .output/firefox-mv2.zip
```

## AMO submission

When submitting to Mozilla Add-ons, upload the source archive that corresponds to the same git tag as the published extension build.
