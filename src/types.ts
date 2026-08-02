import type { TFile } from "obsidian";

export type Lang = "en" | "sv";

export interface NoteFrontmatter {
  type?: string;
  id?: string;
  title?: string;
  aliases?: unknown;
  courses?: unknown;
  prerequisites?: unknown;
  confidence?: number;
  last_reviewed?: string;
  status?: string;
  citekey?: string;
  zotero?: string;
  [key: string]: unknown;
}

export interface ConceptNote {
  file: TFile;
  fm: NoteFrontmatter;
}

export interface Candidate extends ConceptNote {
  id: string;
  conf: number;
  load: number;
  degree: number;
  score: number;
  reasons: string[];
}

export type QuestKind = "rate" | "review" | "source" | "sprint";

export interface QuestTask {
  kind: QuestKind;
  n: number;
  label: string;
}

export interface QuestProgress extends QuestTask {
  done: number;
  complete: boolean;
}

export interface Badge {
  id: string;
  icon: string;
  en: string;
  sv: string;
  en_desc: string;
  sv_desc: string;
}

export interface LevelInfo {
  n: number;
  name: string;
  at: number;
  nextAt: number | null;
  nextName: string | null;
}

export interface DayActions {
  rate: number;
  review: number;
  source: number;
  lower: number;
  sprint: number;
}

export interface Settings {
  language: Lang;
  /** Folder holding concept notes. Empty means "search the whole vault". */
  conceptsFolder: string;
  /** Folder holding source notes. Empty means "search the whole vault". */
  sourcesFolder: string;
  dailyGoal: number;
  showStatusBar: boolean;
  celebrate: boolean;
  sprintMinutes: number;
  breakMinutes: number;
}

export interface PluginData {
  xp: number;
  streak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  badges: string[];
  actions: Record<string, DayActions>;
  countedSources: string[];
  completedQuests: string[];
  quest: QuestTask[] | null;
  questDate: string | null;
  sprintEnd: number | null;
  sprintLength: number;
  settings: Settings;
}

/** A candidate link the student has not yet approved. Offsets are into the note body. */
export interface LinkCandidate {
  id: string;
  title: string;
  matched: string;
  index: number;
  context: string;
}

export interface BadgeContext {
  lowered?: boolean;
  load?: number;
}
