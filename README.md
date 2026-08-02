# 🦉 Study Familiar

An Obsidian study companion that rewards the act of studying and never the rating you give yourself.

Most study gamification has an obvious failure mode: rate everything 5, feel great, learn nothing.
This one pays the same XP for rating a concept 2 as for rating it 5, pays **more** for lowering a
rating than for raising one, and has a badge — Honest Owl ⚖️ — for the first downgrade. No popup
ever tells you that you know something. Levels measure work done; whether the work landed is
established elsewhere, by explaining and by being tested.

## Status: personal plugin, not (yet) in the community catalogue

Read this before installing. Study Familiar currently assumes a specific vault schema — concept
notes in `Concepts/` with `type: concept`, `confidence`, `courses`, and source notes in `Sources/`
with `status: confirmed`. In a vault without that schema it shows an empty dashboard and does
nothing. Making the folder and field names configurable is the work standing between this and a
community-catalogue submission.

Install with [BRAT](https://github.com/TfTHacker/obsidian42-brat): add
`heidihelena/obsidian-study-familiar` as a beta plugin. Or copy `main.js`, `manifest.json` and
`styles.css` into `<vault>/.obsidian/plugins/study-familiar/` and enable it in
Settings → Community plugins.

## Commands

| Command | What it does |
|---|---|
| **Open the familiar** | Dashboard: level, XP bar, streak, today's quest, what to study now, badges |
| **Rate this concept** | Five-button scale with real descriptions; writes `confidence` + `last_reviewed` |
| **What should I study now?** | Ranked from live frontmatter: unrated, weak, stale, and how many concepts depend on it |
| **Start a study sprint** / **Stop the sprint** | Timer in the status bar that ends with a recall prompt, not a bell |
| **Today's quest** | Three small tasks built from the vault's actual state; one is always a sprint |
| **Suggest links for this note** | Finds concepts mentioned in prose but not linked; you tick which are real references |
| **Add Zotero link to this source** | Turns a Better BibTeX `citekey:` into a clickable `zotero://select/items/@key` |
| **Feathers earned** | Eleven badges, each tied to a real study behaviour |

## The design rules

1. **XP is paid for the act, never for the rating.** A 2 pays what a 5 pays. Lowering pays 15 where
   a re-rate pays 12. Enforced by the smoke test, not merely intended.
2. **Nothing claims you know anything.** A 4 or 5 gets *"Noted — we will test that rather than take
   your word for it."* Also enforced by the smoke test.
3. **A broken streak is a welcome, not a scolding.** *"Streak restarts today — nothing is lost that
   matters."* Streak systems that punish absence make people abandon the tool instead of returning,
   and returning is the whole point.
4. **It writes two frontmatter fields** — `confidence` and `last_reviewed` — plus links you
   explicitly tick and `zotero:` when you ask. It never moves, renames or reorganises a note.
5. **No network, no account, no telemetry.** Everything is computed from your own notes, locally.
   Progress lives in the plugin's own `data.json`, so the notes stay clean.

## Sprints end with retrieval

When the timer runs out the card asks: *what are the three things you could now explain without
notes? Say them out loud, then rate one.* Those last two minutes are where a timed block becomes
learning — a bell on its own only measures sitting. Stopping early gives no XP and no guilt.

## Development

Plain JavaScript against the Obsidian API: no build step, no dependencies, so `main.js` is the
source. Edit it and reload the plugin.

```bash
npm test
```

The smoke test loads `main.js` against a stubbed Obsidian API and asserts the two honesty rules,
sprint behaviour, atomic link writing, and manifest correctness — so a release cannot ship a broken
listing, or a plugin that has quietly started rewarding self-flattery.

## Licence

Apache-2.0.
