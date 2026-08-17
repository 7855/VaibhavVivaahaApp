// ─────────────────────────────────────────────────────────────
//  useRemoteContent — DB-backed copy for static content screens
//  (FAQ, Terms, Help) with cache + hardcoded fallback.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import userApi from '../app/(root)/api/userApi';

const CACHE_PREFIX = 'remoteContent_';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6h — this copy changes rarely

/**
 * Load editable content from the `keyValue` table, falling back to the bundled copy.
 *
 * Deliberately built on keyValue rather than a new `content` table with its own CRUD:
 *  - the generic `GET /keyValue/getKeyValueByKey/{key}` endpoint already exists, so this needs
 *    **no backend code and no deploy** — just a seeded row;
 *  - the admin panel's Configuration page already edits keyValue rows, so there is no new admin
 *    screen to build either;
 *  - it matches how PAYMENT_MODE / QUICK_ACCESS_MENU / promotionalPopupBanner already work.
 *
 * The bundled `fallback` is returned immediately on first paint and kept if the fetch fails, so
 * these screens can never render empty — a legal/help page going blank because the network
 * hiccuped would be worse than showing slightly stale copy.
 *
 * @param key      keyValue.keyColumn, e.g. 'FAQ_CONTENT'
 * @param fallback the hardcoded content shipped in the bundle
 */
export function useRemoteContent<T>(key: string, fallback: T): { content: T; loading: boolean } {
  const [content, setContent] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const cacheKey = CACHE_PREFIX + key;

    (async () => {
      // Optimistic: paint cached copy before the network resolves.
      try {
        const cachedRaw = await AsyncStorage.getItem(cacheKey);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (cached?.expiresAt > Date.now() && cached?.value != null) {
            if (mounted) setContent(cached.value as T);
          }
        }
      } catch {
        // corrupt cache — the fallback is already in state
      }

      try {
        const res = await userApi.getKeyValueByKey(key);
        const raw = res?.data?.data?.valueColumn;
        if (!raw) return;

        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        // Only accept content that actually has something in it. An empty array or {} would
        // otherwise blank the screen out, which is strictly worse than the bundled copy.
        const isUsable = Array.isArray(parsed) ? parsed.length > 0 : !!parsed;
        if (!isUsable) return;

        if (mounted) setContent(parsed as T);
        await AsyncStorage.setItem(
          cacheKey,
          JSON.stringify({ value: parsed, expiresAt: Date.now() + CACHE_TTL })
        );
      } catch {
        // network/parse failure — keep whatever is showing (cache or bundled fallback)
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [key]);

  return { content, loading };
}
