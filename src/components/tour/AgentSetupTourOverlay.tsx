import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  useWindowDimensions,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useAgentSetupTourStore,
  AGENT_SETUP_TOUR_STEPS,
} from "../../store/useAgentSetupTourStore";
import { Colors } from "../../constants/colors";
import { useT } from "../../i18n/useT";

const OVERLAY_COLOR = "rgba(0,0,0,0.78)";
const SPOTLIGHT_PADDING = 10;
const SPOTLIGHT_RADIUS = 12;
const TOOLTIP_H_MARGIN = 20;
const TOOLTIP_CONTENT_HEIGHT = 168;

/**
 * AgentSetupTourOverlay
 *
 * Shows a two-step spotlight tour inside the agent profil screen:
 *   Step 1 – identity verification card
 *   Step 2 – basic profile info form
 *
 * Rendered inside profil.tsx so it only activates on that screen.
 */
export default function AgentSetupTourOverlay() {
  const { isActive, currentStep, layouts, nextStep, skipTour } =
    useAgentSetupTourStore();
  const insets = useSafeAreaInsets();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const t = useT();

  const stepTitles = [
    t.agentSetupTour.step1Title,
    t.agentSetupTour.step2Title,
  ];
  const stepDescs = [t.agentSetupTour.step1Desc, t.agentSetupTour.step2Desc];

  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (isActive) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    } else {
      opacity.setValue(0);
    }
  }, [isActive, currentStep]);

  if (!isActive) return null;

  const step = AGENT_SETUP_TOUR_STEPS[currentStep];
  if (!step) return null;

  // ── Resolve target layout ──────────────────────────────────────────────────
  let target = layouts[step.id];
  let noTarget = false;

  if (!target) {
    noTarget = true;
    target = {
      x: screenW * 0.1,
      y: screenH * 0.3,
      width: screenW * 0.8,
      height: screenH * 0.2,
    };
  }

  // ── Spotlight bounds ────────────────────────────────────────────────────────
  const spTop  = Math.max(0, target.y - SPOTLIGHT_PADDING);
  const spLeft = Math.max(0, target.x - SPOTLIGHT_PADDING);
  const spW    = target.width  + SPOTLIGHT_PADDING * 2;
  const spH    = target.height + SPOTLIGHT_PADDING * 2;

  // ── Tooltip position ────────────────────────────────────────────────────────
  const tooltipW = screenW - TOOLTIP_H_MARGIN * 2;
  let tooltipTop: number;
  if (step.tooltipPosition === "below") {
    tooltipTop = spTop + spH + 14;
  } else {
    tooltipTop = spTop - 14 - TOOLTIP_CONTENT_HEIGHT;
  }
  tooltipTop = Math.max(
    insets.top + 8,
    Math.min(tooltipTop, screenH - TOOLTIP_CONTENT_HEIGHT - insets.bottom - 8),
  );

  const arrowX = Math.min(
    Math.max(target.x + target.width / 2 - 8, TOOLTIP_H_MARGIN + 16),
    screenW - TOOLTIP_H_MARGIN - 16 - 16,
  );

  const isLast = currentStep === AGENT_SETUP_TOUR_STEPS.length - 1;

  return (
    <Modal
      visible={isActive}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={skipTour}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
        {/* ── 4-rectangle spotlight cutout ───────────────────────────────── */}
        {noTarget ? (
          <View style={[s.overlay, StyleSheet.absoluteFillObject]} />
        ) : (
          <>
            <View style={[s.overlay, { top: 0, left: 0, right: 0, height: spTop }]} />
            <View style={[s.overlay, { top: spTop, left: 0, width: spLeft, height: spH }]} />
            <View style={[s.overlay, { top: spTop, left: spLeft + spW, right: 0, height: spH }]} />
            <View style={[s.overlay, { top: spTop + spH, left: 0, right: 0, bottom: 0 }]} />
            <View
              style={{
                position: "absolute",
                top: spTop,
                left: spLeft,
                width: spW,
                height: spH,
                borderRadius: SPOTLIGHT_RADIUS,
                borderWidth: 2,
                borderColor: "rgba(255,255,255,0.55)",
              }}
            />
          </>
        )}

        {/* ── Arrow ──────────────────────────────────────────────────────── */}
        {!noTarget && step.tooltipPosition === "below" && (
          <View
            style={{
              position: "absolute",
              top: spTop + spH + 4,
              left: arrowX,
              ...s.arrowUp,
            }}
          />
        )}
        {!noTarget && step.tooltipPosition === "above" && (
          <View
            style={{
              position: "absolute",
              top: tooltipTop + TOOLTIP_CONTENT_HEIGHT,
              left: arrowX,
              ...s.arrowDown,
            }}
          />
        )}

        {/* ── Tooltip card ────────────────────────────────────────────────── */}
        <View
          style={[
            s.tooltip,
            { top: tooltipTop, left: TOOLTIP_H_MARGIN, width: tooltipW },
          ]}
        >
          {/* Progress bar */}
          <View style={{ flexDirection: "row", gap: 5, marginBottom: 14 }}>
            {AGENT_SETUP_TOUR_STEPS.map((_, i) => (
              <View
                key={i}
                style={[
                  s.progressDot,
                  {
                    backgroundColor:
                      i <= currentStep ? Colors.primary : Colors.border,
                    flex: 1,
                  },
                ]}
              />
            ))}
          </View>

          <Text style={s.titleText}>{stepTitles[currentStep]}</Text>
          <Text style={s.descText}>{stepDescs[currentStep]}</Text>

          <View style={s.actionsRow}>
            <TouchableOpacity
              onPress={skipTour}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={s.skipText}>{t.agentSetupTour.skip}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={nextStep}
              style={s.nextBtn}
              activeOpacity={0.85}
            >
              <Text style={s.nextBtnText}>
                {isLast ? t.agentSetupTour.finish : t.agentSetupTour.next}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    position: "absolute",
    backgroundColor: OVERLAY_COLOR,
  },
  arrowUp: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#FFFFFF",
  },
  arrowDown: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#FFFFFF",
  },
  tooltip: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 14,
  },
  progressDot: {
    height: 3,
    borderRadius: 2,
  },
  titleText: {
    fontSize: 17,
    fontFamily: "DMSans_700Bold",
    color: Colors.foreground,
    marginBottom: 6,
  },
  descText: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.mutedFg,
    lineHeight: 21,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
  },
  skipText: {
    color: Colors.mutedFg,
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
  },
  nextBtn: {
    backgroundColor: Colors.navy,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  nextBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "DMSans_600SemiBold",
  },
});
