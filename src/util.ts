/** Local calendar date, not UTC — a sprint finished at 23:30 belongs to that day, not the next. */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

/** `[[a/b|Label]]` -> `b`; bare text -> text. Lower-cased, because ids are. */
export function linkTarget(value: unknown): string {
  const m = String(value).match(/\[\[([^\]|#]+)/);
  const inner = m ? m[1] : String(value);
  return (inner.split("/").pop() ?? "").trim().toLowerCase();
}

export function asArray(value: unknown): unknown[] {
  if (value === undefined || value === null || value === "") return [];
  return Array.isArray(value) ? value : [value];
}

export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function formatClock(ms: number): string {
  const total = Math.round(ms / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
