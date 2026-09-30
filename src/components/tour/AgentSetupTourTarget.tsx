import React, { useRef, useCallback, useEffect } from "react";
import { View } from "react-native";
import {
  useAgentSetupTourStore,
  AGENT_SETUP_TOUR_STEPS,
} from "../../store/useAgentSetupTourStore";

interface Props {
  stepId: string;
  children: React.ReactNode;
  style?: object;
}

/**
 * Like TourTarget but wired to useAgentSetupTourStore instead of useTourStore.
 * Use this inside the agent profil screen for the post-registration tour.
 */
export default function AgentSetupTourTarget({ stepId, children, style }: Props) {
  const ref = useRef<View>(null);
  const registerLayout = useAgentSetupTourStore((s) => s.registerLayout);
  const isActive      = useAgentSetupTourStore((s) => s.isActive);
  const currentStep   = useAgentSetupTourStore((s) => s.currentStep);
  const isCurrentStep = isActive && AGENT_SETUP_TOUR_STEPS[currentStep]?.id === stepId;

  const measure = useCallback(() => {
    if (!ref.current) return;
    requestAnimationFrame(() => {
      ref.current?.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) {
          registerLayout(stepId, { x, y, width, height });
        }
      });
    });
  }, [stepId, registerLayout]);

  // Re-measure when this step becomes active
  useEffect(() => {
    if (!isCurrentStep) return;
    const timer = setTimeout(measure, 80);
    return () => clearTimeout(timer);
  }, [isCurrentStep, measure]);

  // Also register on first render
  const handleLayout = useCallback(() => { measure(); }, [measure]);

  return (
    <View ref={ref} onLayout={handleLayout} style={style} collapsable={false}>
      {children}
    </View>
  );
}
