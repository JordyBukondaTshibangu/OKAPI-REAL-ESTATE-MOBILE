import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { featuredArticle, blogPosts, getAllArticles } from "../../src/lib/blog";
import { Colors } from "../../src/constants/colors";
import { ArrowRight, Clock } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

const CATEGORIES = ["Tous", "Guide", "Marché", "Investissement", "Juridique", "Quartiers", "Conseils", "Financement", "Rénovation", "Commercial"];

export default function BlogListScreen() {
  const [category, setCategory] = useState("Tous");
  const [visibleCount, setVisibleCount] = useState(6);

  const all = getAllArticles();
  const filtered = category === "Tous" ? all : all.filter(a => a.category === category);
  const visible = filtered.slice(0, visibleCount);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.backgroundAlt }} edges={["top"]}>
      <FlatList
        data={visible}
        keyExtractor={a => a.slug}
        ListHeaderComponent={
          <>
            {/* Featured */}
            <TouchableOpacity onPress={() => router.push(`/blog/${featuredArticle.slug}` as any)} className="mx-4 mt-4 mb-4">
              <LinearGradient colors={[Colors.navy, "#1a3a6b"]} className="rounded-2xl p-5">
                <View className="flex-row gap-2 mb-2">
                  <View className="bg-secondary/20 rounded-full px-2.5 py-0.5">
                    <Text className="text-secondary text-xs font-sans-medium">{featuredArticle.category}</Text>
                  </View>
                  <View className="bg-secondary rounded-full px-2.5 py-0.5">
                    <Text className="text-navy text-xs font-sans-medium">{featuredArticle.tag}</Text>
                  </View>
                </View>
                <Text className="text-white text-lg font-sans-bold mb-2">{featuredArticle.title}</Text>
                <Text className="text-white/70 text-sm mb-3" numberOfLines={2}>{featuredArticle.excerpt}</Text>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-1">
                    <Clock size={12} color="rgba(255,255,255,0.6)" />
                    <Text className="text-white/60 text-xs">{featuredArticle.readTime}</Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Text className="text-secondary text-xs">Lire</Text>
                    <ArrowRight size={12} color={Colors.secondary} />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Category filters */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 8 }}>
              {CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => { setCategory(c); setVisibleCount(6); }}
                  className={`px-4 py-2 rounded-full border ${category === c ? "bg-primary border-primary" : "bg-white border-border"}`}
                >
                  <Text className={`text-sm font-sans-medium ${category === c ? "text-white" : "text-muted-fg"}`}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/blog/${item.slug}` as any)}
            className="bg-white border border-border rounded-2xl mx-4 mb-3 p-4"
            style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 }}
          >
            <View className="flex-row gap-2 mb-2">
              <View className="bg-accent rounded-full px-2.5 py-0.5">
                <Text className="text-primary text-xs font-sans-medium">{item.category}</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Clock size={11} color={Colors.mutedFg} />
                <Text className="text-muted-fg text-xs">{item.readTime}</Text>
              </View>
            </View>
            <Text className="text-text-dark font-sans-semibold mb-1" numberOfLines={2}>{item.title}</Text>
            <Text className="text-muted-fg text-sm" numberOfLines={2}>{item.excerpt}</Text>
            <Text className="text-muted-fg text-xs mt-2">{item.date}</Text>
          </TouchableOpacity>
        )}
        ListFooterComponent={
          visibleCount < filtered.length ? (
            <TouchableOpacity onPress={() => setVisibleCount(v => v + 6)} className="mx-4 mb-8 bg-white border border-border rounded-2xl py-3 items-center">
              <Text className="text-primary font-sans-medium">Voir plus</Text>
            </TouchableOpacity>
          ) : <View style={{ height: 32 }} />
        }
      />
    </SafeAreaView>
  );
}
