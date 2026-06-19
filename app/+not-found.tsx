import { Link, Stack } from "expo-router";
import { View, Text } from "react-native";
import { useT } from "../src/i18n/useT";

export default function NotFound() {
  const t = useT();
  return (
    <>
      <Stack.Screen options={{ title: t.common.notFound }} />
      <View className="flex-1 items-center justify-center bg-background-alt p-6">
        <Text className="text-6xl font-sans-bold text-primary">404</Text>
        <Text className="text-xl font-sans-semibold text-text-dark mt-4">{t.common.notFound}</Text>
        <Link href="/" className="mt-8 text-primary underline">{t.common.backHome}</Link>
      </View>
    </>
  );
}
