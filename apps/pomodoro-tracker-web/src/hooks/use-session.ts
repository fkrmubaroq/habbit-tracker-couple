import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { getMe, type SessionUser } from "../services/auth.service";
import { DEVICE_STATE_KEYS, readJson, writeJson } from "../services/device-state";
import { redirectToLogin } from "../services/session-url";

/**
 * Last successfully verified session, kept on this device.
 *
 * The app shell is cached by the service worker, so it can boot with no network.
 * Without this cache the `/auth/me` request would fail, the root route would
 * have no user, and an offline user would be bounced to a login page that is
 * equally unreachable — losing a running timer. Only a real 401 logs you out.
 *
 * This is the one device key that is *not* owner-stamped: it is the identity the
 * app boots from when there is no server answer to derive an id from, so
 * requiring an id to read it would be circular. Logout clears it instead.
 */
const CACHE_KEY = DEVICE_STATE_KEYS.sessionCache;

function readCachedUser(): SessionUser | null {
  const parsed = readJson(CACHE_KEY) as SessionUser | null;
  return parsed && typeof parsed.id === "string" ? parsed : null;
}

function writeCachedUser(user: SessionUser): void {
  writeJson(CACHE_KEY, user);
}

export function useSession() {
  const query = useQuery({
    queryKey: ["session"],
    queryFn: getMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const [cachedUser, setCachedUser] = React.useState<SessionUser | null>(() => readCachedUser());

  React.useEffect(() => {
    if (!query.data) return;
    writeCachedUser(query.data);
    setCachedUser(query.data);
  }, [query.data]);

  React.useEffect(() => {
    if (!query.isError) return;
    const status = (query.error as (Error & { status?: number }) | null)?.status;
    // 401 is the only answer that means "your session is gone". A network
    // failure must not log anyone out.
    if (status === 401) {
      redirectToLogin();
    }
  }, [query.isError, query.error]);

  const data = query.data ?? (query.isError ? cachedUser ?? undefined : undefined);

  return { ...query, data };
}
