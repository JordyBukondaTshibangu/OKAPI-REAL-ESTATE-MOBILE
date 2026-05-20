import React from "react";
import { View, Text, ScrollView, useWindowDimensions } from "react-native";
import { useLocalSearchParams } from "expo-router";
import RenderHtml from "react-native-render-html";
import { getConseilBySlug } from "../../src/lib/conseils";
import { Colors } from "../../src/constants/colors";
import { Clock } from "lucide-react-native";

export default function ConseilDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { width } = useWindowDimensions();
  const conseil = getConseilBySlug(slug!);

  if (!conseil) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: Colors.mutedFg }}>Guide introuvable.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }} showsVerticalScrollIndicator={false}>
      <View className="px-5 pt-5 pb-4 border-b border-border">
        <View className="bg-accent rounded-full px-3 py-1 self-start mb-3">
          <Text className="text-primary text-xs font-sans-medium">{conseil.category}</Text>
        </View>
        <Text className="text-text-dark text-xl font-sans-bold mb-2">{conseil.title}</Text>
        <View className="flex-row items-center gap-1">
          <Clock size={13} color={Colors.mutedFg} />
          <Text className="text-muted-fg text-xs">{conseil.readTime} de lecture</Text>
        </View>
      </View>
      <View className="px-5 py-4 pb-12">
        <RenderHtml
          contentWidth={width - 40}
          source={{ html: conseil.content }}
          tagsStyles={{
            p: { color: Colors.foreground, fontSize: 15, lineHeight: 26, marginBottom: 16 },
            h2: { color: Colors.foreground, fontSize: 18, fontWeight: "700", marginTop: 24, marginBottom: 12 },
            h3: { color: Colors.foreground, fontSize: 16, fontWeight: "600", marginTop: 16, marginBottom: 8 },
            ul: { color: Colors.foreground, fontSize: 15, lineHeight: 26 },
            li: { marginBottom: 6 },
          }}
        />
      </View>
    </ScrollView>
  );
}
