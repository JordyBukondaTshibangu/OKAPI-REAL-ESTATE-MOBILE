import { Link, Stack } from "expo-router";
import { View, Text } from "react-native";

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: "Page introuvable" }} />
      <View className="flex-1 items-center justify-center bg-background-alt p-6">
        <Text className="text-6xl font-sans-bold text-primary">404</Text>
        <Text className="text-xl font-sans-semibold text-text-dark mt-4">Page introuvable</Text>
        <Link href="/" className="mt-8 text-primary underline">Retour à l'accueil</Link>
      </View>
    </>
  );
}
