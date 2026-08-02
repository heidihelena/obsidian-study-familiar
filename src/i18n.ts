import type { Lang } from "./types";

/* Extracted verbatim from the 0.1.0 JavaScript build — the copy is the product here, so the port
   moved the strings without rewriting a single one. */

export const SCALE: Record<Lang, string[]> = {
  en: ['Never seen it work', 'Recognise it, cannot rebuild it', 'Can explain the gist',
            'Can explain it and the boundaries', 'Could teach it to someone else'],
  sv: ['Aldrig sett det fungera', 'Känner igen det, kan inte bygga upp det',
            'Kan förklara huvuddragen', 'Kan förklara det och gränserna',
            'Skulle kunna lära ut det'],
};

const TABLE: Record<Lang, Record<string, string>> = {
  en: {
    rate_title: 'How well can you explain this — without notes?',
    rate_sub: 'Your call, not the owl\'s. This number only helps if it is honest.',
    rated: 'Rated. ',
    rated_high: 'Noted — we will test that rather than take your word for it.',
    rated_low: 'Good. A low honest number is worth more than a high hopeful one.',
    downgrade: 'Honest downgrade. That is the rating that actually helps you.',
    streak_day: 'Day {n} in a row.',
    welcome_back: 'Welcome back. Streak restarts today — nothing is lost that matters.',
    level_up: 'Level {n} — {name}',
    quest_title: 'Today\'s quest',
    quest_done: 'Quest complete. That is the whole day\'s obligation done.',
    no_concepts: 'No concept notes found. Check the concepts folder in settings, and that your notes carry `type: concept`.',
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
    rated: 'Betygsatt. ',
    rated_high: 'Noterat — vi testar det hellre än tar ditt ord på det.',
    rated_low: 'Bra. En låg ärlig siffra är värd mer än en hög förhoppningsfull.',
    downgrade: 'Ärlig sänkning. Det är den siffran som faktiskt hjälper dig.',
    streak_day: 'Dag {n} i rad.',
    welcome_back: 'Välkommen tillbaka. Sviten börjar om idag — inget viktigt är förlorat.',
    level_up: 'Nivå {n} — {name}',
    quest_title: 'Dagens uppdrag',
    quest_done: 'Uppdraget klart. Där är hela dagens plikt avklarad.',
    no_concepts: 'Hittade inga begreppsnoter. Kolla mappen i inställningarna, och att noterna har `type: concept`.',
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

export function strings(lang: Lang): Record<string, string> {
  return TABLE[lang] ?? TABLE.en;
}

export function translate(lang: Lang, key: string): string {
  const table = strings(lang);
  return table[key] !== undefined ? table[key] : (TABLE.en[key] ?? key);
}

/** `fill("Day {n}", { n: 3 })` -> "Day 3". Unknown keys are left visible on purpose. */
export function fill(str: string, vars: Record<string, string | number>): string {
  return str.replace(/\{(\w+)\}/g, (_, k: string) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));
}
