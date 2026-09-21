import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  ArrowRight, Briefcase, Building2, Home,
  Sparkles, TreePine, TrendingUp, Users, CheckCircle,
  ShoppingBag, Warehouse, Map, Moon, Star, CreditCard,
} from "lucide-react-native";
import React, { useRef, useEffect, useState } from "react";
import { Animated, Dimensions, Easing, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
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
import { useAgentSessionStore } from "../../src/store/useAgentSessionStore";
import { blogPosts } from "../../src/lib/blog";
import { fetchProperties } from "../../src/services/properties";
import { fetchAgents } from "../../src/services/agents";
import { formatStatCount, formatPrice } from "../../src/lib/format";
import { API_URL } from "../../src/constants/api";

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

// ─── Infinite auto-scroll carousel for short-term cards ─────────────────
const CARD_W = 200;
const CARD_GAP = 12;

function AutoScrollRow({ items }: { items: ReturnType<typeof Array.prototype.map> }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const singleSetWidth = items.length * (CARD_W + CARD_GAP);

  useEffect(() => {
    if (items.length === 0) return;
    const anim = Animated.loop(
      Animated.timing(translateX, {
        toValue: -singleSetWidth,
        duration: items.length * 2800,   // ~2.8 s per card — tweak for speed
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [singleSetWidth, items.length]);

  const doubled = [...items, ...items]; // duplicate for seamless loop

  return (
    <View style={{ overflow: "hidden", paddingTop: 18 }}>
      <Animated.View style={{ flexDirection: "row", transform: [{ translateX }] }}>
        {doubled.map((p: any, i: number) => (
          <View key={`${p.id}-${i}`} style={{ marginRight: CARD_GAP }}>
            <PropertyCardHorizontal property={p} />
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

// ─── Mixed-height feed ───────────────────────────────────────────────────
// Renders featured properties in alternating rhythms so the eye keeps moving:
//   [0]     → large full-width card  (tall photo, full detail)
//   [1,2]   → two small cards side by side
//   [3]     → standard PropertyCard
//   repeat

const { width: SCREEN_W } = Dimensions.get("window");
const SMALL_CARD_W = (SCREEN_W - 40 - 8) / 2; // two cards + gap inside 20px padding

function LargeCard({ property, isDark }: { property: any; isDark: boolean }) {
  const cardBg   = isDark ? Colors.dark.card    : Colors.white;
  const border   = isDark ? Colors.dark.border  : Colors.border;
  const textMain = isDark ? Colors.dark.foreground : "#1a2538";
  const textMuted = isDark ? Colors.dark.mutedFg  : Colors.mutedFg;
  const imageUri = property.gallery?.[0]
    ? property.gallery[0].startsWith("http") ? property.gallery[0] : `${API_URL}/${property.gallery[0].replace(/^\/+/, "")}`
    : null;
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={() => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 60, bounciness: 0 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 25, bounciness: 5 }).start()}
      onPress={() => router.push(`/property/${property.id}` as any)}
      style={{ backgroundColor: cardBg, borderRadius: 18, borderWidth: 1, borderColor: border, overflow: "hidden", marginBottom: 12, shadowColor: "#000", shadowOpacity: isDark ? 0.3 : 0.09, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 }}
    >
      <View style={{ height: 240, position: "relative" }}>
        {imageUri
          ? <Image source={{ uri: imageUri }} style={{ width: "100%", height: 240 }} contentFit="cover" />
          : <View style={{ height: 240, backgroundColor: isDark ? "#1a2733" : "#EAF2FB", alignItems: "center", justifyContent: "center" }}><Building2 size={50} color="#a8c5da" /></View>}
        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 100 }}>
          <View style={{ position: "absolute", bottom: 12, left: 14, right: 14, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
            <View style={{ backgroundColor: "rgba(10,25,50,0.78)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
              <Text style={{ color: "#fff", fontSize: 18, fontFamily: "DMSans_700Bold" }}>{formatPrice(property.price, property.currency, property.period)}</Text>
              <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 }}>{property.suburb}</Text>
            </View>
            {property.verified && (
              <View style={{ backgroundColor: "#d1fae5", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4, flexDirection: "row", alignItems: "center", gap: 4 }}>
                <CheckCircle size={11} color="#065f46" />
                <Text style={{ fontSize: 10, color: "#065f46", fontFamily: "DMSans_600SemiBold" }}>Vérifié</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      <View style={{ padding: 14 }}>
        <Text style={{ color: textMain, fontSize: 15, fontFamily: "DMSans_600SemiBold" }} numberOfLines={1}>{property.title}</Text>
        <Text style={{ color: textMuted, fontSize: 12, marginTop: 3 }}>{property.agent?.name}</Text>
      </View>
    </TouchableOpacity>
    </Animated.View>
  );
}

function SmallCard({ property, isDark }: { property: any; isDark: boolean }) {
  const cardBg   = isDark ? Colors.dark.card    : Colors.white;
  const border   = isDark ? Colors.dark.border  : Colors.border;
  const textMain = isDark ? Colors.dark.foreground : "#1a2538";
  const textMuted = isDark ? Colors.dark.mutedFg  : Colors.mutedFg;
  const imageUri = property.gallery?.[0]
    ? property.gallery[0].startsWith("http") ? property.gallery[0] : `${API_URL}/${property.gallery[0].replace(/^\/+/, "")}`
    : null;
  return (
    <TouchableOpacity
      onPress={() => router.push(`/property/${property.id}` as any)}
      activeOpacity={0.9}
      style={{ width: SMALL_CARD_W, backgroundColor: cardBg, borderRadius: 14, borderWidth: 1, borderColor: border, overflow: "hidden", shadowColor: "#000", shadowOpacity: isDark ? 0.22 : 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}
    >
      <View style={{ height: 120 }}>
        {imageUri
          ? <Image source={{ uri: imageUri }} style={{ width: "100%", height: 120 }} contentFit="cover" />
          : <View style={{ height: 120, backgroundColor: isDark ? "#1a2733" : "#EAF2FB", alignItems: "center", justifyContent: "center" }}><Building2 size={28} color="#a8c5da" /></View>}
      </View>
      <View style={{ padding: 10 }}>
        <Text style={{ color: textMain, fontSize: 13, fontFamily: "DMSans_700Bold" }} numberOfLines={1}>{formatPrice(property.price, property.currency, property.period)}</Text>
        <Text style={{ color: textMuted, fontSize: 11, marginTop: 2 }} numberOfLines={1}>{property.suburb}</Text>
      </View>
    </TouchableOpacity>
  );
}

function MixedFeed({ properties, isDark, isFavourite }: { properties: any[]; isDark: boolean; isFavourite: (id: string) => boolean }) {
  const rows: React.ReactNode[] = [];
  let i = 0;
  while (i < properties.length) {
    const pos = i % 4; // pattern repeats every 4
    if (pos === 0 && i < properties.length) {
      // Large featured card
      rows.push(<LargeCard key={properties[i].id} property={properties[i]} isDark={isDark} />);
      i++;
    } else if (pos === 1 && i + 1 < properties.length) {
      // Two small cards side by side
      rows.push(
        <View key={`duo-${i}`} style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <SmallCard property={properties[i]} isDark={isDark} />
          <SmallCard property={properties[i + 1]} isDark={isDark} />
        </View>
      );
      i += 2;
    } else if (pos === 1 && i < properties.length) {
      // Only one left for duo slot — render as standard
      rows.push(<PropertyCard key={properties[i].id} property={properties[i]} isFavourite={isFavourite(properties[i].id)} />);
      i++;
    } else {
      // Standard card
      rows.push(<PropertyCard key={properties[i].id} property={properties[i]} isFavourite={isFavourite(properties[i].id)} />);
      i++;
    }
  }
  return <>{rows}</>;
}

// ─── Typewriter text ─────────────────────────────────────────────────────
function TypewriterText({
  text,
  delay = 0,
  speed = 38,
  style,
  showCursor = true,
}: {
  text: string;
  delay?: number;
  speed?: number;
  style?: any;
  showCursor?: boolean;
}) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const cursorOpacity = useRef(new Animated.Value(1)).current;

  // cursor blink
  useEffect(() => {
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(cursorOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ])
    );
    blink.start();
    return () => blink.stop();
  }, []);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, delay, speed]);

  // Render an invisible copy of the full text first so the container
  // pre-reserves the final height — this prevents layout shifts while
  // characters are being typed one by one.
  return (
    <View>
      {/* Invisible placeholder — locks the height from the first frame */}
      <Text style={[style, { opacity: 0 }]} aria-hidden>{text}</Text>
      {/* Visible typewriter output — sits on top via negative margin */}
      <Text style={[style, { position: "absolute", top: 0, left: 0, right: 0 }]}>
        {displayed}
        {showCursor && !done && (
          <Animated.Text style={{ opacity: cursorOpacity }}>|</Animated.Text>
        )}
      </Text>
    </View>
  );
}

// ─── Short-term rental promo banner ──────────────────────────────────────
// Surfaces the short-term ("court terme") rental option, which otherwise
// only lives inside a filter chip on the Louer tab. Hides itself if there
// are currently no short-term listings, same as CategorySlider.
function ShortTermBanner() {
  const t = useT();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const { data, isLoading } = useQuery({
    queryKey: ["properties", "short-term", "home"],
    queryFn: () => fetchProperties({ isShortTerm: true, limit: 8 }),
  });

  const items = data?.data ?? [];

  return (
    <View style={{ marginHorizontal: 20, marginTop: 8, borderRadius: 20, overflow: "hidden", shadowColor: Colors.navy, shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 4 }}>
      <LinearGradient
        colors={isDark ? [Colors.dark.navy, "#1a2e47"] : [Colors.navy, "#2a4a8a"]}
        style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push({ pathname: "/(tabs)/acheter", params: { listingType: "rent", duration: "short" } } as any)}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(212,175,55,0.2)", alignItems: "center", justifyContent: "center" }}>
              <Moon size={18} color={Colors.secondary} />
            </View>
            <Text style={{ color: "#FFFFFF", fontSize: 17, fontFamily: "DMSans_700Bold", flex: 1 }}>
              {t.home.shortTermBannerTitle}
            </Text>
          </View>
          <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, lineHeight: 19, marginBottom: 14 }}>
            {t.home.shortTermBannerDesc}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: "rgba(212,175,55,0.16)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 }}>
            <Text style={{ color: Colors.secondary, fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>
              {t.home.shortTermBannerCta}
            </Text>
            <ArrowRight size={14} color={Colors.secondary} />
          </View>
        </TouchableOpacity>

        {isLoading ? (
          <Loader />
        ) : items.length > 0 ? (
          <AutoScrollRow items={items} />
        ) : null}
      </LinearGradient>
    </View>
  );
}

export default function HomeScreen() {
  const t = useT();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const { isAuthenticated: isAgentLoggedIn, agent: storeAgent } = useAgentSessionStore();
  const agentPlan = storeAgent?.plan ?? "FREE";
  const isAgencyOwner = storeAgent?.agentType === "AGENCY_OWNER";
  const isPaidPlan = agentPlan === "PRO" || agentPlan === "AGENCY";
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

          {/* Headline — typewriter reveal */}
          <TypewriterText
            text="Kinshasa · RDC"
            delay={200}
            speed={45}
            showCursor={false}
            style={{ color: Colors.secondary, fontSize: 12, fontFamily: "DMSans_600SemiBold", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}
          />
          <TypewriterText
            text={t.hero.title}
            delay={900}
            speed={32}
            showCursor={false}
            style={{ color: "#FFFFFF", fontSize: 32, fontFamily: "DMSans_700Bold", lineHeight: 38, marginBottom: 10 }}
          />
          <TypewriterText
            text={t.hero.subtitle}
            delay={900 + t.hero.title.length * 32 + 200}
            speed={22}
            showCursor={true}
            style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, marginBottom: 24, lineHeight: 20 }}
          />

          {/* Search input */}
          <TouchableOpacity
            onPress={() => router.push({ pathname: "/(tabs)/acheter", params: { listingType: "rent" } } as any)}
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
            <Button variant="gold" onPress={() => router.push({ pathname: "/(tabs)/acheter", params: { listingType: "rent" } } as any)} style={{ flex: 1, ...BUTTON_SHADOW }}>
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
              {/* Short-term quick-access chip - visually distinct (gold) since
                  it's a stay-duration filter, not a property type. */}
              <TouchableOpacity
                onPress={() => router.push({ pathname: "/(tabs)/acheter", params: { listingType: "rent", duration: "short" } } as any)}
                style={{
                  alignItems: "center", gap: 8,
                  backgroundColor: isDark ? "rgba(212,184,74,0.12)" : "#FCF6E3",
                  borderWidth: 1, borderColor: isDark ? "rgba(212,184,74,0.35)" : "#E9D8A0",
                  borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14,
                  minWidth: 90,
                }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.secondary, alignItems: "center", justifyContent: "center" }}>
                  <Moon size={22} color="#FFFFFF" />
                </View>
                <Text style={{ fontSize: 12, color: textMain, fontFamily: "DMSans_600SemiBold", textAlign: "center" }}>
                  {t.listing.filters.durationShortPill}
                </Text>
              </TouchableOpacity>
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

        {/* ─── Short-term rental promo ──────────────────────── */}
        <SectionReveal delay={60}>
          <ShortTermBanner />
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
            {isLoading ? <Loader /> : <MixedFeed properties={featured} isDark={isDark} isFavourite={(id) => favouriteIds.has(id)} />}
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

        {/* ─── Agent CTA ────────────────────────────────────── */}
        {!isAgentLoggedIn && (
          <SectionReveal delay={110}>
            <View style={{ marginHorizontal: 20, marginTop: 24, borderRadius: 20, overflow: "hidden", shadowColor: Colors.navy, shadowOpacity: 0.2, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 5 }}>
              <LinearGradient
                colors={isDark ? [Colors.dark.navy, "#112234"] : [Colors.navy, "#1a3a6b"]}
                style={{ paddingHorizontal: 22, paddingVertical: 22 }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(212,175,55,0.2)", alignItems: "center", justifyContent: "center" }}>
                    <Building2 size={18} color={Colors.secondary} />
                  </View>
                  <Text style={{ color: "#FFFFFF", fontSize: 16, fontFamily: "DMSans_700Bold", flex: 1 }}>
                    {t.home.agentCtaTitle}
                  </Text>
                </View>
                <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, lineHeight: 19, marginBottom: 18 }}>
                  {t.home.agentCtaDesc}
                </Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => router.push("/(auth)/agent-connexion" as any)}
                    style={{ flex: 1, height: 42, borderRadius: 12, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.4)", alignItems: "center", justifyContent: "center" }}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: "#FFFFFF", fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>{t.home.agentCtaSignIn}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => router.push("/(auth)/devenir-agent" as any)}
                    style={{ flex: 1, height: 42, borderRadius: 12, backgroundColor: Colors.secondary, alignItems: "center", justifyContent: "center" }}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: Colors.navy, fontSize: 13, fontFamily: "DMSans_700Bold" }}>{t.home.agentCtaSignUp}</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </SectionReveal>
        )}

        {/* ─── Subscription CTA (logged-in agents) ─────────── */}
        {isAgentLoggedIn && (
          <SectionReveal delay={115}>
            {isPaidPlan ? (
              /* Active plan badge */
              <View style={{ marginHorizontal: 20, marginTop: 16, borderRadius: 16, borderWidth: 1, borderColor: isDark ? "#2d4a1a" : "#BBF7D0", backgroundColor: isDark ? "#1a2a15" : "#F0FDF4", paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#dcfce7", alignItems: "center", justifyContent: "center" }}>
                  <Star size={18} color="#16a34a" fill="#16a34a" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontFamily: "DMSans_700Bold", color: isDark ? "#86efac" : "#15803d" }}>
                    {agentPlan === "AGENCY" ? "Plan Agence actif" : "Plan Pro actif"}
                  </Text>
                  <Text style={{ fontSize: 12, color: isDark ? "#4ade80" : "#16a34a", fontFamily: "DMSans_400Regular" }}>
                    Gérez votre abonnement depuis votre espace
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push(isAgencyOwner ? "/espace-agence/abonnement" : "/espace-agent/abonnement" as any)}
                  style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#16a34a" }}
                >
                  <Text style={{ color: "#16a34a", fontSize: 12, fontFamily: "DMSans_600SemiBold" }}>Gérer</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Upgrade CTA */
              <View style={{ marginHorizontal: 20, marginTop: 16, borderRadius: 20, overflow: "hidden", shadowColor: Colors.navy, shadowOpacity: 0.2, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 5 }}>
                <LinearGradient
                  colors={isDark ? ["#1a0a3d", "#0d1a2e"] : ["#0B1D3A", "#1a2e50"]}
                  style={{ paddingHorizontal: 22, paddingVertical: 20 }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(201,168,76,0.2)", alignItems: "center", justifyContent: "center" }}>
                      <Star size={18} color={Colors.secondary} fill={Colors.secondary} />
                    </View>
                    <Text style={{ color: "#FFFFFF", fontSize: 15, fontFamily: "DMSans_700Bold", flex: 1 }}>
                      {isAgencyOwner ? "Passez au Plan Agence" : "Passez au Plan Pro"}
                    </Text>
                  </View>
                  <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, lineHeight: 19, marginBottom: 16 }}>
                    {isAgencyOwner
                      ? "Gérez votre agence, recrutez des agents et accédez à des annonces illimitées."
                      : "Publiez plus d'annonces, boostez votre visibilité et accédez aux statistiques avancées."}
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push(isAgencyOwner ? "/espace-agence/abonnement" : "/espace-agent/abonnement" as any)}
                    style={{ backgroundColor: Colors.secondary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6 }}
                    activeOpacity={0.85}
                  >
                    <CreditCard size={15} color={Colors.navy} />
                    <Text style={{ color: Colors.navy, fontSize: 13, fontFamily: "DMSans_700Bold" }}>
                      {isAgencyOwner ? "Voir le plan Agence" : "Voir le plan Pro"}
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            )}
          </SectionReveal>
        )}

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
