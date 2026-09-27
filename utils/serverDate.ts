/**
 * Parse a date string the backend sends.
 *
 * ⚠ The API's timestamps are UTC but carry NO zone marker (`2026-09-27 02:30:04.553`), and
 * JavaScript reads an unmarked string as LOCAL time — so on an Indian phone a UTC instant
 * lands 5h30m early. A notification created at 08:00 IST arrived as `02:30:04` and showed
 * "5h ago" at five past eight. Live socket events DO carry a zone (`…Z`), so the marker is
 * only added when there is none — the same rule the chat list and chat screen apply inline.
 *
 * The space separator is also non-standard (`Date` wants `T`); Hermes is stricter than V8
 * about it, so it is normalised too. Unparseable input yields null rather than an Invalid
 * Date that formats as "NaNh ago".
 */
export function parseServerDate(raw?: string | number | Date | null): Date | null {
  if (raw == null || raw === '') return null;
  if (raw instanceof Date) return Number.isNaN(raw.getTime()) ? null : raw;
  if (typeof raw === 'number') return new Date(raw);
  const s = String(raw).trim();
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(s);
  const d = new Date(hasZone ? s.replace(' ', 'T') : s.replace(' ', 'T') + 'Z');
  return Number.isNaN(d.getTime()) ? null : d;
}
