import { Stack } from "expo-router";

export default function CompteLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="profil" options={{ title: "Mon Profil", headerBackTitle: "Compte" }} />
      <Stack.Screen name="favoris" options={{ title: "Mes Favoris", headerBackTitle: "Compte" }} />
      <Stack.Screen name="alertes" options={{ title: "Mes Alertes", headerBackTitle: "Compte" }} />
      <Stack.Screen name="demandes" options={{ title: "Mes Demandes", headerBackTitle: "Compte" }} />
      <Stack.Screen name="avis" options={{ title: "Mes Avis", headerBackTitle: "Compte" }} />
      <Stack.Screen name="parametres" options={{ title: "Paramètres", headerBackTitle: "Compte" }} />
    </Stack>
  );
}
