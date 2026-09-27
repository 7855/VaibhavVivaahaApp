/**
 * A one-function bridge so NON-React code can ask for a plan refresh.
 *
 * The real refresh lives in SubscriptionProvider (it needs React state). But three callers
 * are not components and cannot use a hook: the axios response interceptor, the push
 * notification handler, and plain helper modules. They call requestSubscriptionRefresh();
 * the provider registers the actual function on mount.
 *
 * ⚠️ This file must import NOTHING from the app. subscriptionContext imports userApi, which
 * imports axiosClient — so axiosClient importing the context would be a cycle. Routing
 * through an import-free module is what breaks it.
 */
type RefreshFn = (reason?: string, force?: boolean) => Promise<any>;

let handler: RefreshFn | null = null;

export const setSubscriptionRefreshHandler = (fn: RefreshFn | null) => {
  handler = fn;
};

/** Safe to call from anywhere, any time — a no-op until the provider has mounted. */
export const requestSubscriptionRefresh = (reason?: string, force = false): Promise<any> => {
  if (!handler) return Promise.resolve(null);
  try {
    return handler(reason, force);
  } catch {
    return Promise.resolve(null);
  }
};

export default {};
