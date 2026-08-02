import { App, PluginSettingTab, Setting } from "obsidian";

import { DEFAULT_DATA } from "./constants";
import type StudyFamiliar from "./main";
import type { Lang } from "./types";

export class StudyFamiliarSettings extends PluginSettingTab {
  constructor(app: App, private plugin: StudyFamiliar) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    const s = this.plugin.data.settings;

    new Setting(containerEl)
      .setName("Concepts folder")
      .setDesc("Where concept notes live. Notes still need `type: concept` in their frontmatter. Leave empty to search the whole vault.")
      .addText((t) =>
        t
          .setPlaceholder("Concepts")
          .setValue(s.conceptsFolder)
          .onChange(async (v) => {
            s.conceptsFolder = v;
            await this.plugin.save();
          }),
      );

    new Setting(containerEl)
      .setName("Sources folder")
      .setDesc("Where source notes live, for the unconfirmed-source quest. Notes still need `type: source`. Leave empty to search the whole vault.")
      .addText((t) =>
        t
          .setPlaceholder("Sources")
          .setValue(s.sourcesFolder)
          .onChange(async (v) => {
            s.sourcesFolder = v;
            await this.plugin.save();
          }),
      );

    new Setting(containerEl)
      .setName("Language")
      .setDesc("Interface language for the familiar. Swedish for exam-language study, English otherwise.")
      .addDropdown((d) =>
        d
          .addOption("en", "English")
          .addOption("sv", "Svenska")
          .setValue(s.language)
          .onChange(async (v) => {
            s.language = v as Lang;
            await this.plugin.save();
          }),
      );

    new Setting(containerEl)
      .setName("Daily goal")
      .setDesc("How many concepts a daily quest asks for. Small is the point — a goal you hit on a bad day beats one you abandon.")
      .addSlider((sl) =>
        sl
          .setLimits(1, 8, 1)
          .setValue(s.dailyGoal)
          .setDynamicTooltip()
          .onChange(async (v) => {
            s.dailyGoal = v;
            this.plugin.data.questDate = null;
            await this.plugin.save();
          }),
      );

    new Setting(containerEl)
      .setName("Sprint length")
      .setDesc("Minutes of focused work per sprint. Twenty-five is the usual starting point; shorter is better than abandoned.")
      .addSlider((sl) =>
        sl
          .setLimits(10, 50, 5)
          .setValue(s.sprintMinutes)
          .setDynamicTooltip()
          .onChange(async (v) => {
            s.sprintMinutes = v;
            await this.plugin.save();
          }),
      );

    new Setting(containerEl)
      .setName("Break length")
      .setDesc("Suggested break after a sprint. Away from the screen — the consolidation happens while not studying.")
      .addSlider((sl) =>
        sl
          .setLimits(3, 15, 1)
          .setValue(s.breakMinutes)
          .setDynamicTooltip()
          .onChange(async (v) => {
            s.breakMinutes = v;
            await this.plugin.save();
          }),
      );

    new Setting(containerEl).setName("Status bar").addToggle((t) =>
      t.setValue(s.showStatusBar).onChange(async (v) => {
        s.showStatusBar = v;
        await this.plugin.save();
      }),
    );

    new Setting(containerEl)
      .setName("Celebrations")
      .setDesc("Pop up a card for a new level or feather. Turn off during exam week if it breaks concentration.")
      .addToggle((t) =>
        t.setValue(s.celebrate).onChange(async (v) => {
          s.celebrate = v;
          await this.plugin.save();
        }),
      );

    new Setting(containerEl).setName("How scoring works").setHeading();
    containerEl.createEl("p", { cls: "sf-sub" }).setText(
      "XP is paid for the act of studying, never for the rating you give. Rating a concept 2 pays " +
        "the same as rating it 5, and lowering a rating pays more than raising one. Nothing here " +
        "claims you know anything — levels measure work done, and the vault checks understanding " +
        "separately through explaining and drilling.",
    );

    new Setting(containerEl)
      .setName("Reset progress")
      .setDesc("Clears XP, streak and feathers. Your notes and ratings are untouched.")
      .addButton((b) =>
        b
          .setWarning()
          .setButtonText("Reset")
          .onClick(async () => {
            const keep = this.plugin.data.settings;
            this.plugin.data = { ...DEFAULT_DATA, settings: keep };
            await this.plugin.save();
            this.display();
          }),
      );
  }
}
