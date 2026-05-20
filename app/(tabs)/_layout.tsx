import { Tabs } from "expo-router";
import { Home, Search, Key, Users, User } from "lucide-react-native";
import { Colors } from "../../src/constants/colors";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: Colors.primary,
      tabBarInactiveTintColor: Colors.mutedFg,
      tabBarStyle: { backgroundColor: Colors.white, borderTopColor: Colors.border },
      tabBarLabelStyle: { fontFamily: "DMSans_500Medium", fontSize: 11 },
    }}>
      <Tabs.Screen name="index" options={{ title: "Accueil", tabBarIcon: ({ color }) => <Home size={22} color={color} /> }} />
      <Tabs.Screen name="acheter" options={{ title: "Acheter", tabBarIcon: ({ color }) => <Search size={22} color={color} /> }} />
      <Tabs.Screen name="louer" options={{ title: "Louer", tabBarIcon: ({ color }) => <Key size={22} color={color} /> }} />
      <Tabs.Screen name="agents" options={{ title: "Agents", tabBarIcon: ({ color }) => <Users size={22} color={color} /> }} />
      <Tabs.Screen name="compte" options={{ title: "Compte", tabBarIcon: ({ color }) => <User size={22} color={color} /> }} />
    </Tabs>
  );
}
