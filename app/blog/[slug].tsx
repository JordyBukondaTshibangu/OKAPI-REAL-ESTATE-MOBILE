import React from "react";
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import RenderHtml from "react-native-render-html";
import { getArticleBySlug, getAllArticles } from "../../src/lib/blog";
import { Colors } from "../../src/constants/colors";
import Button from "../../src/components/ui/Button";
import { Clock, Calendar, ArrowRight } from "lucide-react-native";

export default function BlogDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { width } = useWindowDimensions();
  const article = getArticleBySlug(slug!);

  if (!article) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: Colors.mutedFg }}>Article introuvable.</Text>
      </View>
    );
  }

  const related = getAllArticles().filter(a => a.category === article.category && a.slug !== article.slug).slice(0, 3);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }} showsVerticalScrollIndicator={false}>
      <View className="px-5 pt-5 pb-4 border-b border-border">
        <View className="flex-row gap-2 mb-3">
          <View className="bg-accent rounded-full px-3 py-1">
            <Text className="text-primary text-xs font-sans-medium">{article.category}</Text>
          </View>
          <View className="bg-secondary rounded-full px-3 py-1">
            <Text className="text-navy text-xs font-sans-medium">{article.tag}</Text>
          </View>
        </View>
        <Text className="text-text-dark text-xl font-sans-bold mb-3">{article.title}</Text>
        <View className="flex-row gap-4">
          <View className="flex-row items-center gap-1">
            <Calendar size={13} color={Colors.mutedFg} />
            <Text className="text-muted-fg text-xs">{article.date}</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Clock size={13} color={Colors.mutedFg} />
            <Text className="text-muted-fg text-xs">{article.readTime} de lecture</Text>
          </View>
        </View>
      </View>

      <View className="px-5 py-4">
        <RenderHtml
          contentWidth={width - 40}
          source={{ html: article.content }}
          tagsStyles={{
            p: { color: Colors.foreground, fontSize: 15, lineHeight: 26, marginBottom: 16 },
            h2: { color: Colors.textDark ?? Colors.foreground, fontSize: 18, fontWeight: "700", marginTop: 24, marginBottom: 12 },
            h3: { color: Colors.foreground, fontSize: 16, fontWeight: "600", marginTop: 16, marginBottom: 8 },
          }}
        />
      </View>

      {/* CTA */}
      <View className="mx-5 mb-6 bg-navy rounded-2xl px-5 py-5">
        <Text className="text-white text-base font-sans-bold mb-1">Prêt à trouver votre bien ?</Text>
        <Text className="text-white/70 text-sm mb-4">Nos agents certifiés vous accompagnent dans votre projet immobilier.</Text>
        <Button variant="gold" onPress={() => router.push("/(tabs)/agents")}>Trouver un agent</Button>
      </View>

      {/* Related articles */}
      {related.length > 0 && (
        <View className="px-5 mb-8">
          <Text className="text-text-dark text-base font-sans-semibold mb-3">Articles similaires</Text>
          {related.map(a => (
            <TouchableOpacity
              key={a.slug}
              onPress={() => router.push(`/blog/${a.slug}` as any)}
              className="bg-white border border-border rounded-2xl p-4 mb-3 flex-row items-center gap-3"
            >
              <View className="flex-1">
                <Text className="text-text-dark font-sans-medium" numberOfLines={2}>{a.title}</Text>
                <Text className="text-muted-fg text-xs mt-1">{a.readTime}</Text>
              </View>
              <ArrowRight size={16} color={Colors.mutedFg} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
