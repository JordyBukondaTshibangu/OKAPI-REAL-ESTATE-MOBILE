import React, { useRef, useCallback, useEffect } from "react";
import { View } from "react-native";
import { useTourStore, TOUR_STEPS } from "../../store/useTourStore";

interface Props {
  stepId: string;
  children: React.ReactNode;
  style?: object;
}

/**
 * Wrap any element with TourTarget so it can be highlighted by the tour.
 * The component measures itself using measureInWindow and registers the result
 * in the TourStore whenever it mounts or whenever its step becomes active.
 *
 * Usage:
 *   <TourTarget stepId="search-bar">
 *     <SearchBar ... />
 *   </TourTarget>
 */
export default function TourTarget({ stepId, children, style }: Props) {
  const ref = useRef<View>(null);
  const registerLayout = useTourStore((s) => s.registerLayout);
  const isActive = useTourStore((s) => s.isActive);
  const currentStep = useTourStore((s) => s.currentStep);
  const isCurrentStep = isActive && TOUR_STEPS[currentStep]?.id === stepId;

  const measure = useCallback(() => {
    if (!ref.current) return;
    // requestAnimationFrame ensures layout is finalised before we measure
    requestAnimationFrame(() => {
      ref.current?.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) {
          registerLayout(stepId, { x, y, width, height });
        }
      });
    });
  }, [stepId, registerLayout]);

  // Re-measure the moment this step becomes the active tour step
  useEffect(() => {
    if (!isCurrentStep) return;
    const timer = setTimeout(measure, 80);
    return () => clearTimeout(timer);
  }, [isCurrentStep, measure]);

  // Also register on first layout so the position is cached early
  const handleLayout = useCallback(() => {
    measure();
  }, [measure]);

  return (
    <View ref={ref} onLayout={handleLayout} style={style} collapsable={false}>
      {children}
    </View>
  );
}
