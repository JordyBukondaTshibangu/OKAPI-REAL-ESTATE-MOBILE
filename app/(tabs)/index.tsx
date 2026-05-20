import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Home,
  Sparkles,
  TreePine,
} from "lucide-react-native";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PropertyCard from "../../src/components/property/PropertyCard";
import Button from "../../src/components/ui/Button";
import Loader from "../../src/components/ui/Loader";
import { Colors } from "../../src/constants/colors";
import { blogPosts } from "../../src/lib/blog";
import { fetchProperties } from "../../src/services/properties";

const BUTTON_SHADOW = {
  shadowColor: "#000",
  shadowOpacity: 0.18,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
} as const;

const QUARTIERS = [
  "Gombe",
  "Ngaliema",
  "Limete",
  "Kintambo",
  "Lemba",
  "Bandalungwa",
  "Mont-Ngafula",
  "Lingwala",
];

const CATEGORIES = [
  { label: "Appartements", value: "apartment", Icon: Building2 },
  { label: "Villas", value: "villa", Icon: Home },
  { label: "Maisons", value: "townhouse", Icon: TreePine },
  { label: "Studios", value: "studio", Icon: Home },
  { label: "Commercial", value: "office", Icon: Briefcase },
];

export default function HomeScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ["properties", "home"],
    queryFn: () => fetchProperties({ limit: 4 }),
  });

  const featured = data?.data ?? [];

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors.backgroundAlt }}
      edges={["top"]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient
          colors={[Colors.navy, "#132E5E"]}
          className="rounded-b-3xl"
          style={{ paddingHorizontal: 24, paddingTop: 48, paddingBottom: 44 }}
        >
          <Text
            className="text-white text-3xl font-sans-bold"
            style={{ lineHeight: 36 }}
          >
            Trouvez votre bien{"\n"}idéal à Kinshasa
          </Text>
          <Text
            className="text-white/70 text-sm mt-3 mb-7"
            style={{ lineHeight: 20 }}
          >
            Des milliers de biens à vendre et à louer, gérés par des agents
            certifiés.
          </Text>
          <View className="flex-row gap-3">
            <Button
              variant="default"
              onPress={() => router.push("/(tabs)/acheter")}
              style={{ flex: 1, ...BUTTON_SHADOW }}
            >
              Acheter
            </Button>
            <Button
              variant="gold"
              onPress={() => router.push("/(tabs)/louer")}
              style={{ flex: 1, ...BUTTON_SHADOW }}
            >
              Louer
            </Button>
          </View>
        </LinearGradient>

        {/* Category chips */}
        <View className="px-5 py-4">
          <Text className="text-text-dark text-lg font-sans-bold mb-3">
            Explorer par type
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10 }}
          >
            {CATEGORIES.map(({ label, value, Icon }) => (
              <TouchableOpacity
                key={value}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/acheter",
                    params: { category: value },
                  } as any)
                }
                className="items-center gap-1.5 bg-white border border-border rounded-2xl px-4 py-3"
                style={{ minWidth: 80 }}
              >
                <Icon size={20} color={Colors.primary} />
                <Text className="text-xs text-text-dark font-sans-medium text-center">
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured properties */}
        <View className="px-5">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-text-dark text-lg font-sans-bold">
              Biens en vedette
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/acheter")}
              className="flex-row items-center gap-1"
            >
              <Text className="text-primary text-sm">Voir plus</Text>
              <ArrowRight size={14} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          {isLoading ? (
            <Loader />
          ) : (
            featured.map((p) => <PropertyCard key={p.id} property={p} />)
          )}
        </View>

        {/* Quartiers */}
        <View className="px-5 py-4">
          <Text className="text-text-dark text-lg font-sans-bold mb-3">
            Explorer par quartier
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {QUARTIERS.map((q) => (
              <TouchableOpacity
                key={q}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/acheter",
                    params: { suburb: q },
                  } as any)
                }
                className="bg-white border border-border rounded-full px-4 py-2"
              >
                <Text className="text-text-dark text-sm">{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* SuperAgent promo */}
        <View
          className="mx-5 mb-4"
          style={{
            borderRadius: 16,
            shadowColor: Colors.navy,
            shadowOpacity: 0.18,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 6 },
            elevation: 5,
          }}
        >
          <LinearGradient
            colors={[Colors.navy, "#1a3a6b"]}
            className="rounded-2xl"
            style={{ overflow: "hidden", paddingHorizontal: 24, paddingVertical: 28 }}
          >
            <View className="flex-row items-center gap-2.5 mb-1.5">
              <View
                className="items-center justify-center rounded-full"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "rgba(212,175,55,0.18)",
                }}
              >
                <Sparkles size={17} color={Colors.secondary} />
              </View>
              <Text className="text-white text-lg font-sans-bold">
                Besoin d'un expert ?
              </Text>
            </View>
            <Text
              className="text-white/70 text-sm mb-4"
              style={{ lineHeight: 20 }}
            >
              Nos SuperAgents connaissent chaque quartier de Kinshasa.
            </Text>
            <Button
              variant="gold"
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/agents",
                  params: { title: "SUPERAGENT" },
                } as any)
              }
            >
              Trouver un SuperAgent
            </Button>
          </LinearGradient>
        </View>

        {/* Blog preview */}
        <View className="px-5 pb-8">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-text-dark text-lg font-sans-bold">
              Derniers articles
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/blog/index" as any)}
              className="flex-row items-center gap-1"
            >
              <Text className="text-primary text-sm">Voir le blog</Text>
              <ArrowRight size={14} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          {blogPosts.slice(0, 2).map((post) => (
            <TouchableOpacity
              key={post.slug}
              onPress={() => router.push(`/blog/${post.slug}` as any)}
              className="bg-white border border-border rounded-2xl p-4 mb-3"
            >
              <View className="flex-row gap-2 mb-2">
                <View className="bg-accent rounded-full px-2.5 py-0.5">
                  <Text className="text-primary text-xs font-sans-medium">
                    {post.category}
                  </Text>
                </View>
                <Text className="text-muted-fg text-xs">{post.readTime}</Text>
              </View>
              <Text
                className="text-text-dark font-sans-semibold"
                numberOfLines={2}
              >
                {post.title}
              </Text>
              <Text className="text-muted-fg text-xs mt-1" numberOfLines={2}>
                {post.excerpt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
