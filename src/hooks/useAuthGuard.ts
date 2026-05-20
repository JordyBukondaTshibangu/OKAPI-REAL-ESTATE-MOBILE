import { useEffect } from "react";
import { router } from "expo-router";
import { useAuthStore } from "../store/useAuthStore";

export function useAuthGuard() {
  const { isAuthenticated } = useAuthStore();
  useEffect(() => {
    if (!isAuthenticated) router.replace("/(auth)/connexion");
  }, [isAuthenticated]);
  return isAuthenticated;
}
