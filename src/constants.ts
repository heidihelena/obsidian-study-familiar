import type { Badge, Lang, PluginData } from "./types";

/* The rule these numbers encode: XP is paid for the ACT of studying, never for the rating given.
   Rating a concept 2 pays exactly what rating it 5 pays, and lowering a rating pays more than
   raising one. A tool that paid for high self-ratings would teach a student to lie to himself,
   which is worse than having no tool. The smoke test asserts this, so it cannot drift. */
export const XP = {
  rate: 10,
  rerate: 12,
  honest_downgrade: 15,
  confirm_source: 20,
  new_concept: 15,
  quest_complete: 25,
  sprint_complete: 20,
} as const;

export const STALE_DAYS = 14;

export const LEVELS: Array<{ at: number } & Record<Lang, string>> = [
  { at: 0, en: "Egg", sv: "Ägg" },
  { at: 60, en: "Fledgling", sv: "Dunboll" },
  { at: 180, en: "Branch Owl", sv: "Grenuggla" },
  { at: 400, en: "Night Flyer", sv: "Nattflygare" },
  { at: 750, en: "Silent Wing", sv: "Tyst vinge" },
  { at: 1200, en: "Watcher", sv: "Väktare" },
  { at: 1800, en: "Great Owl", sv: "Stor uggla" },
  { at: 2600, en: "Professor Owl", sv: "Professorsuggla" },
];

export const BADGES: Badge[] = [
  { id: "first-flight", icon: "🪶", en: "First Flight", sv: "Första flygturen",
    en_desc: "Rated your first concept.", sv_desc: "Betygsatte ditt första begrepp." },
  { id: "ten-feathers", icon: "🌿", en: "Ten Feathers", sv: "Tio fjädrar",
    en_desc: "Ten concepts rated.", sv_desc: "Tio begrepp betygsatta." },
  { id: "honest-owl", icon: "⚖️", en: "Honest Owl", sv: "Ärlig uggla",
    en_desc: "Lowered a rating. The hardest and most useful move there is.",
    sv_desc: "Sänkte ett betyg. Det svåraste och nyttigaste draget som finns." },
  { id: "steady-wing", icon: "🔥", en: "Steady Wing", sv: "Stadig vinge",
    en_desc: "Three days in a row.", sv_desc: "Tre dagar i rad." },
  { id: "week-owl", icon: "🌙", en: "Owl of the Week", sv: "Veckans uggla",
    en_desc: "Seven days in a row.", sv_desc: "Sju dagar i rad." },
  { id: "source-hunter", icon: "📚", en: "Source Hunter", sv: "Källjägare",
    en_desc: "Confirmed a source against the real reading list.",
    sv_desc: "Bekräftade en källa mot den riktiga litteraturlistan." },
  { id: "quest-runner", icon: "🎯", en: "Quest Runner", sv: "Uppdragslöpare",
    en_desc: "Finished a daily quest.", sv_desc: "Klarade ett dagsuppdrag." },
  { id: "first-sprint", icon: "⏳", en: "First Sprint", sv: "Första passet",
    en_desc: "Finished a focused study sprint without bailing out.",
    sv_desc: "Klarade ett fokuspass utan att hoppa av." },
  { id: "three-sprints", icon: "🌌", en: "Long Night", sv: "Lång natt",
    en_desc: "Three sprints in one day. Stop after this one.",
    sv_desc: "Tre pass på en dag. Sluta efter det här." },
  { id: "foundation-fixer", icon: "🧱", en: "Foundation Fixer", sv: "Grundläggare",
    en_desc: "Rated a concept that five or more others depend on.",
    sv_desc: "Betygsatte ett begrepp som fem eller fler andra vilar på." },
  { id: "course-swept", icon: "🏅", en: "Course Swept", sv: "Kurs avklarad",
    en_desc: "Every concept in one course has a rating.",
    sv_desc: "Varje begrepp i en kurs har ett betyg." },
];

export const DEFAULT_DATA: PluginData = {
  xp: 0,
  streak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  badges: [],
  actions: {},
  countedSources: [],
  completedQuests: [],
  quest: null,
  questDate: null,
  sprintEnd: null,
  sprintLength: 25,
  settings: {
    language: "en",
    conceptsFolder: "Concepts",
    sourcesFolder: "Sources",
    dailyGoal: 3,
    showStatusBar: true,
    celebrate: true,
    sprintMinutes: 25,
    breakMinutes: 5,
  },
};

export function badgeName(badge: Badge, lang: Lang): string {
  return lang === "sv" ? badge.sv : badge.en;
}

export function badgeDesc(badge: Badge, lang: Lang): string {
  return lang === "sv" ? badge.sv_desc : badge.en_desc;
}
