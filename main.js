'use strict';

const { Plugin, Notice, Modal, PluginSettingTab, Setting } = require('obsidian');

/* Design rule that shapes every number below: XP is paid for the ACT of studying, never for the
   rating given. Rating a concept 2 pays exactly what rating it 5 pays, and lowering a rating pays
   more than raising one. A gamified vault that pays for high self-ratings would teach a student to
   lie to himself, which is worse than having no vault. */
const XP = {
  rate: 10,
  rerate: 12,
  honest_downgrade: 15,
  confirm_source: 20,
  new_concept: 15,
  quest_complete: 25,
  sprint_complete: 20,
};

const LEVELS = [
  { at: 0, en: 'Egg', sv: 'Ägg' },
  { at: 60, en: 'Fledgling', sv: 'Dunboll' },
  { at: 180, en: 'Branch Owl', sv: 'Grenuggla' },
  { at: 400, en: 'Night Flyer', sv: 'Nattflygare' },
  { at: 750, en: 'Silent Wing', sv: 'Tyst vinge' },
  { at: 1200, en: 'Watcher', sv: 'Väktare' },
  { at: 1800, en: 'Great Owl', sv: 'Stor uggla' },
  { at: 2600, en: 'Professor Owl', sv: 'Professorsuggla' },
];

const BADGES = [
  { id: 'first-flight', icon: '🪶', en: 'First Flight', sv: 'Första flygturen',
    en_desc: 'Rated your first concept.', sv_desc: 'Betygsatte ditt första begrepp.' },
  { id: 'ten-feathers', icon: '🌿', en: 'Ten Feathers', sv: 'Tio fjädrar',
    en_desc: 'Ten concepts rated.', sv_desc: 'Tio begrepp betygsatta.' },
  { id: 'honest-owl', icon: '⚖️', en: 'Honest Owl', sv: 'Ärlig uggla',
    en_desc: 'Lowered a rating. The hardest and most useful move there is.',
    sv_desc: 'Sänkte ett betyg. Det svåraste och nyttigaste draget som finns.' },
  { id: 'steady-wing', icon: '🔥', en: 'Steady Wing', sv: 'Stadig vinge',
    en_desc: 'Three days in a row.', sv_desc: 'Tre dagar i rad.' },
  { id: 'week-owl', icon: '🌙', en: 'Owl of the Week', sv: 'Veckans uggla',
    en_desc: 'Seven days in a row.', sv_desc: 'Sju dagar i rad.' },
  { id: 'source-hunter', icon: '📚', en: 'Source Hunter', sv: 'Källjägare',
    en_desc: 'Confirmed a source against the real reading list.',
    sv_desc: 'Bekräftade en källa mot den riktiga litteraturlistan.' },
  { id: 'quest-runner', icon: '🎯', en: 'Quest Runner', sv: 'Uppdragslöpare',
    en_desc: 'Finished a daily quest.', sv_desc: 'Klarade ett dagsuppdrag.' },
  { id: 'foundation-fixer', icon: '🧱', en: 'Foundation Fixer', sv: 'Grundläggare',
    en_desc: 'Rated a concept that five or more others depend on.',
    sv_desc: 'Betygsatte ett begrepp som fem eller fler andra vilar på.' },
  { id: 'first-sprint', icon: '⏳', en: 'First Sprint', sv: 'Första passet',
    en_desc: 'Finished a focused study sprint without bailing out.',
    sv_desc: 'Klarade ett fokuspass utan att hoppa av.' },
  { id: 'three-sprints', icon: '🌌', en: 'Long Night', sv: 'Lång natt',
    en_desc: 'Three sprints in one day. Stop after this one.',
    sv_desc: 'Tre pass på en dag. Sluta efter det här.' },
  { id: 'course-swept', icon: '🏅', en: 'Course Swept', sv: 'Kurs avklarad',
    en_desc: 'Every concept in one course has a rating.',
    sv_desc: 'Varje begrepp i en kurs har ett betyg.' },
];

const T = {
  en: {
    rate_title: 'How well can you explain this — without notes?',
    rate_sub: 'Your call, not the owl\'s. This number only helps if it is honest.',
    scale: ['Never seen it work', 'Recognise it, cannot rebuild it', 'Can explain the gist',
            'Can explain it and the boundaries', 'Could teach it to someone else'],
    rated: 'Rated. ',
    rated_high: 'Noted — we will test that rather than take your word for it.',
    rated_low: 'Good. A low honest number is worth more than a high hopeful one.',
    downgrade: 'Honest downgrade. That is the rating that actually helps you.',
    streak_day: 'Day {n} in a row.',
    welcome_back: 'Welcome back. Streak restarts today — nothing is lost that matters.',
    level_up: 'Level {n} — {name}',
    quest_title: 'Today\'s quest',
    quest_done: 'Quest complete. That is the whole day\'s obligation done.',
    no_concepts: 'No concept notes found in Concepts/.',
    study_next: 'What to study now',
    open: 'Open', rate: 'Rate',
    reason_unrated: 'never rated', reason_weak: 'confidence {n}',
    reason_stale: 'not reviewed in {n} days', reason_never: 'never reviewed',
    reason_load: '{n} concepts rest on it', reason_hub: 'hub ({n} links)',
    badges: 'Feathers earned', no_badges: 'None yet — the first one is one keystroke away.',
    not_concept: 'This note is not a concept note, so there is nothing to rate.',
    quest_rate: 'Rate {n} concepts you have never rated',
    quest_rate_1: 'Rate one concept you have never rated',
    quest_review: 'Revisit {n} concepts you have not seen in two weeks',
    quest_review_1: 'Revisit one concept you have not seen in two weeks',
    quest_source: 'Confirm a source against the real reading list',
    xp_bar: '{xp} XP · {need} to {name}',
    maxed: 'top level',
    sprint_start: 'Sprint started — {n} minutes. One concept, nothing else open.',
    sprint_done: 'Sprint done — {n} minutes of real work.',
    sprint_recall: 'Before the break: what are the three things you could now explain without notes? Say them out loud, then rate one.',
    sprint_stopped: 'Sprint stopped at {n} minutes. Stopping deliberately beats grinding badly — the time still counted.',
    sprint_running: 'A sprint is already running: {n} left.',
    sprint_none: 'No sprint running.',
    sprint_break: 'Take {n} minutes away from the screen. Walking beats scrolling for what happens next.',
    sprint_title: 'Study sprint',
    sprint_rate_now: 'Rate a concept',
    sprint_later: 'Not now',
    quest_sprint: 'Do one focused sprint',
    suggest_title: 'Concepts mentioned but not linked',
    suggest_sub: 'Each one you tick becomes a link at its first mention. Skip the ones where the word is ordinary language rather than a reference — that judgement is yours.',
    suggest_none: 'Nothing unlinked found in this note.',
    suggest_apply: 'Link selected',
    suggest_done: '{n} links added. The graph picks them up on the next build.',
    suggest_skipped: '{n} skipped — the note changed while the list was open.',
    zotero_added: 'Zotero link added — click it in the note to open the item.',
    zotero_nokey: 'No citekey on this source yet. In Zotero with Better BibTeX: right-click the item → Better BibTeX → Copy citation key, paste it into `citekey:`, then run this again.',
    zotero_notsource: 'Zotero links belong on notes in Sources/.',
    zotero_has: 'This source already has a Zotero link.',
  },
  sv: {
    rate_title: 'Hur väl kan du förklara det här — utan anteckningar?',
    rate_sub: 'Ditt omdöme, inte ugglans. Siffran hjälper bara om den är ärlig.',
    scale: ['Aldrig sett det fungera', 'Känner igen det, kan inte bygga upp det',
            'Kan förklara huvuddragen', 'Kan förklara det och gränserna',
            'Skulle kunna lära ut det'],
    rated: 'Betygsatt. ',
    rated_high: 'Noterat — vi testar det hellre än tar ditt ord på det.',
    rated_low: 'Bra. En låg ärlig siffra är värd mer än en hög förhoppningsfull.',
    downgrade: 'Ärlig sänkning. Det är den siffran som faktiskt hjälper dig.',
    streak_day: 'Dag {n} i rad.',
    welcome_back: 'Välkommen tillbaka. Sviten börjar om idag — inget viktigt är förlorat.',
    level_up: 'Nivå {n} — {name}',
    quest_title: 'Dagens uppdrag',
    quest_done: 'Uppdraget klart. Där är hela dagens plikt avklarad.',
    no_concepts: 'Hittade inga begreppsnoter i Concepts/.',
    study_next: 'Vad du ska plugga nu',
    open: 'Öppna', rate: 'Betygsätt',
    reason_unrated: 'aldrig betygsatt', reason_weak: 'säkerhet {n}',
    reason_stale: 'inte repeterat på {n} dagar', reason_never: 'aldrig repeterat',
    reason_load: '{n} begrepp vilar på det', reason_hub: 'nav ({n} länkar)',
    badges: 'Intjänade fjädrar', no_badges: 'Inga än — den första är ett tangenttryck bort.',
    not_concept: 'Den här noten är ingen begreppsnot, så det finns inget att betygsätta.',
    quest_rate: 'Betygsätt {n} begrepp du aldrig betygsatt',
    quest_rate_1: 'Betygsätt ett begrepp du aldrig betygsatt',
    quest_review: 'Återbesök {n} begrepp du inte sett på två veckor',
    quest_review_1: 'Återbesök ett begrepp du inte sett på två veckor',
    quest_source: 'Bekräfta en källa mot den riktiga litteraturlistan',
    xp_bar: '{xp} XP · {need} till {name}',
    maxed: 'högsta nivån',
    sprint_start: 'Passet igång — {n} minuter. Ett begrepp, inget annat öppet.',
    sprint_done: 'Passet klart — {n} minuter riktigt arbete.',
    sprint_recall: 'Före pausen: vilka tre saker kan du nu förklara utan anteckningar? Säg dem högt, betygsätt sedan ett begrepp.',
    sprint_stopped: 'Passet avbrutet efter {n} minuter. Att sluta medvetet slår att mala dåligt — tiden räknas ändå.',
    sprint_running: 'Ett pass pågår redan: {n} kvar.',
    sprint_none: 'Inget pass pågår.',
    sprint_break: 'Ta {n} minuter bort från skärmen. Att gå slår att skrolla för det som händer sen.',
    sprint_title: 'Fokuspass',
    sprint_rate_now: 'Betygsätt ett begrepp',
    sprint_later: 'Inte nu',
    quest_sprint: 'Gör ett fokuspass',
    suggest_title: 'Begrepp som nämns men inte länkas',
    suggest_sub: 'Varje ikryssad blir en länk vid första omnämnandet. Hoppa över dem där ordet är vanligt språk och inte en hänvisning — den bedömningen är din.',
    suggest_none: 'Hittade inget olänkat i den här noten.',
    suggest_apply: 'Länka valda',
    suggest_done: '{n} länkar tillagda. Grafen fångar upp dem vid nästa bygge.',
    suggest_skipped: '{n} hoppades över — noten ändrades medan listan var öppen.',
    zotero_added: 'Zotero-länk tillagd — klicka den i noten för att öppna posten.',
    zotero_nokey: 'Ingen citekey på den här källan än. I Zotero med Better BibTeX: högerklicka posten → Better BibTeX → Copy citation key, klistra in i `citekey:`, kör sedan igen.',
    zotero_notsource: 'Zotero-länkar hör hemma på noter i Sources/.',
    zotero_has: 'Den här källan har redan en Zotero-länk.',
  },
};

const DEFAULT_DATA = {
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
  settings: { language: 'en', dailyGoal: 3, showStatusBar: true, celebrate: true, sprintMinutes: 25, breakMinutes: 5 },
};

const STALE_DAYS = 14;

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

function fill(str, vars) {
  return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
}

function linkTarget(value) {
  const m = String(value).match(/\[\[([^\]|#]+)/);
  return (m ? m[1] : String(value)).split('/').pop().trim().toLowerCase();
}

function asArray(value) {
  if (value === undefined || value === null || value === '') return [];
  return Array.isArray(value) ? value : [value];
}

class StudyFamiliar extends Plugin {
  async onload() {
    this.data = Object.assign({}, DEFAULT_DATA, await this.loadData());
    this.data.completedQuests = this.data.completedQuests || [];
    this.data.settings = Object.assign({}, DEFAULT_DATA.settings, this.data.settings);

    this.addRibbonIcon('graduation-cap', 'Study Familiar', () => new DashboardModal(this.app, this).open());

    this.status = this.addStatusBarItem();
    this.status.addClass('sf-status');
    this.status.onClickEvent(() => new DashboardModal(this.app, this).open());

    this.addCommand({ id: 'open-dashboard', name: 'Open the familiar', callback: () => new DashboardModal(this.app, this).open() });
    this.addCommand({ id: 'rate-current', name: 'Rate this concept', callback: () => this.rateCurrent() });
    this.addCommand({ id: 'study-next', name: 'What should I study now?', callback: () => new DashboardModal(this.app, this, 'study').open() });
    this.addCommand({ id: 'daily-quest', name: 'Today\'s quest', callback: () => new DashboardModal(this.app, this, 'quest').open() });
    this.addCommand({ id: 'badges', name: 'Feathers earned', callback: () => new BadgeModal(this.app, this).open() });
    this.addCommand({ id: 'suggest-links', name: 'Suggest links for this note', callback: () => this.suggestLinks() });
    this.addCommand({ id: 'zotero-link', name: 'Add Zotero link to this source', callback: () => this.addZoteroLink() });
    this.addCommand({ id: 'sprint-start', name: 'Start a study sprint', callback: () => this.startSprint() });
    this.addCommand({ id: 'sprint-stop', name: 'Stop the sprint', callback: () => this.stopSprint() });

    this.addSettingTab(new StudyFamiliarSettings(this.app, this));

    this.registerEvent(this.app.metadataCache.on('changed', (file) => this.onNoteChanged(file)));
    this.app.workspace.onLayoutReady(() => {
      if (this.sprintLeft() > 0) this.runTimer();
      else if (this.data.sprintEnd) { this.data.sprintEnd = null; this.save(); }
      this.refreshStatus();
    });
  }

  t(key) {
    const lang = this.data.settings.language === 'sv' ? 'sv' : 'en';
    return T[lang][key] !== undefined ? T[lang][key] : T.en[key];
  }

  async save() {
    await this.saveData(this.data);
    this.refreshStatus();
  }

  /* ---------------------------------------------------------------- vault reading */
  concepts() {
    return this.app.vault.getMarkdownFiles()
      .filter((f) => f.path.startsWith('Concepts/'))
      .map((f) => ({ file: f, fm: (this.app.metadataCache.getFileCache(f) || {}).frontmatter || {} }))
      .filter((c) => c.fm.type === 'concept');
  }

  dependentCounts(concepts) {
    const counts = {};
    for (const c of concepts) {
      for (const raw of asArray(c.fm.prerequisites)) {
        const key = linkTarget(raw);
        counts[key] = (counts[key] || 0) + 1;
      }
    }
    return counts;
  }

  degreeMap() {
    // Built once per pass: the previous per-file version rescanned every link in the vault.
    const resolved = this.app.metadataCache.resolvedLinks;
    const degrees = {};
    for (const [from, targets] of Object.entries(resolved)) {
      const outgoing = Object.keys(targets);
      degrees[from] = (degrees[from] || 0) + outgoing.length;
      for (const to of outgoing) {
        if (to !== from) degrees[to] = (degrees[to] || 0) + 1;
      }
    }
    return degrees;
  }

  candidates(limit = 8) {
    const concepts = this.concepts();
    const dependents = this.dependentCounts(concepts);
    const degrees = this.degreeMap();
    const today = todayISO();

    const scored = concepts.map((c) => {
      const id = (c.fm.id || c.file.basename).toLowerCase();
      const conf = typeof c.fm.confidence === 'number' ? c.fm.confidence : 0;
      const seen = c.fm.last_reviewed ? String(c.fm.last_reviewed) : null;
      const age = seen ? daysBetween(seen, today) : null;
      const load = dependents[id] || 0;
      const degree = degrees[c.file.path] || 0;

      let score = 0;
      const reasons = [];
      if (!conf) { score += 3; reasons.push(this.t('reason_unrated')); }
      else if (conf <= 2) { score += 4; reasons.push(fill(this.t('reason_weak'), { n: conf })); }
      if (age === null) { score += 1; reasons.push(this.t('reason_never')); }
      else if (age >= STALE_DAYS) { score += 2; reasons.push(fill(this.t('reason_stale'), { n: age })); }
      if (load >= 3) { score += 2; reasons.push(fill(this.t('reason_load'), { n: load })); }
      if (degree >= 20) { score += 1; reasons.push(fill(this.t('reason_hub'), { n: degree })); }

      return { ...c, id, conf, load, degree, score, reasons };
    });

    scored.sort((a, b) => b.score - a.score || b.load - a.load || b.degree - a.degree);
    return scored.slice(0, limit);
  }

  unconfirmedSources() {
    return this.app.vault.getMarkdownFiles()
      .filter((f) => f.path.startsWith('Sources/'))
      .map((f) => ({ file: f, fm: (this.app.metadataCache.getFileCache(f) || {}).frontmatter || {} }))
      .filter((s) => s.fm.type === 'source' && String(s.fm.status || '').toLowerCase() !== 'confirmed');
  }

  /* ---------------------------------------------------------------- progression */
  level() {
    let index = 0;
    for (let i = 0; i < LEVELS.length; i++) if (this.data.xp >= LEVELS[i].at) index = i;
    const lang = this.data.settings.language === 'sv' ? 'sv' : 'en';
    const next = LEVELS[index + 1];
    return {
      n: index + 1,
      name: LEVELS[index][lang],
      at: LEVELS[index].at,
      nextAt: next ? next.at : null,
      nextName: next ? next[lang] : null,
    };
  }

  today() {
    const key = todayISO();
    if (!this.data.actions[key]) this.data.actions[key] = { rate: 0, review: 0, source: 0, lower: 0, sprint: 0 };
    if (this.data.actions[key].sprint === undefined) this.data.actions[key].sprint = 0;
    return this.data.actions[key];
  }

  async touchStreak() {
    const today = todayISO();
    if (this.data.lastActiveDate === today) return;
    const gap = this.data.lastActiveDate ? daysBetween(this.data.lastActiveDate, today) : null;
    if (gap === 1) {
      this.data.streak += 1;
      this.notice('🔥', fill(this.t('streak_day'), { n: this.data.streak }));
    } else {
      const returning = this.data.lastActiveDate !== null;
      this.data.streak = 1;
      if (returning) this.notice('🦉', this.t('welcome_back'));
    }
    this.data.longestStreak = Math.max(this.data.longestStreak, this.data.streak);
    this.data.lastActiveDate = today;
  }

  async award(amount, headline) {
    const before = this.level().n;
    this.data.xp += amount;
    const after = this.level();
    if (headline) this.notice('🦉', `${headline}  +${amount} XP`);
    if (after.n > before && this.data.settings.celebrate) {
      new LevelModal(this.app, this, after).open();
    }
    await this.save();
  }

  async grantBadge(id) {
    if (this.data.badges.includes(id)) return;
    const badge = BADGES.find((b) => b.id === id);
    if (!badge) return;
    this.data.badges.push(id);
    await this.save();
    if (this.data.settings.celebrate) new BadgeEarnedModal(this.app, this, badge).open();
  }

  async checkBadges(ctx = {}) {
    const rated = this.concepts().filter((c) => typeof c.fm.confidence === 'number' && c.fm.confidence > 0);
    if (rated.length >= 1) await this.grantBadge('first-flight');
    if (rated.length >= 10) await this.grantBadge('ten-feathers');
    if (this.data.streak >= 3) await this.grantBadge('steady-wing');
    if (this.data.streak >= 7) await this.grantBadge('week-owl');
    if (ctx.lowered) await this.grantBadge('honest-owl');
    if (ctx.load >= 5) await this.grantBadge('foundation-fixer');

    const byCourse = {};
    for (const c of this.concepts()) {
      for (const course of asArray(c.fm.courses)) {
        if (!byCourse[course]) byCourse[course] = { total: 0, rated: 0 };
        byCourse[course].total += 1;
        if (typeof c.fm.confidence === 'number' && c.fm.confidence > 0) byCourse[course].rated += 1;
      }
    }
    if (Object.values(byCourse).some((v) => v.total >= 5 && v.total === v.rated)) {
      await this.grantBadge('course-swept');
    }
  }

  /* ---------------------------------------------------------------- quest */
  quest() {
    const today = todayISO();
    if (this.data.questDate === today && this.data.quest) return this.data.quest;

    const goal = this.data.settings.dailyGoal;
    const concepts = this.concepts();
    const unrated = concepts.filter((c) => !(typeof c.fm.confidence === 'number' && c.fm.confidence > 0));
    const stale = concepts.filter((c) => c.fm.last_reviewed &&
      daysBetween(String(c.fm.last_reviewed), today) >= STALE_DAYS);
    const sources = this.unconfirmedSources();

    const tasks = [];
    if (unrated.length) {
      const n = Math.min(goal, unrated.length);
      tasks.push({ kind: 'rate', n, label: n === 1 ? this.t('quest_rate_1') : fill(this.t('quest_rate'), { n }) });
    }
    if (stale.length) {
      const n = Math.min(2, stale.length);
      tasks.push({ kind: 'review', n, label: n === 1 ? this.t('quest_review_1') : fill(this.t('quest_review'), { n }) });
    }
    if (sources.length) {
      tasks.push({ kind: 'source', n: 1, label: this.t('quest_source') });
    }
    const sprint = { kind: 'sprint', n: 1, label: this.t('quest_sprint') };
    this.data.quest = [...tasks.slice(0, 2), sprint];
    this.data.questDate = today;
    this.saveData(this.data);
    return this.data.quest;
  }

  questProgress() {
    const done = this.today();
    return this.quest().map((task) => ({
      ...task,
      done: Math.min(done[task.kind] || 0, task.n),
      complete: (done[task.kind] || 0) >= task.n,
    }));
  }

  async maybeCompleteQuest() {
    const progress = this.questProgress();
    if (!progress.length || !progress.every((p) => p.complete)) return;
    const key = todayISO();
    if (this.data.completedQuests.includes(key)) return;
    this.data.completedQuests.push(key);
    await this.award(XP.quest_complete, this.t('quest_done'));
    await this.grantBadge('quest-runner');
  }

  /* ---------------------------------------------------------------- link suggestions */
  async suggestLinks() {
    const file = this.app.workspace.getActiveFile();
    if (!file) return;
    const raw = await this.app.vault.read(file);
    const own = ((this.app.metadataCache.getFileCache(file) || {}).frontmatter || {}).id || file.basename;

    const split = raw.match(/^---\n[\s\S]*?\n---\n/);
    const head = split ? split[0] : '';
    const body = raw.slice(head.length);
    // Blank out anything already linked, plus code, so matches land only in plain prose.
    const searchable = body
      .replace(/```[\s\S]*?```/g, (m) => ' '.repeat(m.length))
      .replace(/`[^`\n]*`/g, (m) => ' '.repeat(m.length))
      .replace(/\[\[[^\]]*\]\]/g, (m) => ' '.repeat(m.length));

    const candidates = [];
    const seen = new Set();
    for (const c of this.concepts()) {
      const id = (c.fm.id || c.file.basename);
      if (id === own || seen.has(id)) continue;
      const terms = [c.fm.title, ...asArray(c.fm.aliases)].filter((t) => t && String(t).length > 4);
      for (const term of terms) {
        // Leading group instead of a lookbehind: WebKit only gained lookbehind in iOS 16.4.
        const re = new RegExp(`(^|[^\\w\\[|])(${String(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?![\\w\\]])`, 'i');
        const hit = re.exec(searchable);
        if (!hit) continue;
        const start = hit.index + hit[1].length;
        const from = Math.max(0, start - 45);
        candidates.push({
          id, title: c.fm.title || id, matched: body.substr(start, hit[2].length),
          index: start,
          context: body.slice(from, start + hit[2].length + 45).replace(/\n/g, ' ').trim(),
        });
        seen.add(id);
        break;
      }
    }
    if (!candidates.length) { this.notice('🦉', this.t('suggest_none')); return; }
    candidates.sort((a, b) => a.index - b.index);
    new SuggestLinksModal(this.app, this, file, head, body, candidates).open();
  }

  async applyLinks(file, head, chosen) {
    // The offsets came from a snapshot taken before the modal opened. Re-read inside the write so
    // anything typed in the editor meanwhile survives, and skip any match that has since moved.
    const ordered = [...chosen].sort((a, b) => b.index - a.index);
    let applied = 0;
    let skipped = 0;

    const rewrite = (data) => {
      if (!data.startsWith(head)) { skipped = ordered.length; return data; }
      let text = data.slice(head.length);
      for (const c of ordered) {
        const shown = text.substr(c.index, c.matched.length);
        if (shown.toLowerCase() !== c.matched.toLowerCase()) { skipped += 1; continue; }
        const link = shown.toLowerCase() === c.id.toLowerCase() ? `[[${shown}]]` : `[[${c.id}|${shown}]]`;
        text = text.slice(0, c.index) + link + text.slice(c.index + c.matched.length);
        applied += 1;
      }
      return head + text;
    };

    if (typeof this.app.vault.process === 'function') {
      await this.app.vault.process(file, rewrite);
    } else {
      const data = await this.app.vault.read(file);
      await this.app.vault.modify(file, rewrite(data));
    }
    this.notice('🔗', fill(this.t('suggest_done'), { n: applied })
      + (skipped ? ' ' + fill(this.t('suggest_skipped'), { n: skipped }) : ''));
  }

  async addZoteroLink() {
    const file = this.app.workspace.getActiveFile();
    if (!file) return;
    const fm = (this.app.metadataCache.getFileCache(file) || {}).frontmatter || {};
    if (fm.type !== 'source') { this.notice('🦉', this.t('zotero_notsource')); return; }
    if (fm.zotero) { this.notice('📚', this.t('zotero_has')); return; }
    const key = String(fm.citekey || '').trim();
    if (!key) { this.notice('📚', this.t('zotero_nokey')); return; }
    await this.app.fileManager.processFrontMatter(file, (front) => {
      front.zotero = `zotero://select/items/@${key}`;
    });
    this.notice('📚', this.t('zotero_added'));
  }

  /* ---------------------------------------------------------------- sprint timer */
  sprintLeft() {
    if (!this.data.sprintEnd) return 0;
    return Math.max(0, this.data.sprintEnd - Date.now());
  }

  formatLeft(ms) {
    const total = Math.round(ms / 1000);
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }

  async startSprint() {
    if (this.sprintLeft() > 0) {
      this.notice('⏳', fill(this.t('sprint_running'), { n: this.formatLeft(this.sprintLeft()) }));
      return;
    }
    const minutes = this.data.settings.sprintMinutes;
    this.data.sprintEnd = Date.now() + minutes * 60000;
    this.data.sprintLength = minutes;
    await this.save();
    this.notice('⏳', fill(this.t('sprint_start'), { n: minutes }));
    this.runTimer();
  }

  runTimer() {
    if (this.timer) window.clearInterval(this.timer);
    this.timer = window.setInterval(() => {
      if (this.sprintLeft() <= 0) {
        window.clearInterval(this.timer);
        this.timer = null;
        this.finishSprint();
      } else {
        this.refreshStatus();
      }
    }, 1000);
    this.registerInterval(this.timer);
  }

  async stopSprint() {
    if (this.sprintLeft() <= 0) { this.notice('🦉', this.t('sprint_none')); return; }
    const done = Math.round((this.data.sprintLength * 60000 - this.sprintLeft()) / 60000);
    this.data.sprintEnd = null;
    if (this.timer) { window.clearInterval(this.timer); this.timer = null; }
    await this.save();
    // No XP, no scolding: a deliberate stop is a decision, not a failure.
    this.notice('🦉', fill(this.t('sprint_stopped'), { n: done }));
  }

  async finishSprint() {
    const minutes = this.data.sprintLength;
    this.data.sprintEnd = null;
    this.today().sprint += 1;
    await this.touchStreak();
    await this.award(XP.sprint_complete, fill(this.t('sprint_done'), { n: minutes }));
    await this.grantBadge('first-sprint');
    if (this.today().sprint >= 3) await this.grantBadge('three-sprints');
    await this.maybeCompleteQuest();
    await this.save();
    if (this.data.settings.celebrate) new SprintDoneModal(this.app, this, minutes).open();
  }

  /* ---------------------------------------------------------------- actions */
  async rateCurrent() {
    const file = this.app.workspace.getActiveFile();
    if (!file) return;
    const fm = (this.app.metadataCache.getFileCache(file) || {}).frontmatter || {};
    if (fm.type !== 'concept') {
      this.notice('🦉', this.t('not_concept'));
      return;
    }
    new RateModal(this.app, this, file, fm).open();
  }

  async applyRating(file, value) {
    const before = (this.app.metadataCache.getFileCache(file) || {}).frontmatter || {};
    const previous = typeof before.confidence === 'number' ? before.confidence : 0;
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

    let amount = XP.rate;
    let headline = this.t('rated');
    if (lowered) { amount = XP.honest_downgrade; headline = this.t('downgrade'); }
    else if (rerate) { amount = XP.rerate; headline = this.t('rated') + (value >= 4 ? this.t('rated_high') : this.t('rated_low')); }
    else { headline = this.t('rated') + (value >= 4 ? this.t('rated_high') : this.t('rated_low')); }

    const dependents = this.dependentCounts(this.concepts());
    const load = dependents[(before.id || file.basename).toLowerCase()] || 0;

    await this.award(amount, headline);
    await this.checkBadges({ lowered, load });
    await this.maybeCompleteQuest();
    await this.save();
  }

  async onNoteChanged(file) {
    const fm = (this.app.metadataCache.getFileCache(file) || {}).frontmatter || {};
    if (fm.type === 'source' && String(fm.status || '').toLowerCase() === 'confirmed') {
      if (!this.data.countedSources.includes(file.path)) {
        this.data.countedSources.push(file.path);
        this.today().source += 1;
        await this.touchStreak();
        await this.award(XP.confirm_source, this.data.settings.language === 'sv'
          ? 'Källa bekräftad. Ett påstående mindre som vilar på gissning.'
          : 'Source confirmed. One less claim resting on a guess.');
        await this.grantBadge('source-hunter');
        await this.maybeCompleteQuest();
      }
    }
    this.refreshStatus();
  }

  /* ---------------------------------------------------------------- chrome */
  notice(icon, text) {
    const frag = document.createDocumentFragment();
    const wrap = frag.createDiv({ cls: 'sf-notice' });
    wrap.createSpan({ cls: 'sf-notice-icon', text: icon });
    wrap.createSpan({ cls: 'sf-notice-text', text });
    new Notice(frag, 6000);
  }

  refreshStatus() {
    if (!this.status) return;
    if (!this.data.settings.showStatusBar) { this.status.setText(''); return; }
    const lvl = this.level();
    const progress = this.questProgress();
    const done = progress.filter((p) => p.complete).length;
    const left = this.sprintLeft();
    if (left > 0) {
      this.status.setText(`⏳ ${this.formatLeft(left)} · 🦉 ${lvl.name}`);
      return;
    }
    const streak = this.data.streak ? ` · 🔥${this.data.streak}` : '';
    const quest = progress.length ? ` · 🎯${done}/${progress.length}` : '';
    this.status.setText(`🦉 ${lvl.name} · ${this.data.xp} XP${streak}${quest}`);
  }
}

/* ------------------------------------------------------------------ modals */
class DashboardModal extends Modal {
  constructor(app, plugin, focus) {
    super(app);
    this.plugin = plugin;
    this.focus = focus;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.addClass('sf-modal');
    const p = this.plugin;
    const lvl = p.level();

    const head = contentEl.createDiv({ cls: 'sf-head' });
    head.createSpan({ cls: 'sf-owl', text: '🦉' });
    const headText = head.createDiv();
    headText.createDiv({ cls: 'sf-level', text: `${lvl.name}` });
    const need = lvl.nextAt ? `${lvl.nextAt - p.data.xp} XP` : p.t('maxed');
    headText.createDiv({ cls: 'sf-sub', text: fill(p.t('xp_bar'), { xp: p.data.xp, need, name: lvl.nextName || '' }) });

    const bar = contentEl.createDiv({ cls: 'sf-bar' });
    const span = lvl.nextAt ? (p.data.xp - lvl.at) / (lvl.nextAt - lvl.at) : 1;
    bar.createDiv({ cls: 'sf-bar-fill' }).style.width = `${Math.max(4, Math.min(100, span * 100))}%`;

    if (p.data.streak) {
      contentEl.createDiv({ cls: 'sf-streak', text: `🔥 ${fill(p.t('streak_day'), { n: p.data.streak })}` });
    }

    // sprint
    const sprintRow = contentEl.createDiv({ cls: 'sf-sprint' });
    const left = p.sprintLeft();
    if (left > 0) {
      sprintRow.createSpan({ cls: 'sf-sprint-clock', text: `⏳ ${p.formatLeft(left)}` });
      const stop = sprintRow.createEl('button', { text: p.t('sprint_later') });
      stop.onclick = async () => { await p.stopSprint(); this.close(); };
    } else {
      const start = sprintRow.createEl('button', { cls: 'mod-cta',
        text: `⏳ ${p.t('sprint_title')} · ${p.data.settings.sprintMinutes} min` });
      start.onclick = async () => { this.close(); await p.startSprint(); };
    }

    // quest
    const quest = p.questProgress();
    if (quest.length) {
      contentEl.createEl('h3', { text: p.t('quest_title') });
      const list = contentEl.createDiv({ cls: 'sf-quest' });
      for (const task of quest) {
        const row = list.createDiv({ cls: 'sf-quest-row' + (task.complete ? ' sf-done' : '') });
        row.createSpan({ cls: 'sf-check', text: task.complete ? '✓' : '○' });
        row.createSpan({ text: task.label });
        row.createSpan({ cls: 'sf-count', text: `${task.done}/${task.n}` });
      }
    }

    // study next
    contentEl.createEl('h3', { text: p.t('study_next') });
    const candidates = p.candidates(6);
    if (!candidates.length) {
      contentEl.createDiv({ cls: 'sf-sub', text: p.t('no_concepts') });
    }
    for (const c of candidates) {
      const card = contentEl.createDiv({ cls: 'sf-card' });
      const left = card.createDiv();
      left.createDiv({ cls: 'sf-card-title', text: c.fm.title || c.file.basename });
      left.createDiv({ cls: 'sf-sub', text: c.reasons.join(' · ') });
      const actions = card.createDiv({ cls: 'sf-actions' });
      const open = actions.createEl('button', { text: p.t('open') });
      open.onclick = () => { this.close(); this.app.workspace.getLeaf(false).openFile(c.file); };
      const rate = actions.createEl('button', { cls: 'mod-cta', text: p.t('rate') });
      rate.onclick = () => { this.close(); new RateModal(this.app, p, c.file, c.fm).open(); };
    }

    // badges strip
    contentEl.createEl('h3', { text: p.t('badges') });
    const strip = contentEl.createDiv({ cls: 'sf-badges' });
    if (!p.data.badges.length) {
      strip.createDiv({ cls: 'sf-sub', text: p.t('no_badges') });
    }
    const lang = p.data.settings.language === 'sv' ? 'sv' : 'en';
    for (const id of p.data.badges) {
      const badge = BADGES.find((b) => b.id === id);
      if (!badge) continue;
      const el = strip.createDiv({ cls: 'sf-badge' });
      el.createSpan({ text: badge.icon });
      el.createSpan({ text: badge[lang] });
      el.setAttribute('aria-label', badge[`${lang}_desc`]);
    }
  }

  onClose() { this.contentEl.empty(); }
}

class RateModal extends Modal {
  constructor(app, plugin, file, fm) {
    super(app);
    this.plugin = plugin;
    this.file = file;
    this.fm = fm || {};
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.addClass('sf-modal');
    const p = this.plugin;
    const lang = p.data.settings.language === 'sv' ? 'sv' : 'en';

    contentEl.createEl('h2', { text: this.fm.title || this.file.basename });
    contentEl.createDiv({ cls: 'sf-rate-title', text: p.t('rate_title') });
    contentEl.createDiv({ cls: 'sf-sub', text: p.t('rate_sub') });

    const scale = T[lang].scale;
    const wrap = contentEl.createDiv({ cls: 'sf-scale' });
    for (let value = 1; value <= 5; value++) {
      const btn = wrap.createEl('button', { cls: 'sf-scale-btn' });
      btn.createSpan({ cls: 'sf-scale-n', text: String(value) });
      btn.createSpan({ cls: 'sf-scale-label', text: scale[value - 1] });
      if (this.fm.confidence === value) btn.addClass('sf-current');
      btn.onclick = async () => {
        this.close();
        await p.applyRating(this.file, value);
      };
    }
  }

  onClose() { this.contentEl.empty(); }
}

class LevelModal extends Modal {
  constructor(app, plugin, level) { super(app); this.plugin = plugin; this.level = level; }
  onOpen() {
    const { contentEl } = this;
    contentEl.addClass('sf-modal', 'sf-celebrate');
    contentEl.createDiv({ cls: 'sf-big', text: '🦉' });
    contentEl.createEl('h2', { text: fill(this.plugin.t('level_up'), { n: this.level.n, name: this.level.name }) });
    contentEl.createDiv({
      cls: 'sf-sub',
      text: this.plugin.data.settings.language === 'sv'
        ? 'Nivån mäter arbetet du lagt in, inte vad du kan. Det andra testas på fredag.'
        : 'The level measures work put in, not what you know. That gets tested on Friday.',
    });
  }
  onClose() { this.contentEl.empty(); }
}

class SuggestLinksModal extends Modal {
  constructor(app, plugin, file, head, body, candidates) {
    super(app);
    this.plugin = plugin; this.file = file; this.head = head; this.body = body;
    this.candidates = candidates;
    this.chosen = new Set(candidates.map((c) => c.id));
  }

  onOpen() {
    const { contentEl } = this;
    const p = this.plugin;
    contentEl.addClass('sf-modal');
    contentEl.createEl('h2', { text: p.t('suggest_title') });
    contentEl.createDiv({ cls: 'sf-sub', text: p.t('suggest_sub') });

    for (const c of this.candidates) {
      const row = contentEl.createDiv({ cls: 'sf-suggest-row' });
      const box = row.createEl('input', { type: 'checkbox' });
      box.checked = true;
      box.onchange = () => { box.checked ? this.chosen.add(c.id) : this.chosen.delete(c.id); };
      const text = row.createDiv();
      text.createDiv({ cls: 'sf-card-title', text: `${c.title}  ·  "${c.matched}"` });
      text.createDiv({ cls: 'sf-sub', text: `…${c.context}…` });
    }

    const actions = contentEl.createDiv({ cls: 'sf-actions sf-center' });
    const apply = actions.createEl('button', { cls: 'mod-cta', text: p.t('suggest_apply') });
    apply.onclick = async () => {
      const chosen = this.candidates.filter((c) => this.chosen.has(c.id));
      this.close();
      if (chosen.length) await p.applyLinks(this.file, this.head, chosen);
    };
    const cancel = actions.createEl('button', { text: p.t('sprint_later') });
    cancel.onclick = () => this.close();
  }

  onClose() { this.contentEl.empty(); }
}

class SprintDoneModal extends Modal {
  constructor(app, plugin, minutes) { super(app); this.plugin = plugin; this.minutes = minutes; }
  onOpen() {
    const { contentEl } = this;
    const p = this.plugin;
    contentEl.addClass('sf-modal', 'sf-celebrate');
    contentEl.createDiv({ cls: 'sf-big', text: '⏳' });
    contentEl.createEl('h2', { text: fill(p.t('sprint_done'), { n: this.minutes }) });
    // The sprint ends with retrieval, not with a bell — the last two minutes are the valuable ones.
    contentEl.createDiv({ cls: 'sf-recall', text: p.t('sprint_recall') });
    contentEl.createDiv({ cls: 'sf-sub', text: fill(p.t('sprint_break'), { n: p.data.settings.breakMinutes }) });
    const row = contentEl.createDiv({ cls: 'sf-actions sf-center' });
    const rate = row.createEl('button', { cls: 'mod-cta', text: p.t('sprint_rate_now') });
    rate.onclick = () => {
      this.close();
      const top = p.candidates(1)[0];
      if (top) new RateModal(this.app, p, top.file, top.fm).open();
      else new DashboardModal(this.app, p).open();
    };
    const later = row.createEl('button', { text: p.t('sprint_later') });
    later.onclick = () => this.close();
  }
  onClose() { this.contentEl.empty(); }
}

class BadgeEarnedModal extends Modal {
  constructor(app, plugin, badge) { super(app); this.plugin = plugin; this.badge = badge; }
  onOpen() {
    const { contentEl } = this;
    const lang = this.plugin.data.settings.language === 'sv' ? 'sv' : 'en';
    contentEl.addClass('sf-modal', 'sf-celebrate');
    contentEl.createDiv({ cls: 'sf-big', text: this.badge.icon });
    contentEl.createEl('h2', { text: this.badge[lang] });
    contentEl.createDiv({ cls: 'sf-sub', text: this.badge[`${lang}_desc`] });
  }
  onClose() { this.contentEl.empty(); }
}

class BadgeModal extends Modal {
  constructor(app, plugin) { super(app); this.plugin = plugin; }
  onOpen() {
    const { contentEl } = this;
    const p = this.plugin;
    const lang = p.data.settings.language === 'sv' ? 'sv' : 'en';
    contentEl.addClass('sf-modal');
    contentEl.createEl('h2', { text: p.t('badges') });
    for (const badge of BADGES) {
      const owned = p.data.badges.includes(badge.id);
      const row = contentEl.createDiv({ cls: 'sf-badge-row' + (owned ? '' : ' sf-locked') });
      row.createSpan({ cls: 'sf-badge-icon', text: owned ? badge.icon : '·' });
      const text = row.createDiv();
      text.createDiv({ cls: 'sf-card-title', text: badge[lang] });
      text.createDiv({ cls: 'sf-sub', text: badge[`${lang}_desc`] });
    }
  }
  onClose() { this.contentEl.empty(); }
}

/* ------------------------------------------------------------------ settings */
class StudyFamiliarSettings extends PluginSettingTab {
  constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    const s = this.plugin.data.settings;

    new Setting(containerEl)
      .setName('Language')
      .setDesc('Interface language for the familiar. Swedish for exam-language study, English otherwise.')
      .addDropdown((d) => d
        .addOption('en', 'English')
        .addOption('sv', 'Svenska')
        .setValue(s.language)
        .onChange(async (v) => { s.language = v; await this.plugin.save(); }));

    new Setting(containerEl)
      .setName('Daily goal')
      .setDesc('How many concepts a daily quest asks for. Small is the point — a goal you hit on a bad day beats one you abandon.')
      .addSlider((sl) => sl
        .setLimits(1, 8, 1)
        .setValue(s.dailyGoal)
        .setDynamicTooltip()
        .onChange(async (v) => { s.dailyGoal = v; this.plugin.data.questDate = null; await this.plugin.save(); }));

    new Setting(containerEl)
      .setName('Sprint length')
      .setDesc('Minutes of focused work per sprint. Twenty-five is the usual starting point; shorter is better than abandoned.')
      .addSlider((sl) => sl.setLimits(10, 50, 5).setValue(s.sprintMinutes).setDynamicTooltip()
        .onChange(async (v) => { s.sprintMinutes = v; await this.plugin.save(); }));

    new Setting(containerEl)
      .setName('Break length')
      .setDesc('Suggested break after a sprint. Away from the screen — the consolidation happens while not studying.')
      .addSlider((sl) => sl.setLimits(3, 15, 1).setValue(s.breakMinutes).setDynamicTooltip()
        .onChange(async (v) => { s.breakMinutes = v; await this.plugin.save(); }));

    new Setting(containerEl)
      .setName('Status bar')
      .addToggle((t) => t.setValue(s.showStatusBar)
        .onChange(async (v) => { s.showStatusBar = v; await this.plugin.save(); }));

    new Setting(containerEl)
      .setName('Celebrations')
      .setDesc('Pop up a card for a new level or feather. Turn off during exam week if it breaks concentration.')
      .addToggle((t) => t.setValue(s.celebrate)
        .onChange(async (v) => { s.celebrate = v; await this.plugin.save(); }));

    containerEl.createEl('h3', { text: 'How scoring works' });
    const note = containerEl.createEl('p', { cls: 'sf-sub' });
    note.setText(
      'XP is paid for the act of studying, never for the rating you give. Rating a concept 2 pays '
      + 'the same as rating it 5, and lowering a rating pays more than raising one. Nothing here '
      + 'claims you know anything — levels measure work done, and the vault checks understanding '
      + 'separately through explaining and drilling.'
    );

    new Setting(containerEl)
      .setName('Reset progress')
      .setDesc('Clears XP, streak and feathers. Your notes and ratings are untouched.')
      .addButton((b) => b.setWarning().setButtonText('Reset').onClick(async () => {
        const keep = this.plugin.data.settings;
        this.plugin.data = Object.assign({}, DEFAULT_DATA, { settings: keep });
        await this.plugin.save();
        this.display();
      }));
  }
}

module.exports = StudyFamiliar;
