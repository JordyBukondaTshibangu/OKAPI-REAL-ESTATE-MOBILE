import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  useWindowDimensions,
  Animated,
  Platform,
  LayoutChangeEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTourStore, TOUR_STEPS } from "../../store/useTourStore";
import { Colors } from "../../constants/colors";
import { useT } from "../../i18n/useT";
import { ArrowRight } from "lucide-react-native";

const OVERLAY_COLOR = "rgba(0,0,0,0.72)";
const SPOTLIGHT_PADDING_H = 14;   // left / right
const SPOTLIGHT_PADDING_T = 5;    // top — tight so no dead space above highlighted element
const SPOTLIGHT_PADDING_B = 20;   // bottom — extra room so chip shadows / borders never get clipped
const SPOTLIGHT_RADIUS = 16;
const TAB_BAR_HEIGHT = 49;
const TOOLTIP_H_MARGIN = 16;
const ARROW_W = 14;    // half-width of arrow triangle
const ARROW_H = 12;    // height of arrow triangle
const ARROW_GAP = 6;   // gap between spotlight edge and arrow tip

export default function TourOverlay() {
  const { isActive, currentStep, layouts, nextStep, skipTour } = useTourStore();
  const insets = useSafeAreaInsets();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const t = useT();

  // Dynamically measured tooltip height — avoids positioning errors from hardcoded estimates
  const [tooltipH, setTooltipH] = useState(220);

  const stepTitles = [t.tour.step1Title, t.tour.step2Title, t.tour.step3Title];
  const stepDescs  = [t.tour.step1Desc,  t.tour.step2Desc,  t.tour.step3Desc];

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      fadeAnim.setValue(0);
      slideAnim.setValue(12);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
      ]).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 850, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 850, useNativeDriver: true }),
        ])
      ).start();
    } else {
      fadeAnim.setValue(0);
      glowAnim.stopAnimation();
    }
  }, [isActive, currentStep]);

  if (!isActive) return null;

  const step = TOUR_STEPS[currentStep];
  if (!step) return null;

  // ── Resolve target layout ─────────────────────────────────────────────────
  let target = layouts[step.id];
  let noTarget = false;

  if (!target) {
    if (step.id === "compte-tab") {
      // Fallback: compute the 5th tab icon position manually
      const tabW = screenW / 5;
      const tabBarTop = screenH - TAB_BAR_HEIGHT - insets.bottom;
      const iconSize = 26;
      target = {
        x: 4 * tabW + (tabW - iconSize) / 2,
        y: tabBarTop + (TAB_BAR_HEIGHT - iconSize) / 2 - 2,
        width: iconSize,
        height: iconSize,
      };
    } else {
      noTarget = true;
      target = {
        x: screenW * 0.1,
        y: screenH * 0.35,
        width: screenW * 0.8,
        height: screenH * 0.2,
      };
    }
  }

  // ── Spotlight bounds ──────────────────────────────────────────────────────
  const spTop    = Math.max(0, target.y - SPOTLIGHT_PADDING_T);
  const spLeft   = Math.max(0, target.x - SPOTLIGHT_PADDING_H);
  const spW      = target.width  + SPOTLIGHT_PADDING_H * 2;
  const spH      = target.height + SPOTLIGHT_PADDING_T + SPOTLIGHT_PADDING_B;
  const spBottom = spTop + spH;

  // ── Tooltip & arrow positioning ───────────────────────────────────────────
  const tooltipW = screenW - TOOLTIP_H_MARGIN * 2;
  const arrowTip2Card = ARROW_GAP + ARROW_H; // distance from spotlight edge to card start

  let tooltipTop: number;
  const posBelow = step.tooltipPosition === "below";

  if (posBelow) {
    tooltipTop = spBottom + arrowTip2Card;
  } else {
    tooltipTop = spTop - arrowTip2Card - tooltipH;
  }

  // Clamp so tooltip stays on screen
  tooltipTop = Math.max(
    insets.top + 8,
    Math.min(tooltipTop, screenH - tooltipH - insets.bottom - 16)
  );

  // Arrow X: centered on spotlight, clamped within screen
  const arrowCenterX = target.x + target.width / 2;
  const arrowX = Math.min(
    Math.max(arrowCenterX - ARROW_W, TOOLTIP_H_MARGIN + 16),
    screenW - TOOLTIP_H_MARGIN - 16 - ARROW_W * 2
  );

  // Arrow Y positions
  const arrowUpY   = spBottom + ARROW_GAP;                    // tip points up at spotlight bottom
  const arrowDownY = posBelow ? 0 : tooltipTop + tooltipH;    // tip points down at tooltip bottom

  const isLast = currentStep === TOUR_STEPS.length - 1;

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 1.0],
  });

  const handleTooltipLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 10) setTooltipH(h);
  };

  return (
    <Modal
      visible={isActive}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={skipTour}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>

        {/* ── 4-rectangle spotlight cutout ──────────────────────────────── */}
        {noTarget ? (
          <View style={[s.overlay, StyleSheet.absoluteFillObject]} />
        ) : (
          <>
            {/* Top strip */}
            <View style={[s.overlay, { top: 0, left: 0, right: 0, height: spTop }]} />
            {/* Left strip */}
            <View style={[s.overlay, { top: spTop, left: 0, width: spLeft, height: spH }]} />
            {/* Right strip */}
            <View style={[s.overlay, { top: spTop, left: spLeft + spW, right: 0, height: spH }]} />
            {/* Bottom strip */}
            <View style={[s.overlay, { top: spBottom, left: 0, right: 0, bottom: 0 }]} />

            {/* Outer glow ring — pulsing blue */}
            <Animated.View
              style={{
                position: "absolute",
                top: spTop - 5,
                left: spLeft - 5,
                width: spW + 10,
                height: spH + 10,
                borderRadius: SPOTLIGHT_RADIUS + 5,
                borderWidth: 3,
                borderColor: Colors.primary,
                opacity: glowOpacity,
              }}
            />
            {/* Inner white frame */}
            <View
              style={{
                position: "absolute",
                top: spTop,
                left: spLeft,
                width: spW,
                height: spH,
                borderRadius: SPOTLIGHT_RADIUS,
                borderWidth: 2.5,
                borderColor: "rgba(255,255,255,0.95)",
              }}
            />
          </>
        )}

        {/* ── Arrow connector ───────────────────────────────────────────── */}
        {!noTarget && posBelow && (
          <View style={[s.arrowUp, { position: "absolute", top: arrowUpY, left: arrowX }]} />
        )}
        {!noTarget && !posBelow && (
          <View style={[s.arrowDown, { position: "absolute", top: arrowDownY, left: arrowX }]} />
        )}

        {/* ── Tooltip card ──────────────────────────────────────────────── */}
        <Animated.View
          onLayout={handleTooltipLayout}
          style={[
            s.tooltip,
            {
              top: tooltipTop,
              left: TOOLTIP_H_MARGIN,
              width: tooltipW,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Progress segments */}
          <View style={{ flexDirection: "row", gap: 5, marginBottom: 16 }}>
            {TOUR_STEPS.map((_, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 2,
                  overflow: "hidden",
                  backgroundColor: Colors.border,
                }}
              >
                {i <= currentStep && (
                  <View style={{ flex: 1, backgroundColor: Colors.primary }} />
                )}
              </View>
            ))}
          </View>

          {/* Step counter */}
          <Text style={s.stepCounter}>
            {currentStep + 1} / {TOUR_STEPS.length}
          </Text>

          <Text style={s.titleText}>{stepTitles[currentStep]}</Text>
          <Text style={s.descText}>{stepDescs[currentStep]}</Text>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: Colors.border, marginVertical: 16 }} />

          {/* Actions */}
          <View style={s.actionsRow}>
            <TouchableOpacity
              onPress={skipTour}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={s.skipText}>{t.tour.skip}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={nextStep} style={s.nextBtn} activeOpacity={0.82}>
              <Text style={s.nextBtnText}>
                {isLast ? t.tour.finish : t.tour.next}
              </Text>
              {!isLast && (
                <ArrowRight size={14} color="#fff" strokeWidth={2.5} style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    position: "absolute",
    backgroundColor: OVERLAY_COLOR,
  },
  // Arrow pointing up (tooltip is below spotlight)
  arrowUp: {
    width: 0,
    height: 0,
    borderLeftWidth: ARROW_W,
    borderRightWidth: ARROW_W,
    borderBottomWidth: ARROW_H,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#FFFFFF",
  },
  // Arrow pointing down (tooltip is above spotlight)
  arrowDown: {
    width: 0,
    height: 0,
    borderLeftWidth: ARROW_W,
    borderRightWidth: ARROW_W,
    borderTopWidth: ARROW_H,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#FFFFFF",
  },
  tooltip: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.22,
        shadowRadius: 24,
      },
      android: {
        elevation: 18,
      },
    }),
  },
  stepCounter: {
    fontSize: 11,
    fontFamily: "DMSans_500Medium",
    color: Colors.primary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  titleText: {
    fontSize: 18,
    fontFamily: "DMSans_700Bold",
    color: Colors.foreground,
    marginBottom: 6,
    lineHeight: 24,
  },
  descText: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.mutedFg,
    lineHeight: 22,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  skipText: {
    color: Colors.mutedFg,
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
  },
  nextBtn: {
    backgroundColor: Colors.navy,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
  },
  nextBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "DMSans_600SemiBold",
  },
});
