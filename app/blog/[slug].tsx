import React from "react";
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import RenderHtml from "react-native-render-html";
import { getArticleBySlug, getAllArticles } from "../../src/lib/blog";
import { useThemeStore } from "../../src/store/useThemeStore";
import { Colors } from "../../src/constants/colors";
import Button from "../../src/components/ui/Button";
import { Clock, Calendar, ArrowRight } from "lucide-react-native";

export default function BlogDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { width } = useWindowDimensions();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const pageBg   = isDark ? Colors.dark.background : Colors.white;
  const cardBg   = isDark ? Colors.dark.card       : Colors.white;
  const borderC  = isDark ? Colors.dark.border      : Colors.border;
  const textMain = isDark ? Colors.dark.foreground  : Colors.foreground;
  const textMut  = isDark ? Colors.dark.mutedFg     : Colors.mutedFg;
  const accentBg = isDark ? Colors.dark.accent      : Colors.accent;
  const iconC    = isDark ? Colors.dark.primary     : Colors.primary;

  const article = getArticleBySlug(slug!);

  if (!article) {
    return (
      <View style={{ flex: 1, backgroundColor: pageBg, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: textMut, fontSize: 15 }}>Article introuvable.</Text>
      </View>
    );
  }

  const related = getAllArticles()
    .filter(a => a.category === article.category && a.slug !== article.slug)
    .slice(0, 3);

  // RenderHtml tag styles that adapt to dark mode
  const tagsStyles = {
    p:    { color: textMain,          fontSize: 15, lineHeight: 26, marginBottom: 16 },
    h2:   { color: textMain,          fontSize: 19, fontWeight: "700" as const, marginTop: 28, marginBottom: 12 },
    h3:   { color: textMain,          fontSize: 16, fontWeight: "600" as const, marginTop: 18, marginBottom: 8 },
    li:   { color: textMain,          fontSize: 15, lineHeight: 24, marginBottom: 6 },
    a:    { color: iconC },
    strong:{ color: textMain,         fontWeight: "700" as const },
    em:   { color: textMut,           fontStyle: "italic" as const },
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: pageBg }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: borderC }}>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <View style={{ backgroundColor: accentBg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 }}>
            <Text style={{ color: iconC, fontSize: 12, fontFamily: "DMSans_500Medium" }}>{article.category}</Text>
          </View>
          <View style={{ backgroundColor: isDark ? "rgba(212,175,55,0.2)" : Colors.secondary + "22", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 }}>
            <Text style={{ color: isDark ? Colors.secondary : Colors.navy, fontSize: 12, fontFamily: "DMSans_500Medium" }}>{article.tag}</Text>
          </View>
        </View>

        <Text style={{ color: textMain, fontSize: 22, fontFamily: "DMSans_700Bold", lineHeight: 30, marginBottom: 12 }}>
          {article.title}
        </Text>

        <View style={{ flexDirection: "row", gap: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Calendar size={13} color={textMut} />
            <Text style={{ color: textMut, fontSize: 12 }}>{article.date}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Clock size={13} color={textMut} />
            <Text style={{ color: textMut, fontSize: 12 }}>{article.readTime} de lecture</Text>
          </View>
        </View>
      </View>

      {/* Article body */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 20, backgroundColor: pageBg }}>
        <RenderHtml
          contentWidth={width - 40}
          source={{ html: article.content }}
          tagsStyles={tagsStyles}
          baseStyle={{ backgroundColor: pageBg }}
        />
      </View>

      {/* CTA banner */}
      <View style={{ marginHorizontal: 20, marginBottom: 24, backgroundColor: Colors.navy, borderRadius: 18, padding: 20 }}>
        <Text style={{ color: "#fff", fontSize: 16, fontFamily: "DMSans_700Bold", marginBottom: 6 }}>
          Prêt à trouver votre bien ?
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, lineHeight: 20, marginBottom: 16 }}>
          Nos agents certifiés vous accompagnent dans votre projet immobilier.
        </Text>
        <Button variant="gold" onPress={() => router.push("/(tabs)/agents")}>
          Trouver un agent
        </Button>
      </View>

      {/* Related articles */}
      {related.length > 0 && (
        <View style={{ paddingHorizontal: 20, paddingBottom: 32 }}>
          <Text style={{ color: textMain, fontSize: 16, fontFamily: "DMSans_700Bold", marginBottom: 12 }}>
            Articles similaires
          </Text>
          {related.map(a => (
            <TouchableOpacity
              key={a.slug}
              onPress={() => router.push(`/blog/${a.slug}` as any)}
              style={{
                backgroundColor: cardBg,
                borderWidth: 1, borderColor: borderC,
                borderRadius: 14, padding: 14, marginBottom: 10,
                flexDirection: "row", alignItems: "center", gap: 12,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: textMain, fontFamily: "DMSans_500Medium", fontSize: 14, lineHeight: 20 }} numberOfLines={2}>
                  {a.title}
                </Text>
                <Text style={{ color: textMut, fontSize: 12, marginTop: 3 }}>{a.readTime}</Text>
              </View>
              <ArrowRight size={16} color={textMut} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
