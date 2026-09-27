// ─────────────────────────────────────────────────────────────
//  profileRefresh.ts — one-shot "the profile changed" signal.
//
//  The profile tab throttles its refetch (CACHE_MS) so switching tabs doesn't
//  hammer the API. That throttle also swallowed genuine edits: saving a section
//  on another screen and coming straight back re-rendered the STALE cached
//  profile (and a stale completion %). A module-level flag is enough — both
//  sides live in the same JS runtime — and it self-clears on read so a single
//  edit can't force refetches forever.
// ─────────────────────────────────────────────────────────────
let dirty = false;

/** Call after any successful write that changes profile content. */
export function markProfileDirty(): void {
  dirty = true;
}

/** Returns true ONCE per markProfileDirty(); clears the flag. */
export function consumeProfileDirty(): boolean {
  if (!dirty) return false;
  dirty = false;
  return true;
}

// ── Profile-tab focus request ──────────────────────────────
//  "Open the profile tab and go to <photo | horoscope | interests>". Same
//  one-shot shape as the dirty flag, and for the same reason: a route param
//  proved unreliable here — re-pushing the already-mounted profile tab with new
//  params did not re-fire its effect, so the SECOND "Add Horoscope" tap from
//  Home did nothing. The tab consumes this on every focus instead.
export type ProfileFocus = 'photo' | 'horoscope' | 'interests';
let pendingFocus: ProfileFocus | null = null;

export function requestProfileFocus(kind: ProfileFocus): void {
  pendingFocus = kind;
}

/** Returns the pending focus ONCE; clears it. */
export function consumeProfileFocus(): ProfileFocus | null {
  const f = pendingFocus;
  pendingFocus = null;
  return f;
}
