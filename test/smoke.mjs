// Smoke test: loads main.js against a stubbed Obsidian API and checks the contracts that matter.
// Two of them are house rules rather than mechanics — XP must not scale with the rating given, and
// a downgrade must pay more than a re-rate. If those ever regress, the plugin has started
// rewarding self-flattery, which is worse than not existing.
//
// Run with: npm test

import assert from "node:assert/strict";
import Module from "node:module";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");

// --- stub the Obsidian runtime --------------------------------------------------------------
class Fake {
  open() {}
  close() {}
}
class FakePlugin {
  async loadData() { return null; }
  async saveData() {}
  addRibbonIcon() { return {}; }
  addStatusBarItem() {
    return { addClass() {}, onClickEvent() {}, setText(t) { this.text = t; } };
  }
  addCommand() {}
  addSettingTab() {}
  registerEvent() {}
  registerInterval() {}
}

const load = Module._load;
Module._load = (request, ...rest) =>
  request === "obsidian"
    ? { Plugin: FakePlugin, Notice: Fake, Modal: Fake, PluginSettingTab: Fake, Setting: Fake }
    : load.call(Module, request, ...rest);

const StudyFamiliar = require(path.join(root, "main.js"));

// --- a two-note vault ------------------------------------------------------------------------
const today = new Date().toISOString().slice(0, 10);
const files = [
  { path: "Concepts/meios.md", basename: "meios",
    fm: { type: "concept", id: "meios", title: "Meios", confidence: 0, courses: ["Genetik"] } },
  { path: "Concepts/mitos.md", basename: "mitos",
    fm: { type: "concept", id: "mitos", title: "Mitos", confidence: 5, last_reviewed: today,
          prerequisites: ["[[meios]]"], courses: ["Genetik"] } },
  { path: "Sources/src-x.md", basename: "src-x",
    fm: { type: "source", status: "unconfirmed" } },
];

const head = "---\nid: meios\ntype: concept\ntitle: Meios\n---\n";
const body = "\n## Core\nMeios halverar kromosomtalet, till skillnad från [[mitos]].\n";
let written = null;

function makePlugin() {
  const p = new StudyFamiliar();
  p.app = {
    vault: {
      getMarkdownFiles: () => files.map((f) => ({ path: f.path, basename: f.basename })),
      read: async () => head + body,
      modify: async (_f, t) => { written = t; },
      process: async (_f, fn) => { written = fn(head + body); },
    },
    metadataCache: {
      on: () => ({}),
      getFileCache: (f) => ({ frontmatter: (files.find((x) => x.path === f.path) || {}).fm }),
      resolvedLinks: { "Concepts/meios.md": { "Concepts/mitos.md": 1 } },
    },
    workspace: {
      onLayoutReady: (cb) => cb(),
      getActiveFile: () => ({ path: "Concepts/meios.md", basename: "meios" }),
    },
    fileManager: {
      processFrontMatter: async (f, fn) => fn(files.find((x) => x.path === f.path).fm),
    },
  };
  p.notice = () => {};
  return p;
}

globalThis.window = { setInterval: () => 1, clearInterval: () => {} };

// --- contracts -------------------------------------------------------------------------------
const p = makePlugin();
await p.onload();

assert.equal(p.concepts().length, 2, "reads concept notes from frontmatter, not from folder name alone");
assert.ok(p.candidates(2).length > 0, "produces study candidates");
assert.ok(p.candidates(2)[0].reasons.length > 0, "every candidate states why it was chosen");

const degrees = p.degreeMap();
assert.equal(degrees["Concepts/mitos.md"], 1, "degree counts inbound links");

// House rule 1: the amount paid must not depend on the rating given.
const low = makePlugin(); await low.onload();
files[0].fm.confidence = 0;
await low.applyRating({ path: "Concepts/meios.md", basename: "meios" }, 1);
const paidForOne = low.data.xp;

const high = makePlugin(); await high.onload();
files[0].fm.confidence = 0;
await high.applyRating({ path: "Concepts/meios.md", basename: "meios" }, 5);
assert.equal(high.data.xp, paidForOne, "rating 5 must pay exactly what rating 1 pays");

// House rule 2: an honest downgrade pays more than any re-rate, and earns its badge.
const down = makePlugin(); await down.onload();
files[0].fm.confidence = 4;
await down.applyRating({ path: "Concepts/meios.md", basename: "meios" }, 2);
assert.ok(down.data.xp > paidForOne, "lowering a rating must pay more than giving one");
assert.ok(down.data.badges.includes("honest-owl"), "a downgrade earns the Honest Owl badge");

// House rule 3: no UI string may assert that the student knows something. Only affirmative
// phrasings are listed — the source legitimately contains denials ("not what you know").
const source = require("node:fs").readFileSync(path.join(root, "main.js"), "utf8").toLowerCase();
for (const claim of ["you have mastered", "you now know", "you've mastered", "well understood",
                     "du behärskar", "du kan nu", "du har lärt dig"]) {
  assert.ok(!source.includes(claim), `no UI string may assert knowledge: "${claim}"`);
}

// Sprint: starts, refuses a second start, pays on completion.
const s = makePlugin(); await s.onload();
await s.startSprint();
assert.ok(s.sprintLeft() > 0, "sprint starts");
const before = s.data.xp;
await s.startSprint();
assert.ok(s.sprintLeft() > 0, "a second start does not reset the running sprint");
s.data.sprintEnd = Date.now() - 1;
await s.finishSprint();
assert.ok(s.data.xp > before, "finishing a sprint pays");
assert.ok(s.data.badges.includes("first-sprint"), "first sprint earns its badge");

// Link suggestion writes through the atomic path and preserves what it did not match.
const l = makePlugin(); await l.onload();
await l.applyLinks({ path: "Concepts/meios.md" }, head,
  [{ id: "mitos", matched: "Meios", index: body.indexOf("Meios") }]);
assert.ok(written.includes("[[mitos|Meios]]"), "applies the chosen link");
assert.ok(written.startsWith(head), "frontmatter survives untouched");

// Manifest sanity, so a release cannot ship a broken listing.
const manifest = require(path.join(root, "manifest.json"));
assert.ok(!manifest.id.startsWith("obsidian-"), "plugin id must not start with obsidian-");
assert.ok(!/obsidian/i.test(manifest.name), "plugin name must not contain 'Obsidian'");
assert.ok(manifest.description.length <= 250, "description must be at most 250 characters");
assert.equal(manifest.version, require(path.join(root, "package.json")).version,
  "manifest and package.json versions must agree");
assert.ok(Object.keys(require(path.join(root, "versions.json"))).includes(manifest.version),
  "versions.json must map this version to a minAppVersion");

console.log("smoke: all contracts hold");
