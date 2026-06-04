import { Tabs } from "expo-router";
import { Home, Search, Key, Users, User } from "lucide-react-native";
import { Colors } from "../../src/constants/colors";
import { useThemeStore } from "../../src/store/useThemeStore";
import { useT } from "../../src/i18n/useT";

export default function TabLayout() {
  const { theme } = useThemeStore();
  const t = useT();
  const isDark = theme === "dark";

  const tabBarBg = isDark ? Colors.dark.card : Colors.white;
  const tabBarBorder = isDark ? Colors.dark.border : Colors.border;
  const activeTint = isDark ? Colors.dark.primary : Colors.primary;
  const inactiveTint = isDark ? Colors.dark.mutedFg : Colors.mutedFg;

  return (
    <Tabs
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
          tabBarIcon: ({ color }) => <Home size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="acheter"
        options={{
          title: t.nav.buy,
          tabBarIcon: ({ color }) => <Search size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="louer"
        options={{
          title: t.nav.rent,
          tabBarIcon: ({ color }) => <Key size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="agents"
        options={{
          title: t.nav.agents,
          tabBarIcon: ({ color }) => <Users size={22} color={color} />,
        }}
      />
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
