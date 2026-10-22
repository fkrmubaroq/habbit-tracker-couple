import * as React from "react";
import api from "../lib/api-client";
import { useAuthStore } from "../stores/auth.store";

export function useSession() {
  const { isAuthenticated, isLoading, setUser, clearSession, setLoading } = useAuthStore();
  const hasChecked = React.useRef(false);

  React.useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    setLoading(true);
    api
      .get("/auth/me")
      .then((response) => setUser(response.data.user))
      .catch(() => clearSession())
      .finally(() => setLoading(false));
  }, [setUser, clearSession, setLoading]);

  return { isAuthenticated, isLoading };
}
