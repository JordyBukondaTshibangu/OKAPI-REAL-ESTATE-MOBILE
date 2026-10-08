/**
 * useNetworkStatus — subscribes to network connectivity changes.
 *
 * Returns `{ isConnected, isInternetReachable }`.
 * Both start as `true` (optimistic) until NetInfo reports otherwise,
 * so users on a fast connection never see a flash of the offline screen.
 *
 * Requires: npx expo install @react-native-community/netinfo
 */

import { useEffect, useState } from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);

  useEffect(() => {
    // Fetch current state immediately
    NetInfo.fetch().then((state: NetInfoState) => {
      setIsConnected(state.isConnected ?? true);
      setIsInternetReachable(state.isInternetReachable ?? true);
    });

    // Subscribe to changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected ?? true);
      setIsInternetReachable(state.isInternetReachable ?? true);
    });

    return unsubscribe;
  }, []);

  return { isConnected, isInternetReachable };
}
