import { App, Modal, TFile } from "obsidian";

import { BADGES, badgeDesc, badgeName } from "./constants";
import { SCALE, fill } from "./i18n";
import type StudyFamiliar from "./main";
import type { Badge, LevelInfo, LinkCandidate, NoteFrontmatter } from "./types";

export class DashboardModal extends Modal {
  constructor(app: App, private plugin: StudyFamiliar) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.addClass("sf-modal");
    const p = this.plugin;
    const lvl = p.level();
    const lang = p.lang();

    const head = contentEl.createDiv({ cls: "sf-head" });
    head.createSpan({ cls: "sf-owl", text: "🦉" });
    const headText = head.createDiv();
    headText.createDiv({ cls: "sf-level", text: lvl.name });
    const need = lvl.nextAt ? `${lvl.nextAt - p.data.xp} XP` : p.t("maxed");
    headText.createDiv({
      cls: "sf-sub",
      text: fill(p.t("xp_bar"), { xp: p.data.xp, need, name: lvl.nextName ?? "" }),
    });

    const bar = contentEl.createDiv({ cls: "sf-bar" });
    const span = lvl.nextAt ? (p.data.xp - lvl.at) / (lvl.nextAt - lvl.at) : 1;
    // The width is data, not styling: hand it to CSS as a variable rather than setting style here.
    bar.createDiv({ cls: "sf-bar-fill" })
      .style.setProperty("--sf-progress", `${Math.max(4, Math.min(100, span * 100))}%`);

    if (p.data.streak) {
      contentEl.createDiv({ cls: "sf-streak", text: `🔥 ${fill(p.t("streak_day"), { n: p.data.streak })}` });
    }

    const sprintRow = contentEl.createDiv({ cls: "sf-sprint" });
    const left = p.sprintLeft();
    if (left > 0) {
      sprintRow.createSpan({ cls: "sf-sprint-clock", text: `⏳ ${p.formatLeft(left)}` });
      const stop = sprintRow.createEl("button", { text: p.t("sprint_later") });
      stop.onclick = async () => {
        await p.stopSprint();
        this.close();
      };
    } else {
      const start = sprintRow.createEl("button", {
        cls: "mod-cta",
        text: `⏳ ${p.t("sprint_title")} · ${p.data.settings.sprintMinutes} min`,
      });
      start.onclick = async () => {
        this.close();
        await p.startSprint();
      };
    }

    const quest = p.questProgress();
    if (quest.length) {
      contentEl.createEl("h3", { text: p.t("quest_title") });
      const list = contentEl.createDiv({ cls: "sf-quest" });
      for (const task of quest) {
        const row = list.createDiv({ cls: "sf-quest-row" + (task.complete ? " sf-done" : "") });
        row.createSpan({ cls: "sf-check", text: task.complete ? "✓" : "○" });
        row.createSpan({ text: task.label });
        row.createSpan({ cls: "sf-count", text: `${task.done}/${task.n}` });
      }
    }

    contentEl.createEl("h3", { text: p.t("study_next") });
    const candidates = p.candidates(6);
    if (!candidates.length) {
      contentEl.createDiv({ cls: "sf-sub", text: p.t("no_concepts") });
    }
    for (const c of candidates) {
      const card = contentEl.createDiv({ cls: "sf-card" });
      const body = card.createDiv();
      body.createDiv({ cls: "sf-card-title", text: c.fm.title ?? c.file.basename });
      body.createDiv({ cls: "sf-sub", text: c.reasons.join(" · ") });
      const actions = card.createDiv({ cls: "sf-actions" });
      const open = actions.createEl("button", { text: p.t("open") });
      open.onclick = () => {
        this.close();
        void this.app.workspace.getLeaf(false).openFile(c.file);
      };
      const rate = actions.createEl("button", { cls: "mod-cta", text: p.t("rate") });
      rate.onclick = () => {
        this.close();
        new RateModal(this.app, p, c.file, c.fm).open();
      };
    }

    contentEl.createEl("h3", { text: p.t("badges") });
    const strip = contentEl.createDiv({ cls: "sf-badges" });
    if (!p.data.badges.length) {
      strip.createDiv({ cls: "sf-sub", text: p.t("no_badges") });
    }
    for (const id of p.data.badges) {
      const badge = BADGES.find((b) => b.id === id);
      if (!badge) continue;
      const el = strip.createDiv({ cls: "sf-badge" });
      el.createSpan({ text: badge.icon });
      el.createSpan({ text: badgeName(badge, lang) });
      el.setAttribute("aria-label", badgeDesc(badge, lang));
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

export class RateModal extends Modal {
  constructor(
    app: App,
    private plugin: StudyFamiliar,
    private file: TFile,
    private fm: NoteFrontmatter = {},
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.addClass("sf-modal");
    const p = this.plugin;

    contentEl.createEl("h2", { text: this.fm.title ?? this.file.basename });
    contentEl.createDiv({ cls: "sf-rate-title", text: p.t("rate_title") });
    contentEl.createDiv({ cls: "sf-sub", text: p.t("rate_sub") });

    const scale = SCALE[p.lang()];
    const wrap = contentEl.createDiv({ cls: "sf-scale" });
    for (let value = 1; value <= 5; value++) {
      const btn = wrap.createEl("button", { cls: "sf-scale-btn" });
      btn.createSpan({ cls: "sf-scale-n", text: String(value) });
      btn.createSpan({ cls: "sf-scale-label", text: scale[value - 1] });
      if (this.fm.confidence === value) btn.addClass("sf-current");
      btn.onclick = async () => {
        this.close();
        await p.applyRating(this.file, value);
      };
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

export class SuggestLinksModal extends Modal {
  private chosen: Set<string>;

  constructor(
    app: App,
    private plugin: StudyFamiliar,
    private file: TFile,
    private head: string,
    private candidates: LinkCandidate[],
  ) {
    super(app);
    this.chosen = new Set(candidates.map((c) => c.id));
  }

  onOpen(): void {
    const { contentEl } = this;
    const p = this.plugin;
    contentEl.addClass("sf-modal");
    contentEl.createEl("h2", { text: p.t("suggest_title") });
    contentEl.createDiv({ cls: "sf-sub", text: p.t("suggest_sub") });

    for (const c of this.candidates) {
      const row = contentEl.createDiv({ cls: "sf-suggest-row" });
      const box = row.createEl("input", { type: "checkbox" });
      box.checked = true;
      box.onchange = () => {
        if (box.checked) this.chosen.add(c.id);
        else this.chosen.delete(c.id);
      };
      const text = row.createDiv();
      text.createDiv({ cls: "sf-card-title", text: `${c.title}  ·  "${c.matched}"` });
      text.createDiv({ cls: "sf-sub", text: `…${c.context}…` });
    }

    const actions = contentEl.createDiv({ cls: "sf-actions sf-center" });
    const apply = actions.createEl("button", { cls: "mod-cta", text: p.t("suggest_apply") });
    apply.onclick = async () => {
      const chosen = this.candidates.filter((c) => this.chosen.has(c.id));
      this.close();
      if (chosen.length) await p.applyLinks(this.file, this.head, chosen);
    };
    const cancel = actions.createEl("button", { text: p.t("sprint_later") });
    cancel.onclick = () => this.close();
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

export class SprintDoneModal extends Modal {
  constructor(app: App, private plugin: StudyFamiliar, private minutes: number) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    const p = this.plugin;
    contentEl.addClass("sf-modal", "sf-celebrate");
    contentEl.createDiv({ cls: "sf-big", text: "⏳" });
    contentEl.createEl("h2", { text: fill(p.t("sprint_done"), { n: this.minutes }) });
    // The sprint ends with retrieval, not with a bell — the last two minutes are the valuable ones.
    contentEl.createDiv({ cls: "sf-recall", text: p.t("sprint_recall") });
    contentEl.createDiv({
      cls: "sf-sub",
      text: fill(p.t("sprint_break"), { n: p.data.settings.breakMinutes }),
    });

    const row = contentEl.createDiv({ cls: "sf-actions sf-center" });
    const rate = row.createEl("button", { cls: "mod-cta", text: p.t("sprint_rate_now") });
    rate.onclick = () => {
      this.close();
      const top = p.candidates(1)[0];
      if (top) new RateModal(this.app, p, top.file, top.fm).open();
      else new DashboardModal(this.app, p).open();
    };
    const later = row.createEl("button", { text: p.t("sprint_later") });
    later.onclick = () => this.close();
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

export class LevelModal extends Modal {
  constructor(app: App, private plugin: StudyFamiliar, private level: LevelInfo) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.addClass("sf-modal", "sf-celebrate");
    contentEl.createDiv({ cls: "sf-big", text: "🦉" });
    contentEl.createEl("h2", {
      text: fill(this.plugin.t("level_up"), { n: this.level.n, name: this.level.name }),
    });
    contentEl.createDiv({
      cls: "sf-sub",
      text:
        this.plugin.lang() === "sv"
          ? "Nivån mäter arbetet du lagt in, inte vad du kan. Det andra testas på fredag."
          : "The level measures work put in, not what you know. That gets tested on Friday.",
    });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

export class BadgeEarnedModal extends Modal {
  constructor(app: App, private plugin: StudyFamiliar, private badge: Badge) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    const lang = this.plugin.lang();
    contentEl.addClass("sf-modal", "sf-celebrate");
    contentEl.createDiv({ cls: "sf-big", text: this.badge.icon });
    contentEl.createEl("h2", { text: badgeName(this.badge, lang) });
    contentEl.createDiv({ cls: "sf-sub", text: badgeDesc(this.badge, lang) });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

export class BadgeModal extends Modal {
  constructor(app: App, private plugin: StudyFamiliar) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    const p = this.plugin;
    const lang = p.lang();
    contentEl.addClass("sf-modal");
    contentEl.createEl("h2", { text: p.t("badges") });
    for (const badge of BADGES) {
      const owned = p.data.badges.includes(badge.id);
      const row = contentEl.createDiv({ cls: "sf-badge-row" + (owned ? "" : " sf-locked") });
      row.createSpan({ cls: "sf-badge-icon", text: owned ? badge.icon : "·" });
      const text = row.createDiv();
      text.createDiv({ cls: "sf-card-title", text: badgeName(badge, lang) });
      text.createDiv({ cls: "sf-sub", text: badgeDesc(badge, lang) });
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
