import React, { useEffect, useRef } from "react";
import { Animated, Image, Pressable, Text, View } from "react-native";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { useThemeStore } from "../../store/useThemeStore";

export type ToastType = "success" | "error" | "warning" | "info";

export type ToastData = {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, default 3500
};

type Props = ToastData & { onDismiss: (id: string) => void };

const VARIANTS: Record<
  ToastType,
  { icon: React.ElementType; iconColor: string; barColor: string; bgLight: string; bgDark: string }
> = {
  success: {
    icon: CheckCircle,
    iconColor: "#16A34A",
    barColor: "#16A34A",
    bgLight: "#F0FDF4",
    bgDark: "#0D2B18",
  },
  error: {
    icon: XCircle,
    iconColor: "#DC2626",
    barColor: "#DC2626",
    bgLight: "#FEF2F2",
    bgDark: "#2B0D0D",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "#D97706",
    barColor: "#D97706",
    bgLight: "#FFFBEB",
    bgDark: "#2B1E08",
  },
  info: {
    icon: Info,
    iconColor: Colors.primary,
    barColor: Colors.primary,
    bgLight: Colors.accent,
    bgDark: Colors.dark.accent,
  },
};

export default function Toast({ id, type, title, message, duration = 3500, onDismiss }: Props) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const progress   = useRef(new Animated.Value(1)).current;

  const variant = VARIANTS[type];
  const Icon    = variant.icon;
  const bg      = isDark ? variant.bgDark : variant.bgLight;
  const border  = isDark ? Colors.dark.border : Colors.border;
  const textMain  = isDark ? Colors.dark.foreground : Colors.textDark;
  const textMuted = isDark ? Colors.dark.mutedFg : Colors.mutedFg;

  useEffect(() => {
    // Slide in
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 200 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    // Progress bar drains over `duration`
    Animated.timing(progress, { toValue: 0, duration, useNativeDriver: false }).start();

    // Auto-dismiss
    const timer = setTimeout(() => dismiss(), duration);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -120, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => onDismiss(id));
  }

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  return (
    <Animated.View
      style={{
        transform: [{ translateY }],
        opacity,
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: 16,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.4 : 0.12,
        shadowRadius: 12,
        elevation: 8,
        overflow: "hidden",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", padding: 14, gap: 12 }}>
        {/* Okapi logo */}
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: isDark ? Colors.dark.muted : Colors.white,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: border,
          }}
        >
          <Image
            source={require("../../../assets/icon.png")}
            style={{ width: 24, height: 24, borderRadius: 6 }}
            resizeMode="contain"
          />
        </View>

        {/* Text */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: message ? 2 : 0 }}>
            <Icon size={14} color={variant.iconColor} />
            <Text style={{ color: textMain, fontFamily: "DMSans_700Bold", fontSize: 14 }}>
              {title}
            </Text>
          </View>
          {!!message && (
            <Text style={{ color: textMuted, fontSize: 13, fontFamily: "DMSans_400Regular", lineHeight: 18 }}>
              {message}
            </Text>
          )}
        </View>

        {/* Dismiss */}
        <Pressable onPress={dismiss} hitSlop={8}>
          <X size={16} color={textMuted} />
        </Pressable>
      </View>

      {/* Progress bar */}
      <View style={{ height: 3, backgroundColor: isDark ? Colors.dark.muted : Colors.border }}>
        <Animated.View
          style={{ height: 3, backgroundColor: variant.barColor, width: barWidth }}
        />
      </View>
    </Animated.View>
  );
}
