import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { getMe } from "../services/auth.service";
import { redirectToLogin } from "../services/session-url";

export function useSession() {
  const query = useQuery({
    queryKey: ["session"],
    queryFn: getMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  React.useEffect(() => {
    if (query.isError) {
      redirectToLogin();
    }
  }, [query.isError]);

  return query;
}
