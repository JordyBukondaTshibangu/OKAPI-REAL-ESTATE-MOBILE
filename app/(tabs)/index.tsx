import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  ArrowRight, Briefcase, Building2, Home,
  Sparkles, TreePine, TrendingUp, Users, CheckCircle,
  ShoppingBag, Warehouse, Map,
} from "lucide-react-native";
import React from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SectionReveal from "../../src/components/layout/SectionReveal";
import PropertyCard from "../../src/components/property/PropertyCard";
import PropertyCardHorizontal from "../../src/components/property/PropertyCardHorizontal";
import { useFavouriteIds } from "../../src/hooks/useFavouriteIds";
import LanguageSwitcher from "../../src/components/ui/LanguageSwitcher";
import Loader from "../../src/components/ui/Loader";
import ThemeToggle from "../../src/components/ui/ThemeToggle";
import Button from "../../src/components/ui/Button";
import { Colors } from "../../src/constants/colors";
import { useT } from "../../src/i18n/useT";
import { useThemeStore } from "../../src/store/useThemeStore";
import { blogPosts } from "../../src/lib/blog";
import { fetchProperties } from "../../src/services/properties";
import { fetchAgents } from "../../src/services/agents";
import { formatStatCount } from "../../src/lib/format";

const QUARTIERS = [
  "Gombe", "Ngaliema", "Limete", "Kintambo",
  "Lemba", "Bandalungwa", "Mont-Ngafula", "Lingwala",
];

// Fallbacks shown until live totals are loaded (or if the API doesn't return a count).
const FALLBACK_PROPERTIES_STAT = "2 400+";
const FALLBACK_AGENTS_STAT = "180+";
const SATISFACTION_STAT = "98%";

function extractTotal(meta: any): number | null {
  const total = meta?.total ?? meta?.totalCount ?? meta?.totalItems ?? meta?.count;
  return typeof total === "number" ? total : null;
}

const BUTTON_SHADOW = {
  shadowColor: "#000",
  shadowOpacity: 0.22,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },
  elevation: 4,
} as const;

interface CategorySliderProps {
  label: string;
  category: string;
  Icon: React.ComponentType<{ size: number; color: string }>;
  seeAll: string;
}

function CategorySlider({ label, category, Icon, seeAll }: CategorySliderProps) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const textMain  = isDark ? Colors.dark.foreground : Colors.foreground;
  const iconColor = isDark ? Colors.dark.primary : Colors.primary;
  const iconBg    = isDark ? Colors.dark.accent : Colors.accent;

  const { data, isLoading } = useQuery({
    queryKey: ["properties", "category", category],
    queryFn: () => fetchProperties({ category, limit: 8 }),
  });

  const items = data?.data ?? [];

  if (!isLoading && items.length === 0) return null;

  return (
    <View style={{ paddingTop: 24 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: iconBg, alignItems: "center", justifyContent: "center" }}>
            <Icon size={16} color={iconColor} />
          </View>
          <Text style={{ color: textMain, fontSize: 16, fontFamily: "DMSans_700Bold" }}>{label}</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push({ pathname: "/(tabs)/acheter", params: { category } } as any)}
          style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
        >
          <Text style={{ color: iconColor, fontSize: 13, fontFamily: "DMSans_500Medium" }}>{seeAll}</Text>
          <ArrowRight size={14} color={iconColor} />
        </TouchableOpacity>
      </View>
      {isLoading ? (
        <Loader />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 20 }}>
          {items.map((p) => <PropertyCardHorizontal key={p.id} property={p} />)}
        </ScrollView>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const t = useT();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const favouriteIds = useFavouriteIds();

  const { data, isLoading } = useQuery({
    queryKey: ["properties", "home"],
    queryFn: () => fetchProperties({ limit: 4 }),
  });

  const { data: propertiesMeta } = useQuery({
    queryKey: ["properties", "total"],
    queryFn: () => fetchProperties({ limit: 1 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: agentsMeta } = useQuery({
    queryKey: ["agents", "total"],
    queryFn: () => fetchAgents({ limit: 1 }),
    staleTime: 5 * 60 * 1000,
  });

  const propertiesTotal = extractTotal(propertiesMeta?.meta);
  const agentsTotal = extractTotal(agentsMeta?.meta);

  const CATEGORIES = [
    { label: t.home.categories.apartments, value: "apartment", Icon: Building2 },
    { label: t.home.categories.villas,     value: "villa",      Icon: Home },
    { label: t.home.categories.houses,     value: "townhouse",  Icon: TreePine },
    { label: t.home.categories.studios,    value: "studio",     Icon: Home },
    { label: t.home.categories.commercial, value: "office",     Icon: Briefcase },
  ];

  const SLIDER_CATEGORIES = [
    { label: t.home.categories.offices,    value: "office",    Icon: Briefcase },
    { label: t.home.categories.land,       value: "land",      Icon: Map },
    { label: t.home.categories.retail,     value: "retail",    Icon: ShoppingBag },
    { label: t.home.categories.warehouses, value: "warehouse", Icon: Warehouse },
  ];

  const STATS = [
    {
      value: propertiesTotal !== null ? formatStatCount(propertiesTotal, 100) : FALLBACK_PROPERTIES_STAT,
      label: t.home.statProperties, Icon: Building2,
    },
    {
      value: agentsTotal !== null ? formatStatCount(agentsTotal, 10) : FALLBACK_AGENTS_STAT,
      label: t.home.statAgents, Icon: Users,
    },
    { value: SATISFACTION_STAT, label: t.home.statSatisfied, Icon: CheckCircle },
  ];

  const featured = data?.data ?? [];
  const bgColor   = isDark ? Colors.dark.background : Colors.backgroundAlt;
  const cardBg    = isDark ? Colors.dark.card : Colors.white;
  const borderC   = isDark ? Colors.dark.border : Colors.border;
  const textMain  = isDark ? Colors.dark.foreground : Colors.foreground;
  const textMuted = isDark ? Colors.dark.mutedFg : Colors.mutedFg;
  const iconColor = isDark ? Colors.dark.primary : Colors.primary;
  const iconBg    = isDark ? Colors.dark.accent : Colors.accent;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ─── Hero ─────────────────────────────────────────── */}
        <LinearGradient
          colors={isDark ? [Colors.dark.navy, "#0f2040"] : [Colors.navy, "#132E5E"]}
          style={{ borderBottomLeftRadius: 28, borderBottomRightRadius: 28, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 36 }}
        >
          {/* Top row */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 10, marginBottom: 24 }}>
            <LanguageSwitcher />
            <ThemeToggle />
          </View>

          {/* Headline */}
          <Text style={{ color: Colors.secondary, fontSize: 12, fontFamily: "DMSans_600SemiBold", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>
            Kinshasa · RDC
          </Text>
          <Text style={{ color: "#FFFFFF", fontSize: 32, fontFamily: "DMSans_700Bold", lineHeight: 38, marginBottom: 10 }}>
            {t.hero.title}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, marginBottom: 24, lineHeight: 20 }}>
            {t.hero.subtitle}
          </Text>

          {/* Search input */}
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/acheter")}
            activeOpacity={0.9}
            style={{
              flexDirection: "row", alignItems: "center", gap: 10,
              backgroundColor: "rgba(255,255,255,0.12)",
              borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
              borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
              marginBottom: 20,
            }}
          >
            <Home size={16} color="rgba(255,255,255,0.6)" />
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, fontFamily: "DMSans_400Regular", flex: 1 }}>
              {t.hero.searchPlaceholder}
            </Text>
          </TouchableOpacity>

          {/* CTA buttons */}
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Button variant="default" onPress={() => router.push("/(tabs)/acheter")} style={{ flex: 1, ...BUTTON_SHADOW }}>
              {t.hero.buyTab}
            </Button>
            <Button variant="gold" onPress={() => router.push("/(tabs)/louer")} style={{ flex: 1, ...BUTTON_SHADOW }}>
              {t.hero.rentTab}
            </Button>
          </View>
        </LinearGradient>

        {/* ─── Stats bar ────────────────────────────────────── */}
        <SectionReveal delay={0}>
          <View style={{ flexDirection: "row", marginHorizontal: 16, marginTop: 16, marginBottom: 4, borderRadius: 16, backgroundColor: cardBg, borderWidth: 1, borderColor: borderC, overflow: "hidden" }}>
            {STATS.map((s, i) => (
              <View
                key={s.label}
                style={{
                  flex: 1, alignItems: "center", paddingVertical: 14,
                  borderLeftWidth: i > 0 ? 1 : 0,
                  borderLeftColor: borderC,
                }}
              >
                <Text style={{ color: iconColor, fontSize: 18, fontFamily: "DMSans_700Bold" }}>{s.value}</Text>
                <Text style={{ color: textMuted, fontSize: 11, fontFamily: "DMSans_400Regular", marginTop: 2 }}>{s.label}</Text>
              </View>
            ))}
          </View>
        </SectionReveal>

        {/* ─── Category chips ───────────────────────────────── */}
        <SectionReveal delay={40}>
          <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 }}>
            <Text style={{ color: textMain, fontSize: 18, fontFamily: "DMSans_700Bold", marginBottom: 14 }}>
              {t.home.exploreByType}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {CATEGORIES.map(({ label, value, Icon }) => (
                <TouchableOpacity
                  key={value}
                  onPress={() => router.push({ pathname: "/(tabs)/acheter", params: { category: value } } as any)}
                  style={{
                    alignItems: "center", gap: 8,
                    backgroundColor: cardBg,
                    borderWidth: 1, borderColor: borderC,
                    borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14,
                    minWidth: 90,
                  }}
                >
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: iconBg, alignItems: "center", justifyContent: "center" }}>
                    <Icon size={22} color={iconColor} />
                  </View>
                  <Text style={{ fontSize: 12, color: textMain, fontFamily: "DMSans_500Medium", textAlign: "center" }}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </SectionReveal>

        {/* ─── Featured properties ──────────────────────────── */}
        <SectionReveal delay={80}>
          <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <View>
                <Text style={{ color: textMain, fontSize: 18, fontFamily: "DMSans_700Bold" }}>
                  {t.home.featuredProperties}
                </Text>
                <Text style={{ color: textMuted, fontSize: 12, marginTop: 2 }}>{t.home.selectedForYou}</Text>
              </View>
              <TouchableOpacity onPress={() => router.push("/(tabs)/acheter")} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={{ color: iconColor, fontSize: 13, fontFamily: "DMSans_500Medium" }}>{t.home.seeMore}</Text>
                <ArrowRight size={14} color={iconColor} />
              </TouchableOpacity>
            </View>
            {isLoading ? <Loader /> : featured.map((p) => <PropertyCard key={p.id} property={p} isFavourite={favouriteIds.has(p.id)} />)}
          </View>
        </SectionReveal>

        {/* ─── Catégories (sliders horizontaux) ───────────────── */}
        <SectionReveal delay={100}>
          <View>
            {SLIDER_CATEGORIES.map(({ label, value, Icon }) => (
              <CategorySlider key={value} label={label} category={value} Icon={Icon} seeAll={t.home.seeAll} />
            ))}
          </View>
        </SectionReveal>

        {/* ─── Quartiers ────────────────────────────────────── */}
        <SectionReveal delay={120}>
          <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
            <Text style={{ color: textMain, fontSize: 18, fontFamily: "DMSans_700Bold", marginBottom: 14 }}>
              {t.home.regions}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {QUARTIERS.map((q) => (
                <TouchableOpacity
                  key={q}
                  onPress={() => router.push({ pathname: "/(tabs)/acheter", params: { suburb: q } } as any)}
                  style={{
                    backgroundColor: cardBg,
                    borderWidth: 1, borderColor: borderC,
                    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 9,
                  }}
                >
                  <Text style={{ color: textMain, fontSize: 13, fontFamily: "DMSans_400Regular" }}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </SectionReveal>

        {/* ─── SuperAgent banner ────────────────────────────── */}
        <SectionReveal delay={160}>
          <View style={{ marginHorizontal: 20, marginTop: 20, marginBottom: 4, borderRadius: 20, overflow: "hidden", shadowColor: Colors.navy, shadowOpacity: 0.2, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 5 }}>
            <LinearGradient
              colors={isDark ? [Colors.dark.navy, "#112234"] : [Colors.navy, "#1a3a6b"]}
              style={{ paddingHorizontal: 24, paddingVertical: 24 }}
            >
              {/* Icon + title */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(212,175,55,0.2)", alignItems: "center", justifyContent: "center" }}>
                  <Sparkles size={18} color={Colors.secondary} />
                </View>
                <Text style={{ color: "#FFFFFF", fontSize: 18, fontFamily: "DMSans_700Bold" }}>{t.home.expertTitle}</Text>
              </View>
              <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, marginBottom: 20, lineHeight: 20 }}>
                {t.home.expertDesc}
              </Text>

              {/* Trust signals */}
              <View style={{ flexDirection: "row", gap: 16, marginBottom: 20 }}>
                {[t.home.trustCertified, t.home.trustReactive, t.home.trustLocal].map((tag) => (
                  <View key={tag} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                    <CheckCircle size={13} color={Colors.secondary} />
                    <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontFamily: "DMSans_400Regular" }}>{tag}</Text>
                  </View>
                ))}
              </View>

              <Button variant="gold" onPress={() => router.push({ pathname: "/(tabs)/agents", params: { title: "SUPERAGENT" } } as any)}>
                {t.home.findAgent}
              </Button>
            </LinearGradient>
          </View>
        </SectionReveal>

        {/* ─── Invest CTA ───────────────────────────────────── */}
        <SectionReveal delay={180}>
          <View style={{ marginHorizontal: 20, marginTop: 16, marginBottom: 4, borderRadius: 16, backgroundColor: cardBg, borderWidth: 1, borderColor: borderC, padding: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isDark ? "rgba(90,165,232,0.15)" : "#EAF2FB", alignItems: "center", justifyContent: "center" }}>
                <TrendingUp size={18} color={iconColor} />
              </View>
              <Text style={{ color: textMain, fontSize: 16, fontFamily: "DMSans_700Bold" }}>{t.home.investTitle}</Text>
            </View>
            <Text style={{ color: textMuted, fontSize: 13, lineHeight: 20, marginBottom: 14 }}>
              {t.home.investDesc}
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/acheter")}
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Text style={{ color: iconColor, fontFamily: "DMSans_600SemiBold", fontSize: 14 }}>{t.home.investCta}</Text>
              <ArrowRight size={14} color={iconColor} />
            </TouchableOpacity>
          </View>
        </SectionReveal>

        {/* ─── Blog preview ─────────────────────────────────── */}
        <SectionReveal delay={220}>
          <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <Text style={{ color: textMain, fontSize: 18, fontFamily: "DMSans_700Bold" }}>
                {t.home.blogPreview}
              </Text>
              <TouchableOpacity onPress={() => router.push("/blog/index" as any)} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={{ color: iconColor, fontSize: 13, fontFamily: "DMSans_500Medium" }}>{t.home.seeBlog}</Text>
                <ArrowRight size={14} color={iconColor} />
              </TouchableOpacity>
            </View>
            {blogPosts.slice(0, 2).map((post) => (
              <TouchableOpacity
                key={post.slug}
                onPress={() => router.push(`/blog/${post.slug}` as any)}
                style={{
                  backgroundColor: cardBg,
                  borderWidth: 1, borderColor: borderC,
                  borderRadius: 16, padding: 16, marginBottom: 12,
                }}
              >
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 8, alignItems: "center" }}>
                  <View style={{ backgroundColor: iconBg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
                    <Text style={{ color: iconColor, fontSize: 11, fontFamily: "DMSans_500Medium" }}>{post.category}</Text>
                  </View>
                  <Text style={{ color: textMuted, fontSize: 11 }}>{post.readTime}</Text>
                </View>
                <Text style={{ color: textMain, fontFamily: "DMSans_600SemiBold", fontSize: 14, lineHeight: 20 }} numberOfLines={2}>
                  {post.title}
                </Text>
                <Text style={{ color: textMuted, fontSize: 12, marginTop: 4, lineHeight: 18 }} numberOfLines={2}>
                  {post.excerpt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SectionReveal>

      </ScrollView>
    </SafeAreaView>
  );
}
