import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Keys that must survive a logout.
 *
 * 'onboardingSeen' — the first-run intro must show exactly once per install.
 * Logout used to call AsyncStorage.clear(), which wipes EVERYTHING; with the
 * intro gated on a stored flag, a raw clear() would replay the intro after
 * every sign-out. All three logout paths (AuthContext.handleLogout, the
 * axiosClient forceLogout, and settingsPage's delete-account flow) now call
 * clearStorageForLogout() instead.
 *
 * Add to this list deliberately — anything here persists across accounts on a
 * shared device, so it must never contain user data.
 */
// lastLoginMobile: the phone-first screen prefills the number after a logout (2026-10-16).
const SURVIVES_LOGOUT = ['onboardingSeen', 'lastLoginMobile'];

export async function clearStorageForLogout(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const doomed = keys.filter((k) => !SURVIVES_LOGOUT.includes(k));
    if (doomed.length) await AsyncStorage.multiRemove(doomed);
  } catch (_) {
    // Fall back to a full wipe rather than leaving a half-logged-out session:
    // losing the onboarding flag (intro replays once) is the lesser failure.
    try {
      await AsyncStorage.clear();
    } catch (__) {}
  }
}
