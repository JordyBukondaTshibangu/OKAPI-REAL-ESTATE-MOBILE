import { Tabs } from "expo-router";
import { Home, Search, Bell, Users, User, Building2, Zap } from "lucide-react-native";
import { Colors } from "../../src/constants/colors";
import { useThemeStore } from "../../src/store/useThemeStore";
import { useAgentSessionStore } from "../../src/store/useAgentSessionStore";
import { useT } from "../../src/i18n/useT";

export const unstable_settings = {
  initialRouteName: "louer",
};

export default function TabLayout() {
  const { theme } = useThemeStore();
  const t = useT();
  const { isAuthenticated: isAgentLoggedIn } = useAgentSessionStore();
  const isDark = theme === "dark";

  const tabBarBg = isDark ? Colors.dark.card : Colors.white;
  const tabBarBorder = isDark ? Colors.dark.border : Colors.border;
  const activeTint = isDark ? Colors.dark.primary : Colors.primary;
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
      {/* Tab 1: Home — same for everyone */}
      <Tabs.Screen
        name="index"
        options={{
          title: t.nav.home,
          tabBarIcon: ({ color }) => <Home size={22} color={color} />,
        }}
      />

      {/* Tab 2: Recherche — unified search for both users and agents */}
      <Tabs.Screen
        name="acheter"
        options={{
          title: t.nav.agentBrowse,
          tabBarIcon: ({ color }) => <Search size={22} color={color} />,
        }}
      />

      {/* Tab 3: Alertes (users) / Annonces (agents) */}
      <Tabs.Screen
        name="louer"
        options={{
          title: isAgentLoggedIn ? t.nav.myListings : t.nav.alerts,
          tabBarIcon: ({ color }) =>
            isAgentLoggedIn
              ? <Building2 size={22} color={color} />
              : <Bell size={22} color={color} />,
        }}
      />

      {/* Tab 4: Agents / Boosts — redirects agents to their dashboard */}
      <Tabs.Screen
        name="agents"
        options={{
          title: isAgentLoggedIn ? t.nav.boosts : t.nav.agents,
          tabBarIcon: ({ color }) =>
            isAgentLoggedIn
              ? <Zap size={22} color={color} />
              : <Users size={22} color={color} />,
        }}
      />

      {/* Tab 5: Account — same for everyone, content differs */}
      <Tabs.Screen
        name="compte"
        options={{
          title: t.nav.account,
          tabBarIcon: ({ color }) => <User size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
