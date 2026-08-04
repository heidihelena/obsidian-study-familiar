import {
  App,
  PluginSettingTab,
  Setting,
  SettingDefinitionItem,
  requireApiVersion,
} from "obsidian";

import { DEFAULT_DATA } from "./constants";
import type StudyFamiliar from "./main";
import type { Settings } from "./types";

const SCORING_NOTE =
  "XP is paid for the act of studying, never for the rating you give. Rating a concept 2 pays " +
  "the same as rating it 5, and lowering a rating pays more than raising one. Nothing here " +
  "claims you know anything: levels measure work done, and understanding is checked separately, " +
  "by explaining and drilling.";

export class StudyFamiliarSettings extends PluginSettingTab {
  constructor(app: App, private plugin: StudyFamiliar) {
    super(app, plugin);
  }

  /**
   * The declarative form is what Obsidian 1.13+ indexes for settings search. `display()` below
   * renders the same list through the classic API, so the tab still works on the older versions
   * `minAppVersion` still supports. One list, two renderers, no duplicated copy.
   */
  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      {
        name: "Concepts folder",
        desc: "Where concept notes live. Notes still need `type: concept` in their frontmatter. Leave empty to search the whole vault.",
        control: { type: "text", key: "conceptsFolder", placeholder: "Concepts" },
      },
      {
        name: "Sources folder",
        desc: "Where source notes live, for the unconfirmed-source quest. Notes still need `type: source`. Leave empty to search the whole vault.",
        control: { type: "text", key: "sourcesFolder", placeholder: "Sources" },
      },
      {
        name: "Language",
        desc: "Interface language for the familiar.",
        control: { type: "dropdown", key: "language", options: { en: "English", sv: "Svenska" } },
      },
      {
        name: "Daily goal",
        desc: "How many concepts a daily quest asks for. Small is the point: a goal you hit on a bad day beats one you abandon.",
        control: { type: "slider", key: "dailyGoal", min: 1, max: 8, step: 1 },
      },
      {
        name: "Sprint length",
        desc: "Minutes of focused work per sprint. Twenty-five is the usual starting point; shorter beats abandoned.",
        control: { type: "slider", key: "sprintMinutes", min: 10, max: 50, step: 5 },
      },
      {
        name: "Break length",
        desc: "Suggested break after a sprint. Away from the screen: the consolidation happens while not studying.",
        control: { type: "slider", key: "breakMinutes", min: 3, max: 15, step: 1 },
      },
      {
        name: "Status bar",
        desc: "Show level, XP, streak and quest progress in the status bar.",
        control: { type: "toggle", key: "showStatusBar" },
      },
      {
        name: "Celebrations",
        desc: "Pop up a card for a new level or feather. Turn off during exam week if it breaks concentration.",
        control: { type: "toggle", key: "celebrate" },
      },
      {
        name: "How scoring works",
        desc: SCORING_NOTE,
        render: (setting: Setting) => {
          setting.setHeading();
        },
      },
      {
        name: "Reset progress",
        desc: "Clears XP, streak and feathers. Your notes and ratings are untouched.",
        action: (el: HTMLElement) => {
          const button = el.createEl("button", { text: "Reset", cls: "mod-destructive" });
          button.onclick = async () => {
            const keep = this.plugin.data.settings;
            this.plugin.data = { ...DEFAULT_DATA, settings: keep };
            await this.plugin.save();
            // update() re-renders the declarative tab on 1.13+; display() is the pre-1.13 path.
            if (requireApiVersion("1.13.0")) this.update();
            else this.display();
          };
        },
      },
    ];
  }

  /** Settings live under `plugin.data.settings`, not the default `plugin.settings`. */
  getControlValue(key: string): unknown {
    return (this.plugin.data.settings as unknown as Record<string, unknown>)[key];
  }

  async setControlValue(key: string, value: unknown): Promise<void> {
    (this.plugin.data.settings as unknown as Record<string, unknown>)[key] = value;
    await this.plugin.save();
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    for (const definition of this.getSettingDefinitions()) {
      if (!("name" in definition)) continue;
      const setting = new Setting(containerEl).setName(definition.name);
      if (typeof definition.desc === "string") setting.setDesc(definition.desc);

      if ("render" in definition && definition.render) {
        definition.render(setting, undefined as never);
        continue;
      }

      if ("action" in definition && definition.action) {
        definition.action(setting.controlEl, 0);
        continue;
      }

      if (!("control" in definition) || !definition.control) continue;
      const control = definition.control;
      const key = control.key;
      const current = this.getControlValue(key);

      switch (control.type) {
        case "text":
          setting.addText((t) =>
            t
              .setPlaceholder(control.placeholder ?? "")
              .setValue(String(current ?? ""))
              .onChange((v) => void this.setControlValue(key, v)),
          );
          break;
        case "dropdown":
          setting.addDropdown((d) => {
            for (const [value, label] of Object.entries(control.options)) d.addOption(value, label);
            d.setValue(String(current ?? "")).onChange((v) => void this.setControlValue(key, v));
          });
          break;
        case "slider":
          setting.addSlider((sl) =>
            sl
              .setLimits(control.min, control.max, control.step)
              .setValue(Number(current ?? control.min))
              .onChange((v) => void this.setControlValue(key, v)),
          );
          break;
        case "toggle":
          setting.addToggle((t) =>
            t.setValue(Boolean(current)).onChange((v) => void this.setControlValue(key, v)),
          );
          break;
        default:
          break;
      }
    }
  }
}

/** Compile-time check that every declared key is a real setting. */
type DeclaredKeys = keyof Settings;
export type SettingKey = DeclaredKeys;
