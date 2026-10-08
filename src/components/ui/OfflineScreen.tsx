import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WifiOff, RefreshCw } from "lucide-react-native";
import { Colors } from "../../constants/colors";
import NetInfo from "@react-native-community/netinfo";

/**
 * OfflineScreen — full-screen overlay shown when there is no internet connection.
 * Sits above everything in the root layout so it catches all screens.
 *
 * The "Réessayer" button re-checks connectivity immediately.
 */
export default function OfflineScreen() {
  const insets = useSafeAreaInsets();
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  function retry() {
    NetInfo.fetch().then(() => {
      // NetInfo will propagate the new state through the listener in useNetworkStatus
    });
  }

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFillObject,
        styles.container,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24, opacity: fadeAnim },
      ]}
    >
      <Animated.View style={[styles.content, { transform: [{ translateY: slideAnim }] }]}>
        {/* Icon */}
        <View style={styles.iconWrap}>
          <WifiOff size={40} color={Colors.primary} strokeWidth={1.5} />
        </View>

        {/* Text */}
        <Text style={styles.title}>Pas de connexion</Text>
        <Text style={styles.subtitle}>
          Vérifiez votre connexion Wi-Fi ou données mobiles et réessayez.
        </Text>

        {/* Retry button */}
        <TouchableOpacity style={styles.retryBtn} onPress={retry} activeOpacity={0.8}>
          <RefreshCw size={16} color="#fff" strokeWidth={2} style={{ marginRight: 8 }} />
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 4 },
    }),
  },
  title: {
    fontSize: 22,
    fontFamily: "DMSans_700Bold",
    color: Colors.foreground,
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    color: Colors.mutedFg,
    textAlign: "center",
    lineHeight: 23,
    marginBottom: 36,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.navy,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  retryText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "DMSans_600SemiBold",
  },
});
