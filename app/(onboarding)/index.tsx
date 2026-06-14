import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  Easing,
  runOnJS,
  interpolate,
} from "react-native-reanimated";
import Svg, {
  Polygon, Rect, Ellipse, Line, Circle, Path,
} from "react-native-svg";
import { Colors } from "../../src/constants/colors";

const { width, height } = Dimensions.get("window");

const NAVY  = Colors.navy;         // #0B1D3A
const GOLD  = Colors.secondary;    // #D4AF37
const BLUE  = Colors.primary;      // #1E63B5

// ─── Brand house SVG icon ────────────────────────────────────────────────
function HouseIcon({ size = 120 }: { size?: number }) {
  const s = size;
  // All coordinates as fraction of 100 → scaled
  const sc = (v: number) => (v / 100) * s;

  // Roof apex and base
  const apexX = sc(50); const apexY = sc(12);
  const baseL = sc(16); const baseR = sc(84); const baseY = sc(42);

  // Body
  const bodyT = sc(42); const bodyB = sc(78);
  const bodyL = sc(20); const bodyR = sc(80);

  // Door
  const dw = sc(14); const dh = sc(22);
  const dl = sc(43); const dt = bodyB - dh;

  // Windows
  const ws = sc(12); const wt = bodyT + sc(8);
  const w1l = bodyL + sc(7);
  const w2l = bodyR - sc(7) - ws;

  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      {/* Outer ring */}
      <Circle
        cx={sc(50)} cy={sc(46)} r={sc(44)}
        stroke={GOLD} strokeWidth={sc(2.4)} fill="none"
      />

      {/* Filled roof triangle */}
      <Polygon
        points={`${apexX},${apexY} ${baseL},${baseY} ${baseR},${baseY}`}
        fill={GOLD}
      />
      {/* Inner dark cutout to create overhang effect */}
      <Polygon
        points={`${sc(50)},${sc(17)} ${sc(19)},${baseY - sc(2)} ${sc(81)},${baseY - sc(2)}`}
        fill={NAVY}
      />

      {/* House body */}
      <Rect x={bodyL} y={bodyT} width={bodyR - bodyL} height={bodyB - bodyT} fill={GOLD} />

      {/* Door cutout */}
      <Rect
        x={dl} y={dt}
        width={dw} height={dh}
        rx={dw / 2} fill={NAVY}
      />

      {/* Window left */}
      <Rect x={w1l} y={wt} width={ws} height={ws} fill={NAVY} />
      <Line x1={w1l + ws/2} y1={wt} x2={w1l + ws/2} y2={wt + ws} stroke={GOLD} strokeWidth={sc(1)} />
      <Line x1={w1l} y1={wt + ws/2} x2={w1l + ws} y2={wt + ws/2} stroke={GOLD} strokeWidth={sc(1)} />

      {/* Window right */}
      <Rect x={w2l} y={wt} width={ws} height={ws} fill={NAVY} />
      <Line x1={w2l + ws/2} y1={wt} x2={w2l + ws/2} y2={wt + ws} stroke={GOLD} strokeWidth={sc(1)} />
      <Line x1={w2l} y1={wt + ws/2} x2={w2l + ws} y2={wt + ws/2} stroke={GOLD} strokeWidth={sc(1)} />
    </Svg>
  );
}

// ─── Letter component with individual animation ──────────────────────────
function AnimatedLetter({
  char, delay, color, fontSize,
}: {
  char: string; delay: number; color: string; fontSize: number;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(28);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) })
    );
    translateY.value = withDelay(
      delay,
      withSpring(0, { damping: 14, stiffness: 160 })
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.Text style={[style, { fontSize, fontFamily: "DMSans_700Bold", color, letterSpacing: 6 }]}>
      {char}
    </Animated.Text>
  );
}

// ─── Main splash screen ──────────────────────────────────────────────────
export default function OnboardingSplash() {
  // Animation values
  const bgOpacity      = useSharedValue(0);
  const iconScale      = useSharedValue(0.3);
  const iconOpacity    = useSharedValue(0);
  const iconY          = useSharedValue(30);
  const ringScale      = useSharedValue(0.6);
  const ringOpacity    = useSharedValue(0);
  const subOpacity     = useSharedValue(0);
  const tagOpacity     = useSharedValue(0);
  const lineW          = useSharedValue(0);
  const dotOpacity1    = useSharedValue(0);
  const dotOpacity2    = useSharedValue(0);
  const dotOpacity3    = useSharedValue(0);
  const shimmerX       = useSharedValue(-200);

  function goNext() {
    router.replace("/(onboarding)/step1");
  }

  useEffect(() => {
    // Background fade
    bgOpacity.value = withTiming(1, { duration: 400 });

    // Ring pop
    ringOpacity.value = withDelay(150, withTiming(1, { duration: 500 }));
    ringScale.value   = withDelay(150, withSpring(1, { damping: 12, stiffness: 100 }));

    // House icon rise
    iconOpacity.value = withDelay(250, withTiming(1, { duration: 600 }));
    iconY.value       = withDelay(250, withSpring(0, { damping: 14, stiffness: 90 }));
    iconScale.value   = withDelay(250, withSpring(1, { damping: 12, stiffness: 100 }));

    // Decorative lines expand
    lineW.value = withDelay(900, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));

    // "REAL ESTATE" subtitle
    subOpacity.value = withDelay(1000, withTiming(1, { duration: 450 }));

    // Tagline
    tagOpacity.value = withDelay(1300, withTiming(1, { duration: 400 }));

    // Loading dots
    const dotDur = 260;
    dotOpacity1.value = withDelay(1600, withSequence(
      withTiming(1, { duration: dotDur }),
      withTiming(0.3, { duration: dotDur }),
    ));
    dotOpacity2.value = withDelay(1800, withSequence(
      withTiming(1, { duration: dotDur }),
      withTiming(0.3, { duration: dotDur }),
    ));
    dotOpacity3.value = withDelay(2000, withSequence(
      withTiming(1, { duration: dotDur }),
      withTiming(0.3, { duration: dotDur }, (done) => {
        if (done) runOnJS(goNext)();
      })
    ));
  }, []);

  const bgStyle     = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));
  const iconStyle   = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ translateY: iconY.value }, { scale: iconScale.value }],
  }));
  const ringStyle   = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));
  const subStyle    = useAnimatedStyle(() => ({ opacity: subOpacity.value }));
  const tagStyle    = useAnimatedStyle(() => ({ opacity: tagOpacity.value }));
  const lineStyle   = useAnimatedStyle(() => ({
    width: interpolate(lineW.value, [0, 1], [0, 52]),
    opacity: lineW.value,
  }));
  const dot1Style   = useAnimatedStyle(() => ({ opacity: dotOpacity1.value }));
  const dot2Style   = useAnimatedStyle(() => ({ opacity: dotOpacity2.value }));
  const dot3Style   = useAnimatedStyle(() => ({ opacity: dotOpacity3.value }));

  const LETTERS = "OKAPI".split("");
  const LETTER_BASE_DELAY = 500;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* ── Animated navy background ── */}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: NAVY }, bgStyle]} />

      {/* ── Background circles (decorative) ── */}
      <View style={styles.circleTopRight} />
      <View style={styles.circleBottomLeft} />
      <View style={styles.circleCenter} />

      {/* ── Main content ── */}
      <View style={styles.content}>

        {/* Ring glow behind icon */}
        <Animated.View style={[styles.glowRing, ringStyle]} />

        {/* House icon */}
        <Animated.View style={[styles.iconWrap, iconStyle]}>
          <HouseIcon size={148} />
        </Animated.View>

        {/* OKAPI letter-stagger */}
        <View style={styles.lettersRow}>
          {LETTERS.map((char, i) => (
            <AnimatedLetter
              key={i}
              char={char}
              delay={LETTER_BASE_DELAY + i * 90}
              color={GOLD}
              fontSize={52}
            />
          ))}
        </View>

        {/* Decorative lines + REAL ESTATE */}
        <Animated.View style={[styles.subRow, subStyle]}>
          <Animated.View style={[styles.line, lineStyle]} />
          <Text style={styles.subText}>REAL ESTATE</Text>
          <Animated.View style={[styles.line, lineStyle]} />
        </Animated.View>

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, tagStyle]}>
          Rooted in the Congo, Building Your Future
        </Animated.Text>
      </View>

      {/* ── Loading dots ── */}
      <View style={styles.dotsRow}>
        <Animated.View style={[styles.dot, { backgroundColor: GOLD }, dot1Style]} />
        <Animated.View style={[styles.dot, styles.dotMid, dot2Style]} />
        <Animated.View style={[styles.dot, { backgroundColor: GOLD }, dot3Style]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: NAVY,
    alignItems: "center",
    justifyContent: "center",
  },
  // Decorative background circles
  circleTopRight: {
    position: "absolute",
    top: -100, right: -80,
    width: 300, height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(30,99,181,0.12)",
  },
  circleBottomLeft: {
    position: "absolute",
    bottom: -120, left: -70,
    width: 280, height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(212,175,55,0.08)",
  },
  circleCenter: {
    position: "absolute",
    width: 500, height: 500,
    borderRadius: 250,
    backgroundColor: "rgba(30,99,181,0.05)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.06)",
  },
  content: {
    alignItems: "center",
    gap: 0,
  },
  // Glow behind icon
  glowRing: {
    position: "absolute",
    top: -20,
    width: 200, height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(212,175,55,0.07)",
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
  },
  iconWrap: {
    marginBottom: 16,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  lettersRow: {
    flexDirection: "row",
    marginBottom: 14,
    gap: 2,
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  line: {
    height: 1.5,
    backgroundColor: BLUE,
    borderRadius: 1,
  },
  subText: {
    color: BLUE,
    fontSize: 14,
    fontFamily: "DMSans_600SemiBold",
    letterSpacing: 4,
  },
  tagline: {
    color: "rgba(212,175,55,0.55)",
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    letterSpacing: 0.5,
    textAlign: "center",
    maxWidth: width * 0.7,
  },
  dotsRow: {
    position: "absolute",
    bottom: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dot: {
    width: 7, height: 7,
    borderRadius: 3.5,
  },
  dotMid: {
    width: 9, height: 9,
    borderRadius: 4.5,
    backgroundColor: BLUE,
  },
});
