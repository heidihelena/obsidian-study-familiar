# I am submitting a new Community Plugin

Repo URL: https://github.com/heidihelena/obsidian-study-familiar

Release Checklist
- [x] I have tested the plugin on
  - [ ] Windows
  - [x] macOS
  - [ ] Linux
  - [ ] Android
  - [ ] iOS
- [x] My GitHub release contains all required files
  - [x] main.js
  - [x] manifest.json
  - [x] styles.css
- [x] GitHub release name matches the exact version number specified in my manifest.json (Note: Use the exact version number, don't include a prefix `v`)
- [x] The `id` in my `manifest.json` matches the `id` in the `community-plugins.json` file.
- [x] My README.md describes the plugin's purpose and provides clear usage instructions.
- [x] I have read the tips in https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines and have self-reviewed my plugin to avoid these common pitfalls.
- [x] I have added a license in the LICENSE file.
- [x] My project respects and is compatible with the original license of any code from other plugins that I'm using.
      I have given proper attribution to these other projects in my `README.md`.

## What it does

A study companion for vaults where notes carry a `confidence` rating. It ranks what to study next
from live frontmatter — unrated, weak, stale, and how many other notes declare a note a
prerequisite — rates a note in one keystroke, runs a focus sprint that ends with a recall prompt
rather than a bell, and suggests links for concepts mentioned in prose but not linked.

## The design constraint worth reviewing

Gamified self-assessment has an obvious failure mode: rate everything 5, feel good, learn nothing.
So XP is paid for the *act* of rating and never for the value given — rating 2 pays exactly what
rating 5 pays — and lowering a rating pays more than raising one, with a badge for the first
downgrade. No string in the plugin tells the user they know something. Both properties are asserted
in the test suite rather than left to intention.

## Boundary

The plugin writes two frontmatter fields (`confidence`, `last_reviewed`), plus links the user
explicitly ticks in a review dialog and a `zotero:` URI when asked. There are no rename or move
calls anywhere in the source, so it cannot reclassify or relocate a note. Writes go through
`Vault.process` so edits made in the editor while a dialog is open are not clobbered. It makes no
network requests: no telemetry, no account, no external service. Progress lives in the plugin's own
`data.json`, never in the user's notes.

## Scope note

The plugin reads a specific frontmatter schema (`type: concept` with `confidence`, `type: source`
with `status`). Folders are configurable and may be the whole vault, but the frontmatter keys are
not configurable in this version — in a vault that does not use them the dashboard is empty and the
plugin does nothing. This is stated at the top of the README rather than discovered after install.

## Testing note

Developed and used on macOS. `isDesktopOnly` is false because nothing in the plugin requires
desktop APIs — no Node, no Electron, no filesystem access outside the Vault API, and no regex
lookbehind — but I have not tested it on Windows, Linux, Android or iOS, so I have left those boxes
unchecked rather than claim them.
