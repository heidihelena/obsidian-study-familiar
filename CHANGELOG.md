# Changelog

All notable changes to Study Familiar. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versions follow [semantic versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] 2026-08-02

First release. Built for a first-year molecular biosciences vault; usable in any vault that follows
the same schema.

### Added

- **Rating in one keystroke.** Five-button scale with real descriptions instead of bare numbers,
  writing `confidence` and `last_reviewed` into the note's frontmatter.
- **What to study now.** Candidates ranked from live frontmatter (unrated, weak, stale, and how
  many other concepts declare it a prerequisite), each shown with the reasons it was chosen.
- **Study sprints.** A timer in the status bar that ends with a recall prompt rather than a bell,
  and pays nothing for stopping early but does not scold either.
- **Daily quest.** Three small tasks generated from the vault's actual state; one is always a sprint.
- **XP, levels, streak, eleven badges**, all paid for the act of studying, never for the rating
  given. Lowering a rating pays more than raising one and earns the Honest Owl badge.
- **Suggest links for this note.** Finds concepts mentioned in prose but not linked, skipping code
  blocks and existing links, and applies only the ones ticked, through Obsidian's atomic write so
  unsaved editor changes survive.
- **Add Zotero link to this source.** Turns a Better BibTeX `citekey:` into `zotero://select/items/@key`,
  and refuses to guess when no citekey exists.
- **English and Swedish** interface strings.
- **Configurable folders** for concept and source notes; empty means the whole vault.
- **Smoke test** covering the honesty rules, sprint behaviour, atomic writes and manifest validity,
  run in CI on every push and pull request along with a check that the committed bundle matches `src/`.

### Known limits

- Reads the frontmatter schema described in the README; a vault without those keys sees an empty
  dashboard. Folders are configurable, frontmatter keys are not.
- `isDesktopOnly: false` is a claim based on the APIs used, not on testing against a phone.
  Developed and used on macOS.
