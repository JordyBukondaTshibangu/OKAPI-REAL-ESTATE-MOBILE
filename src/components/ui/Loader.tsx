import React, { useRef, useEffect } from "react";
import { Animated, View } from "react-native";
import { useThemeStore } from "../../store/useThemeStore";

// ── Single pulsing placeholder block ────────────────────────────────────────
function SkeletonBox({
  width,
  height,
  borderRadius = 8,
  style,
}: {
  width?: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: width ?? "100%",
          height,
          borderRadius,
          backgroundColor: isDark ? "#1e2f45" : "#e2e8f0",
          opacity,
        },
        style,
      ]}
    />
  );
}

// ── One skeleton card that mimics a PropertyCard ─────────────────────────────
function SkeletonCard({ delay }: { delay: number }) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const cardBg = isDark ? "#141f30" : "#ffffff";
  const translateY = useRef(new Animated.Value(12)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        backgroundColor: cardBg,
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 12,
        opacity: cardOpacity,
        transform: [{ translateY }],
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
      }}
    >
      {/* Photo placeholder */}
      <SkeletonBox height={180} borderRadius={0} />

      {/* Text placeholders */}
      <View style={{ padding: 14, gap: 10 }}>
        <SkeletonBox height={14} width="40%" />
        <SkeletonBox height={22} width="65%" />
        <SkeletonBox height={13} width="55%" />
        <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
          <SkeletonBox height={12} width={50} />
          <SkeletonBox height={12} width={50} />
          <SkeletonBox height={12} width={50} />
        </View>
      </View>
    </Animated.View>
  );
}

// ── Default export: 3 staggered skeleton cards ───────────────────────────────
export default function Loader({ count = 3 }: { count?: number }) {
  return (
    <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} delay={i * 80} />
      ))}
    </View>
  );
}
