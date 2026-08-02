import { Notice, Plugin, TFile, normalizePath } from "obsidian";

import { BADGES, DEFAULT_DATA, LEVELS, STALE_DAYS, XP } from "./constants";
import { fill, translate } from "./i18n";
import { StudyFamiliarSettings } from "./settings";
import {
  BadgeEarnedModal,
  BadgeModal,
  DashboardModal,
  LevelModal,
  RateModal,
  SprintDoneModal,
  SuggestLinksModal,
} from "./views";
import type {
  BadgeContext,
  Candidate,
  ConceptNote,
  DayActions,
  Lang,
  LevelInfo,
  LinkCandidate,
  NoteFrontmatter,
  PluginData,
  QuestProgress,
  QuestTask,
} from "./types";
import { asArray, daysBetween, escapeRegExp, formatClock, linkTarget, todayISO } from "./util";

export default class StudyFamiliar extends Plugin {
  data: PluginData = { ...DEFAULT_DATA };
  private status: HTMLElement | null = null;
  private timer: number | null = null;

  async onload(): Promise<void> {
    const stored = (await this.loadData()) as Partial<PluginData> | null;
    this.data = { ...DEFAULT_DATA, ...(stored ?? {}) };
    this.data.completedQuests = this.data.completedQuests ?? [];
    this.data.settings = { ...DEFAULT_DATA.settings, ...this.data.settings };

    this.addRibbonIcon("graduation-cap", "Study Familiar", () => new DashboardModal(this.app, this).open());

    this.status = this.addStatusBarItem();
    this.status.addClass("sf-status");
    this.status.onClickEvent(() => new DashboardModal(this.app, this).open());

    this.addCommand({ id: "open-dashboard", name: "Open the familiar", callback: () => new DashboardModal(this.app, this).open() });
    this.addCommand({ id: "rate-current", name: "Rate this concept", callback: () => void this.rateCurrent() });
    this.addCommand({ id: "study-next", name: "What should I study now?", callback: () => new DashboardModal(this.app, this).open() });
    this.addCommand({ id: "daily-quest", name: "Today's quest", callback: () => new DashboardModal(this.app, this).open() });
    this.addCommand({ id: "badges", name: "Feathers earned", callback: () => new BadgeModal(this.app, this).open() });
    this.addCommand({ id: "suggest-links", name: "Suggest links for this note", callback: () => void this.suggestLinks() });
    this.addCommand({ id: "zotero-link", name: "Add Zotero link to this source", callback: () => void this.addZoteroLink() });
    this.addCommand({ id: "sprint-start", name: "Start a study sprint", callback: () => void this.startSprint() });
    this.addCommand({ id: "sprint-stop", name: "Stop the sprint", callback: () => void this.stopSprint() });

    this.addSettingTab(new StudyFamiliarSettings(this.app, this));

    this.registerEvent(this.app.metadataCache.on("changed", (file) => void this.onNoteChanged(file)));
    this.app.workspace.onLayoutReady(() => {
      if (this.sprintLeft() > 0) this.runTimer();
      else if (this.data.sprintEnd) {
        this.data.sprintEnd = null;
        void this.save();
      }
      this.refreshStatus();
    });
  }

  lang(): Lang {
    return this.data.settings.language === "sv" ? "sv" : "en";
  }

  t(key: string): string {
    return translate(this.lang(), key);
  }

  async save(): Promise<void> {
    await this.saveData(this.data);
    this.refreshStatus();
  }

  /* ---------------------------------------------------------------- vault reading */
  /** An empty folder setting means "anywhere in the vault"; `type:` still does the real filtering. */
  private inFolder(path: string, folder: string): boolean {
    const wanted = folder.trim();
    if (!wanted) return true;
    const norm = normalizePath(wanted).replace(/\/+$/, "");
    return path === norm || path.startsWith(`${norm}/`);
  }

  concepts(): ConceptNote[] {
    return this.app.vault
      .getMarkdownFiles()
      .filter((f) => this.inFolder(f.path, this.data.settings.conceptsFolder))
      .map((f) => ({ file: f, fm: (this.app.metadataCache.getFileCache(f)?.frontmatter ?? {}) as NoteFrontmatter }))
      .filter((c) => c.fm.type === "concept");
  }

  dependentCounts(concepts: ConceptNote[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const c of concepts) {
      for (const raw of asArray(c.fm.prerequisites)) {
        const key = linkTarget(raw);
        counts[key] = (counts[key] ?? 0) + 1;
      }
    }
    return counts;
  }

  /** Built once per pass: a per-file version rescanned every link in the vault, per concept. */
  degreeMap(): Record<string, number> {
    const resolved = this.app.metadataCache.resolvedLinks;
    const degrees: Record<string, number> = {};
    for (const [from, targets] of Object.entries(resolved)) {
      const outgoing = Object.keys(targets);
      degrees[from] = (degrees[from] ?? 0) + outgoing.length;
      for (const to of outgoing) {
        if (to !== from) degrees[to] = (degrees[to] ?? 0) + 1;
      }
    }
    return degrees;
  }

  candidates(limit = 8): Candidate[] {
    const concepts = this.concepts();
    const dependents = this.dependentCounts(concepts);
    const degrees = this.degreeMap();
    const today = todayISO();

    const scored = concepts.map((c) => {
      const id = String(c.fm.id ?? c.file.basename).toLowerCase();
      const conf = typeof c.fm.confidence === "number" ? c.fm.confidence : 0;
      const seen = c.fm.last_reviewed ? String(c.fm.last_reviewed) : null;
      const age = seen ? daysBetween(seen, today) : null;
      const load = dependents[id] ?? 0;
      const degree = degrees[c.file.path] ?? 0;

      let score = 0;
      const reasons: string[] = [];
      if (!conf) {
        score += 3;
        reasons.push(this.t("reason_unrated"));
      } else if (conf <= 2) {
        score += 4;
        reasons.push(fill(this.t("reason_weak"), { n: conf }));
      }
      if (age === null) {
        score += 1;
        reasons.push(this.t("reason_never"));
      } else if (age >= STALE_DAYS) {
        score += 2;
        reasons.push(fill(this.t("reason_stale"), { n: age }));
      }
      if (load >= 3) {
        score += 2;
        reasons.push(fill(this.t("reason_load"), { n: load }));
      }
      if (degree >= 20) {
        score += 1;
        reasons.push(fill(this.t("reason_hub"), { n: degree }));
      }

      return { ...c, id, conf, load, degree, score, reasons };
    });

    scored.sort((a, b) => b.score - a.score || b.load - a.load || b.degree - a.degree);
    return scored.slice(0, limit);
  }

  unconfirmedSources(): ConceptNote[] {
    return this.app.vault
      .getMarkdownFiles()
      .filter((f) => this.inFolder(f.path, this.data.settings.sourcesFolder))
      .map((f) => ({ file: f, fm: (this.app.metadataCache.getFileCache(f)?.frontmatter ?? {}) as NoteFrontmatter }))
      .filter((s) => s.fm.type === "source" && String(s.fm.status ?? "").toLowerCase() !== "confirmed");
  }

  /* ---------------------------------------------------------------- progression */
  level(): LevelInfo {
    let index = 0;
    for (let i = 0; i < LEVELS.length; i++) if (this.data.xp >= LEVELS[i].at) index = i;
    const lang = this.lang();
    const next = LEVELS[index + 1];
    return {
      n: index + 1,
      name: LEVELS[index][lang],
      at: LEVELS[index].at,
      nextAt: next ? next.at : null,
      nextName: next ? next[lang] : null,
    };
  }

  today(): DayActions {
    const key = todayISO();
    if (!this.data.actions[key]) {
      this.data.actions[key] = { rate: 0, review: 0, source: 0, lower: 0, sprint: 0 };
    }
    const day = this.data.actions[key];
    if (day.sprint === undefined) day.sprint = 0;
    return day;
  }

  async touchStreak(): Promise<void> {
    const today = todayISO();
    if (this.data.lastActiveDate === today) return;
    const gap = this.data.lastActiveDate ? daysBetween(this.data.lastActiveDate, today) : null;
    if (gap === 1) {
      this.data.streak += 1;
      this.notice("🔥", fill(this.t("streak_day"), { n: this.data.streak }));
    } else {
      // A broken streak is a welcome, not a scolding: punishing absence makes people quit the tool
      // rather than come back, and coming back is the whole point.
      const returning = this.data.lastActiveDate !== null;
      this.data.streak = 1;
      if (returning) this.notice("🦉", this.t("welcome_back"));
    }
    this.data.longestStreak = Math.max(this.data.longestStreak, this.data.streak);
    this.data.lastActiveDate = today;
  }

  async award(amount: number, headline?: string): Promise<void> {
    const before = this.level().n;
    this.data.xp += amount;
    const after = this.level();
    if (headline) this.notice("🦉", `${headline}  +${amount} XP`);
    if (after.n > before && this.data.settings.celebrate) {
      new LevelModal(this.app, this, after).open();
    }
    await this.save();
  }

  async grantBadge(id: string): Promise<void> {
    if (this.data.badges.includes(id)) return;
    const badge = BADGES.find((b) => b.id === id);
    if (!badge) return;
    this.data.badges.push(id);
    await this.save();
    if (this.data.settings.celebrate) new BadgeEarnedModal(this.app, this, badge).open();
  }

  async checkBadges(ctx: BadgeContext = {}): Promise<void> {
    const concepts = this.concepts();
    const rated = concepts.filter((c) => typeof c.fm.confidence === "number" && c.fm.confidence > 0);
    if (rated.length >= 1) await this.grantBadge("first-flight");
    if (rated.length >= 10) await this.grantBadge("ten-feathers");
    if (this.data.streak >= 3) await this.grantBadge("steady-wing");
    if (this.data.streak >= 7) await this.grantBadge("week-owl");
    if (ctx.lowered) await this.grantBadge("honest-owl");
    if ((ctx.load ?? 0) >= 5) await this.grantBadge("foundation-fixer");

    const byCourse: Record<string, { total: number; rated: number }> = {};
    for (const c of concepts) {
      for (const course of asArray(c.fm.courses)) {
        const key = String(course);
        if (!byCourse[key]) byCourse[key] = { total: 0, rated: 0 };
        byCourse[key].total += 1;
        if (typeof c.fm.confidence === "number" && c.fm.confidence > 0) byCourse[key].rated += 1;
      }
    }
    if (Object.values(byCourse).some((v) => v.total >= 5 && v.total === v.rated)) {
      await this.grantBadge("course-swept");
    }
  }

  /* ---------------------------------------------------------------- quest */
  quest(): QuestTask[] {
    const today = todayISO();
    if (this.data.questDate === today && this.data.quest) return this.data.quest;

    const goal = this.data.settings.dailyGoal;
    const concepts = this.concepts();
    const unrated = concepts.filter((c) => !(typeof c.fm.confidence === "number" && c.fm.confidence > 0));
    const stale = concepts.filter(
      (c) => c.fm.last_reviewed && daysBetween(String(c.fm.last_reviewed), today) >= STALE_DAYS,
    );
    const sources = this.unconfirmedSources();

    const tasks: QuestTask[] = [];
    if (unrated.length) {
      const n = Math.min(goal, unrated.length);
      tasks.push({ kind: "rate", n, label: n === 1 ? this.t("quest_rate_1") : fill(this.t("quest_rate"), { n }) });
    }
    if (stale.length) {
      const n = Math.min(2, stale.length);
      tasks.push({ kind: "review", n, label: n === 1 ? this.t("quest_review_1") : fill(this.t("quest_review"), { n }) });
    }
    if (sources.length) {
      tasks.push({ kind: "source", n: 1, label: this.t("quest_source") });
    }
    const sprint: QuestTask = { kind: "sprint", n: 1, label: this.t("quest_sprint") };
    this.data.quest = [...tasks.slice(0, 2), sprint];
    this.data.questDate = today;
    void this.saveData(this.data);
    return this.data.quest;
  }

  questProgress(): QuestProgress[] {
    const done = this.today();
    return this.quest().map((task) => ({
      ...task,
      done: Math.min(done[task.kind] ?? 0, task.n),
      complete: (done[task.kind] ?? 0) >= task.n,
    }));
  }

  async maybeCompleteQuest(): Promise<void> {
    const progress = this.questProgress();
    if (!progress.length || !progress.every((p) => p.complete)) return;
    const key = todayISO();
    if (this.data.completedQuests.includes(key)) return;
    this.data.completedQuests.push(key);
    await this.award(XP.quest_complete, this.t("quest_done"));
    await this.grantBadge("quest-runner");
  }

  /* ---------------------------------------------------------------- link suggestions */
  async suggestLinks(): Promise<void> {
    const file = this.app.workspace.getActiveFile();
    if (!file) return;
    const raw = await this.app.vault.read(file);
    const own = String(this.app.metadataCache.getFileCache(file)?.frontmatter?.id ?? file.basename);

    const split = raw.match(/^---\n[\s\S]*?\n---\n/);
    const head = split ? split[0] : "";
    const body = raw.slice(head.length);
    // Blank out anything already linked, plus code, so matches land only in plain prose.
    const searchable = body
      .replace(/```[\s\S]*?```/g, (m) => " ".repeat(m.length))
      .replace(/`[^`\n]*`/g, (m) => " ".repeat(m.length))
      .replace(/\[\[[^\]]*\]\]/g, (m) => " ".repeat(m.length));

    const candidates: LinkCandidate[] = [];
    const seen = new Set<string>();
    for (const c of this.concepts()) {
      const id = String(c.fm.id ?? c.file.basename);
      if (id === own || seen.has(id)) continue;
      const terms = [c.fm.title, ...asArray(c.fm.aliases)].filter((t) => t && String(t).length > 4);
      for (const term of terms) {
        // A leading group instead of a lookbehind: WebKit only gained lookbehind in iOS 16.4.
        const re = new RegExp(`(^|[^\\w\\[|])(${escapeRegExp(String(term))})(?![\\w\\]])`, "i");
        const hit = re.exec(searchable);
        if (!hit) continue;
        const start = hit.index + hit[1].length;
        const from = Math.max(0, start - 45);
        candidates.push({
          id,
          title: String(c.fm.title ?? id),
          matched: body.substr(start, hit[2].length),
          index: start,
          context: body.slice(from, start + hit[2].length + 45).replace(/\n/g, " ").trim(),
        });
        seen.add(id);
        break;
      }
    }
    if (!candidates.length) {
      this.notice("🦉", this.t("suggest_none"));
      return;
    }
    candidates.sort((a, b) => a.index - b.index);
    new SuggestLinksModal(this.app, this, file, head, candidates).open();
  }

  async applyLinks(file: TFile, head: string, chosen: LinkCandidate[]): Promise<void> {
    // The offsets came from a snapshot taken before the modal opened. Re-read inside the write so
    // anything typed in the editor meanwhile survives, and skip any match that has since moved.
    const ordered = [...chosen].sort((a, b) => b.index - a.index);
    let applied = 0;
    let skipped = 0;

    const rewrite = (data: string): string => {
      if (!data.startsWith(head)) {
        skipped = ordered.length;
        return data;
      }
      let text = data.slice(head.length);
      for (const c of ordered) {
        const shown = text.substr(c.index, c.matched.length);
        if (shown.toLowerCase() !== c.matched.toLowerCase()) {
          skipped += 1;
          continue;
        }
        const link = shown.toLowerCase() === c.id.toLowerCase() ? `[[${shown}]]` : `[[${c.id}|${shown}]]`;
        text = text.slice(0, c.index) + link + text.slice(c.index + c.matched.length);
        applied += 1;
      }
      return head + text;
    };

    // process() reads and writes inside the vault's own lock, so edits made while the modal was
    // open are not clobbered. Requires Obsidian 1.6, which minAppVersion declares.
    await this.app.vault.process(file, rewrite);
    this.notice(
      "🔗",
      fill(this.t("suggest_done"), { n: applied }) +
        (skipped ? " " + fill(this.t("suggest_skipped"), { n: skipped }) : ""),
    );
  }

  async addZoteroLink(): Promise<void> {
    const file = this.app.workspace.getActiveFile();
    if (!file) return;
    const fm = (this.app.metadataCache.getFileCache(file)?.frontmatter ?? {}) as NoteFrontmatter;
    if (fm.type !== "source") {
      this.notice("🦉", this.t("zotero_notsource"));
      return;
    }
    if (fm.zotero) {
      this.notice("📚", this.t("zotero_has"));
      return;
    }
    const key = String(fm.citekey ?? "").trim();
    if (!key) {
      // Never guess a citekey: a link that opens the wrong item looks like provenance.
      this.notice("📚", this.t("zotero_nokey"));
      return;
    }
    await this.app.fileManager.processFrontMatter(file, (front) => {
      front.zotero = `zotero://select/items/@${key}`;
    });
    this.notice("📚", this.t("zotero_added"));
  }

  /* ---------------------------------------------------------------- sprint timer */
  sprintLeft(): number {
    if (!this.data.sprintEnd) return 0;
    return Math.max(0, this.data.sprintEnd - Date.now());
  }

  formatLeft(ms: number): string {
    return formatClock(ms);
  }

  async startSprint(): Promise<void> {
    if (this.sprintLeft() > 0) {
      this.notice("⏳", fill(this.t("sprint_running"), { n: this.formatLeft(this.sprintLeft()) }));
      return;
    }
    const minutes = this.data.settings.sprintMinutes;
    this.data.sprintEnd = Date.now() + minutes * 60000;
    this.data.sprintLength = minutes;
    await this.save();
    this.notice("⏳", fill(this.t("sprint_start"), { n: minutes }));
    this.runTimer();
  }

  runTimer(): void {
    if (this.timer) window.clearInterval(this.timer);
    this.timer = window.setInterval(() => {
      if (this.sprintLeft() <= 0) {
        if (this.timer) window.clearInterval(this.timer);
        this.timer = null;
        void this.finishSprint();
      } else {
        this.refreshStatus();
      }
    }, 1000);
    this.registerInterval(this.timer);
  }

  async stopSprint(): Promise<void> {
    if (this.sprintLeft() <= 0) {
      this.notice("🦉", this.t("sprint_none"));
      return;
    }
    const done = Math.round((this.data.sprintLength * 60000 - this.sprintLeft()) / 60000);
    this.data.sprintEnd = null;
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    await this.save();
    // No XP, no scolding: a deliberate stop is a decision, not a failure.
    this.notice("🦉", fill(this.t("sprint_stopped"), { n: done }));
  }

  async finishSprint(): Promise<void> {
    const minutes = this.data.sprintLength;
    this.data.sprintEnd = null;
    this.today().sprint += 1;
    await this.touchStreak();
    await this.award(XP.sprint_complete, fill(this.t("sprint_done"), { n: minutes }));
    await this.grantBadge("first-sprint");
    if (this.today().sprint >= 3) await this.grantBadge("three-sprints");
    await this.maybeCompleteQuest();
    await this.save();
    if (this.data.settings.celebrate) new SprintDoneModal(this.app, this, minutes).open();
  }

  /* ---------------------------------------------------------------- actions */
  async rateCurrent(): Promise<void> {
    const file = this.app.workspace.getActiveFile();
    if (!file) return;
    const fm = (this.app.metadataCache.getFileCache(file)?.frontmatter ?? {}) as NoteFrontmatter;
    if (fm.type !== "concept") {
      this.notice("🦉", this.t("not_concept"));
      return;
    }
    new RateModal(this.app, this, file, fm).open();
  }

  async applyRating(file: TFile, value: number): Promise<void> {
    const before = (this.app.metadataCache.getFileCache(file)?.frontmatter ?? {}) as NoteFrontmatter;
    const previous = typeof before.confidence === "number" ? before.confidence : 0;
    const wasReviewed = before.last_reviewed ? String(before.last_reviewed) : null;

    await this.app.fileManager.processFrontMatter(file, (fm) => {
      fm.confidence = value;
      fm.last_reviewed = todayISO();
    });

    const lowered = previous > 0 && value < previous;
    const rerate = previous > 0;
    const counters = this.today();
    counters.rate += 1;
    if (rerate || wasReviewed) counters.review += 1;
    if (lowered) counters.lower += 1;

    await this.touchStreak();

    // The amount never depends on the value given — only on which act it was.
    let amount: number = XP.rate;
    let headline: string;
    if (lowered) {
      amount = XP.honest_downgrade;
      headline = this.t("downgrade");
    } else if (rerate) {
      amount = XP.rerate;
      headline = this.t("rated") + (value >= 4 ? this.t("rated_high") : this.t("rated_low"));
    } else {
      headline = this.t("rated") + (value >= 4 ? this.t("rated_high") : this.t("rated_low"));
    }

    const dependents = this.dependentCounts(this.concepts());
    const load = dependents[String(before.id ?? file.basename).toLowerCase()] ?? 0;

    await this.award(amount, headline);
    await this.checkBadges({ lowered, load });
    await this.maybeCompleteQuest();
    await this.save();
  }

  async onNoteChanged(file: TFile): Promise<void> {
    const fm = (this.app.metadataCache.getFileCache(file)?.frontmatter ?? {}) as NoteFrontmatter;
    if (fm.type === "source" && String(fm.status ?? "").toLowerCase() === "confirmed") {
      if (!this.data.countedSources.includes(file.path)) {
        this.data.countedSources.push(file.path);
        this.today().source += 1;
        await this.touchStreak();
        await this.award(
          XP.confirm_source,
          this.lang() === "sv"
            ? "Källa bekräftad. Ett påstående mindre som vilar på gissning."
            : "Source confirmed. One less claim resting on a guess.",
        );
        await this.grantBadge("source-hunter");
        await this.maybeCompleteQuest();
      }
    }
    this.refreshStatus();
  }

  /* ---------------------------------------------------------------- chrome */
  notice(icon: string, text: string): void {
    const frag = document.createDocumentFragment();
    const wrap = frag.createDiv({ cls: "sf-notice" });
    wrap.createSpan({ cls: "sf-notice-icon", text: icon });
    wrap.createSpan({ cls: "sf-notice-text", text });
    new Notice(frag, 6000);
  }

  refreshStatus(): void {
    if (!this.status) return;
    if (!this.data.settings.showStatusBar) {
      this.status.setText("");
      return;
    }
    const lvl = this.level();
    const progress = this.questProgress();
    const done = progress.filter((p) => p.complete).length;
    const left = this.sprintLeft();
    if (left > 0) {
      this.status.setText(`⏳ ${this.formatLeft(left)} · 🦉 ${lvl.name}`);
      return;
    }
    const streak = this.data.streak ? ` · 🔥${this.data.streak}` : "";
    const quest = progress.length ? ` · 🎯${done}/${progress.length}` : "";
    this.status.setText(`🦉 ${lvl.name} · ${this.data.xp} XP${streak}${quest}`);
  }
}
