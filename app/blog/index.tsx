import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { featuredArticle, blogPosts, getAllArticles } from "../../src/lib/blog";
import { useThemeStore } from "../../src/store/useThemeStore";
import { Colors } from "../../src/constants/colors";
import { ArrowRight, Clock } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

const CATEGORIES = [
  "Tous", "Guide", "Marché", "Investissement", "Juridique",
  "Quartiers", "Conseils", "Financement", "Rénovation", "Commercial",
];

export default function BlogListScreen() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const pageBg   = isDark ? Colors.dark.background : Colors.backgroundAlt;
  const cardBg   = isDark ? Colors.dark.card       : Colors.white;
  const borderC  = isDark ? Colors.dark.border      : Colors.border;
  const textMain = isDark ? Colors.dark.foreground  : Colors.foreground;
  const textMut  = isDark ? Colors.dark.mutedFg     : Colors.mutedFg;
  const accentBg = isDark ? Colors.dark.accent      : Colors.accent;
  const iconC    = isDark ? Colors.dark.primary     : Colors.primary;
  const chipBg   = isDark ? Colors.dark.muted       : Colors.white;

  const [category,     setCategory]     = useState("Tous");
  const [visibleCount, setVisibleCount] = useState(6);

  const all      = getAllArticles();
  const filtered = category === "Tous" ? all : all.filter(a => a.category === category);
  const visible  = filtered.slice(0, visibleCount);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: pageBg }} edges={["top"]}>
      <FlatList
        data={visible}
        keyExtractor={a => a.slug}
        style={{ backgroundColor: pageBg }}
        ListHeaderComponent={
          <>
            {/* Featured article */}
            <TouchableOpacity
              onPress={() => router.push(`/blog/${featuredArticle.slug}` as any)}
              style={{ marginHorizontal: 16, marginTop: 16, marginBottom: 16, borderRadius: 20, overflow: "hidden" }}
            >
              <LinearGradient
                colors={isDark ? [Colors.dark.navy, "#112234"] : [Colors.navy, "#1a3a6b"]}
                style={{ padding: 20 }}
              >
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
                  <View style={{ backgroundColor: "rgba(212,175,55,0.2)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
                    <Text style={{ color: Colors.secondary, fontSize: 11, fontFamily: "DMSans_500Medium" }}>
                      {featuredArticle.category}
                    </Text>
                  </View>
                  <View style={{ backgroundColor: Colors.secondary, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
                    <Text style={{ color: Colors.navy, fontSize: 11, fontFamily: "DMSans_600SemiBold" }}>
                      {featuredArticle.tag}
                    </Text>
                  </View>
                </View>
                <Text style={{ color: "#fff", fontSize: 18, fontFamily: "DMSans_700Bold", lineHeight: 24, marginBottom: 8 }}>
                  {featuredArticle.title}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, lineHeight: 19, marginBottom: 14 }} numberOfLines={2}>
                  {featuredArticle.excerpt}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                    <Clock size={12} color="rgba(255,255,255,0.55)" />
                    <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>{featuredArticle.readTime}</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Text style={{ color: Colors.secondary, fontSize: 13, fontFamily: "DMSans_500Medium" }}>Lire</Text>
                    <ArrowRight size={13} color={Colors.secondary} />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Category filter chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 12 }}
            >
              {CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => { setCategory(c); setVisibleCount(6); }}
                  style={{
                    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                    borderWidth: 1.5,
                    backgroundColor: category === c ? iconC : chipBg,
                    borderColor:     category === c ? iconC : borderC,
                  }}
                >
                  <Text style={{
                    fontSize: 13,
                    fontFamily: "DMSans_500Medium",
                    color: category === c ? "#fff" : textMut,
                  }}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/blog/${item.slug}` as any)}
            style={{
              backgroundColor: cardBg,
              borderWidth: 1, borderColor: borderC,
              borderRadius: 16,
              marginHorizontal: 16, marginBottom: 12,
              padding: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: isDark ? 0.2 : 0.05,
              shadowRadius: 4,
              elevation: 1,
            }}
          >
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <View style={{ backgroundColor: accentBg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
                <Text style={{ color: iconC, fontSize: 11, fontFamily: "DMSans_500Medium" }}>{item.category}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Clock size={11} color={textMut} />
                <Text style={{ color: textMut, fontSize: 11 }}>{item.readTime}</Text>
              </View>
            </View>
            <Text style={{ color: textMain, fontFamily: "DMSans_600SemiBold", fontSize: 15, lineHeight: 21, marginBottom: 4 }} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={{ color: textMut, fontSize: 13, lineHeight: 19 }} numberOfLines={2}>
              {item.excerpt}
            </Text>
            <Text style={{ color: textMut, fontSize: 11, marginTop: 8 }}>{item.date}</Text>
          </TouchableOpacity>
        )}
        ListFooterComponent={
          visibleCount < filtered.length ? (
            <TouchableOpacity
              onPress={() => setVisibleCount(v => v + 6)}
              style={{ marginHorizontal: 16, marginBottom: 32, backgroundColor: cardBg, borderWidth: 1, borderColor: borderC, borderRadius: 14, paddingVertical: 14, alignItems: "center" }}
            >
              <Text style={{ color: iconC, fontFamily: "DMSans_600SemiBold", fontSize: 14 }}>Voir plus</Text>
            </TouchableOpacity>
          ) : <View style={{ height: 32 }} />
        }
      />
    </SafeAreaView>
  );
}
