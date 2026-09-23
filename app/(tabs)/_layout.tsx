import { Tabs } from "expo-router";
import { Home, Search, Bell, Users, User, Building2, Zap } from "lucide-react-native";
import React, { useRef, useEffect, type ComponentType } from "react";
import { Animated } from "react-native";
import { Colors } from "../../src/constants/colors";
import { useThemeStore } from "../../src/store/useThemeStore";
import { useAgentSessionStore } from "../../src/store/useAgentSessionStore";
import { useT } from "../../src/i18n/useT";
import { BOOSTS_ENABLED } from "../../src/constants/features";

export const unstable_settings = {
  initialRouteName: "louer",
};

// ── Bouncing tab icon ────────────────────────────────────────────────────────
function AnimatedTabIcon({
  Icon,
  color,
  focused,
}: {
  Icon: ComponentType<{ size: number; color: string }>;
  color: string;
  focused: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (focused) {
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1.3,
          useNativeDriver: true,
          speed: 60,
          bounciness: 10,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 20,
          bounciness: 5,
        }),
      ]).start();
    }
  }, [focused]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Icon size={22} color={color} />
    </Animated.View>
  );
}

export default function TabLayout() {
  const { theme } = useThemeStore();
  const t = useT();
  const { isAuthenticated: isAgentLoggedIn } = useAgentSessionStore();
  const isDark = theme === "dark";

  const tabBarBg     = isDark ? Colors.dark.card    : Colors.white;
  const tabBarBorder = isDark ? Colors.dark.border  : Colors.border;
  const activeTint   = isDark ? Colors.dark.primary : Colors.primary;
  const inactiveTint = isDark ? Colors.dark.mutedFg : Colors.mutedFg;

  return (
    <Tabs
      initialRouteName="louer"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeTint,
        tabBarInactiveTintColor: inactiveTint,
        tabBarStyle: {
          backgroundColor: tabBarBg,
          borderTopColor: tabBarBorder,
        },
        tabBarLabelStyle: { fontFamily: "DMSans_500Medium", fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.nav.home,
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon Icon={Home} color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="acheter"
        options={{
          title: t.nav.agentBrowse,
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon Icon={Search} color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="louer"
        options={{
          title: isAgentLoggedIn ? t.nav.myListings : t.nav.alerts,
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              Icon={isAgentLoggedIn ? Building2 : Bell}
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="agents"
        options={{
          title: isAgentLoggedIn ? t.nav.boosts : t.nav.agents,
          // Agents see Boosts here — hidden until the feature is released
          href: isAgentLoggedIn && !BOOSTS_ENABLED ? null : undefined,
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              Icon={isAgentLoggedIn ? Zap : Users}
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="compte"
        options={{
          title: t.nav.account,
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon Icon={User} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
