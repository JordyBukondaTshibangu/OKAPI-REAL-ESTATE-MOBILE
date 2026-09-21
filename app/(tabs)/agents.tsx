import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Building2, ChevronRight, SlidersHorizontal, Star, Users, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EspaceAgentScreen from "../espace-agent/index";
import AgentCard from "../../src/components/agent/AgentCard";
import SearchBar from "../../src/components/property/SearchBar";
import EmptyState from "../../src/components/ui/EmptyState";
import Loader from "../../src/components/ui/Loader";
import { Colors } from "../../src/constants/colors";
import { KINSHASA_COMMUNES } from "../../src/constants/kinshasa";
import { useDebounce } from "../../src/hooks/useDebounce";
import { useT } from "../../src/i18n/useT";
import { fetchAgents } from "../../src/services/agents";
import { useThemeStore } from "../../src/store/useThemeStore";
import { useAgentSessionStore } from "../../src/store/useAgentSessionStore";

const PROPERTY_TYPES = [
  { key: "propTypeApartments", value: "APARTMENT" },
  { key: "propTypeVillas", value: "VILLA" },
  { key: "propTypeStudios", value: "STUDIO" },
  { key: "propTypeLand", value: "LAND" },
  { key: "propTypeOffices", value: "OFFICE" },
  { key: "propTypeWarehouses", value: "WAREHOUSE" },
] as const;

const RATING_OPTIONS = [
  { label: "4★+", value: 4 },
  { label: "3★+", value: 3 },
  { label: "2★+", value: 2 },
];

const LANGUAGES = ["Français", "English", "Lingala", "Swahili", "Kikongo"];

export default function AgentsScreen() {
  const t = useT();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const { isAuthenticated: isAgentLoggedIn } = useAgentSessionStore();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  // Filter state
  const [showFilter, setShowFilter] = useState(false);
  const [commune, setCommune] = useState<string | undefined>();
  const [propertyType, setPropertyType] = useState<string | undefined>();
  const [minRating, setMinRating] = useState<number | undefined>();
  const [language, setLanguage] = useState<string | undefined>();

  // Draft state (applied only on "Apply")
  const [draftCommune, setDraftCommune] = useState<string | undefined>();
  const [draftPropertyType, setDraftPropertyType] = useState<string | undefined>();
  const [draftMinRating, setDraftMinRating] = useState<number | undefined>();
  const [draftLanguage, setDraftLanguage] = useState<string | undefined>();

  const bgColor = isDark ? Colors.dark.background : Colors.backgroundAlt;
  const cardBg = isDark ? Colors.dark.card : Colors.white;
  const borderColor = isDark ? Colors.dark.border : Colors.border;
  const textMain = isDark ? Colors.dark.foreground : Colors.textDark;
  const textMuted = isDark ? Colors.dark.mutedFg : Colors.mutedFg;
  const primaryColor = isDark ? Colors.dark.primary : Colors.primary;
  const mutedBg = isDark ? Colors.dark.muted : "#F1F5F9";

  const activeFilterCount = [commune, propertyType, minRating, language].filter(Boolean).length;

  const {
    data: agentsData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["agents", debouncedSearch, commune, propertyType, minRating, language],
    queryFn: () =>
      fetchAgents({
        name: debouncedSearch || undefined,
        commune,
        propertyType,
        minRating,
        language,
      }),
  });

  const agents = agentsData?.data ?? [];

  const openFilter = () => {
    setDraftCommune(commune);
    setDraftPropertyType(propertyType);
    setDraftMinRating(minRating);
    setDraftLanguage(language);
    setShowFilter(true);
  };

  const applyFilter = () => {
    setCommune(draftCommune);
    setPropertyType(draftPropertyType);
    setMinRating(draftMinRating);
    setLanguage(draftLanguage);
    setShowFilter(false);
  };

  const resetFilter = () => {
    setDraftCommune(undefined);
    setDraftPropertyType(undefined);
    setDraftMinRating(undefined);
    setDraftLanguage(undefined);
    setCommune(undefined);
    setPropertyType(undefined);
    setMinRating(undefined);
    setLanguage(undefined);
    setShowFilter(false);
  };

  const clearAll = () => {
    setCommune(undefined);
    setPropertyType(undefined);
    setMinRating(undefined);
    setLanguage(undefined);
  };

  // Agents pressing the Boosts tab see their dashboard inline (keeps the tab bar).
  if (isAgentLoggedIn) return <EspaceAgentScreen showBackButton={false} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }} edges={["top"]}>
      {/* Header */}
      <View
        style={{
          backgroundColor: cardBg,
          borderBottomColor: borderColor,
          borderBottomWidth: 1,
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 16,
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            color: textMain,
            fontSize: 20,
            fontFamily: "DMSans_700Bold",
            marginBottom: 12,
          }}
        >
          {t.nav.agents}
        </Text>

        {/* Agences shortcut card */}
        <TouchableOpacity
          onPress={() => router.push("/agences" as any)}
          activeOpacity={0.85}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: isDark ? Colors.dark.muted : Colors.backgroundAlt,
            borderRadius: 14,
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderWidth: 1,
            borderColor,
            gap: 12,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: isDark ? "rgba(255,255,255,0.08)" : Colors.white,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor,
            }}
          >
            <Building2 size={18} color={primaryColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: textMain,
                fontFamily: "DMSans_600SemiBold",
                fontSize: 14,
              }}
            >
              {t.agent.agencies}
            </Text>
            <Text style={{ color: textMuted, fontSize: 12, marginTop: 1 }}>
              {t.agent.discoverAgencies}
            </Text>
          </View>
          <ChevronRight size={18} color={textMuted} />
        </TouchableOpacity>
      </View>

      {/* Search + Filter row */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingRight: 16, gap: 8 }}>
        <View style={{ flex: 1 }}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder={t.agent.searchPlaceholder}
          />
        </View>
        <TouchableOpacity
          onPress={openFilter}
          activeOpacity={0.8}
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            backgroundColor: activeFilterCount > 0 ? primaryColor : cardBg,
            borderWidth: 1,
            borderColor: activeFilterCount > 0 ? primaryColor : borderColor,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SlidersHorizontal size={18} color={activeFilterCount > 0 ? "#fff" : textMuted} />
          {activeFilterCount > 0 && (
            <View
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: "#EF4444",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 10, fontFamily: "DMSans_700Bold" }}>
                {activeFilterCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8, alignItems: "flex-start" }}
        >
          {commune && (
            <Pressable
              onPress={() => setCommune(undefined)}
              style={{ flexDirection: "row", alignItems: "center", backgroundColor: primaryColor + "22", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 4 }}
            >
              <Text style={{ color: primaryColor, fontSize: 12, fontFamily: "DMSans_500Medium" }}>{commune}</Text>
              <X size={12} color={primaryColor} />
            </Pressable>
          )}
          {propertyType && (
            <Pressable
              onPress={() => setPropertyType(undefined)}
              style={{ flexDirection: "row", alignItems: "center", backgroundColor: primaryColor + "22", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 4 }}
            >
              <Text style={{ color: primaryColor, fontSize: 12, fontFamily: "DMSans_500Medium" }}>
                {t.agent[(PROPERTY_TYPES.find(p => p.value === propertyType)?.key ?? "propTypeApartments") as keyof typeof t.agent] as string}
              </Text>
              <X size={12} color={primaryColor} />
            </Pressable>
          )}
          {minRating !== undefined && (
            <Pressable
              onPress={() => setMinRating(undefined)}
              style={{ flexDirection: "row", alignItems: "center", backgroundColor: primaryColor + "22", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 4 }}
            >
              <Text style={{ color: primaryColor, fontSize: 12, fontFamily: "DMSans_500Medium" }}>{minRating}★+</Text>
              <X size={12} color={primaryColor} />
            </Pressable>
          )}
          {language && (
            <Pressable
              onPress={() => setLanguage(undefined)}
              style={{ flexDirection: "row", alignItems: "center", backgroundColor: primaryColor + "22", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 4 }}
            >
              <Text style={{ color: primaryColor, fontSize: 12, fontFamily: "DMSans_500Medium" }}>{language}</Text>
              <X size={12} color={primaryColor} />
            </Pressable>
          )}
          <Pressable
            onPress={clearAll}
            style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#EF444422", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}
          >
            <Text style={{ color: "#EF4444", fontSize: 12, fontFamily: "DMSans_500Medium" }}>{t.agent.filterClearAll}</Text>
          </Pressable>
        </ScrollView>
      )}

      {isLoading ? (
        <Loader />
      ) : agents.length === 0 ? (
        <EmptyState title={t.agent.notFound} icon={Users} />
      ) : (
        <FlatList
          data={agents}
          keyExtractor={(a) => a.id}
          renderItem={({ item }) => <AgentCard agent={item} />}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 32,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={primaryColor}
            />
          }
        />
      )}

      {/* Filter Bottom Sheet Modal */}
      <Modal
        visible={showFilter}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilter(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
          onPress={() => setShowFilter(false)}
        />
        <View
          style={{
            backgroundColor: cardBg,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: 40,
            maxHeight: "85%",
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
          }}
        >
          {/* Handle */}
          <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: borderColor }} />
          </View>

          {/* Sheet header */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 }}>
            <Text style={{ color: textMain, fontSize: 17, fontFamily: "DMSans_700Bold" }}>
              {t.agent.filterTitle}
            </Text>
            <TouchableOpacity onPress={() => setShowFilter(false)}>
              <X size={22} color={textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 24, paddingBottom: 16 }}>

            {/* Commune */}
            <View>
              <Text style={{ color: textMuted, fontSize: 12, fontFamily: "DMSans_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                {t.agent.filterCommune}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                <Pressable
                  onPress={() => setDraftCommune(undefined)}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                    backgroundColor: !draftCommune ? primaryColor : mutedBg,
                    borderWidth: 1,
                    borderColor: !draftCommune ? primaryColor : borderColor,
                  }}
                >
                  <Text style={{ color: !draftCommune ? "#fff" : textMuted, fontSize: 13, fontFamily: "DMSans_500Medium" }}>
                    {t.agent.filterAllCommunes}
                  </Text>
                </Pressable>
                {KINSHASA_COMMUNES.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setDraftCommune(c)}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                      backgroundColor: draftCommune === c ? primaryColor : mutedBg,
                      borderWidth: 1,
                      borderColor: draftCommune === c ? primaryColor : borderColor,
                    }}
                  >
                    <Text style={{ color: draftCommune === c ? "#fff" : textMain, fontSize: 13, fontFamily: "DMSans_500Medium" }}>
                      {c}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Property type */}
            <View>
              <Text style={{ color: textMuted, fontSize: 12, fontFamily: "DMSans_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                {t.agent.filterPropertyType}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {PROPERTY_TYPES.map(({ key, value }) => (
                  <Pressable
                    key={value}
                    onPress={() => setDraftPropertyType(draftPropertyType === value ? undefined : value)}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                      backgroundColor: draftPropertyType === value ? primaryColor : mutedBg,
                      borderWidth: 1,
                      borderColor: draftPropertyType === value ? primaryColor : borderColor,
                    }}
                  >
                    <Text style={{ color: draftPropertyType === value ? "#fff" : textMain, fontSize: 13, fontFamily: "DMSans_500Medium" }}>
                      {t.agent[key as keyof typeof t.agent] as string}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Minimum rating */}
            <View>
              <Text style={{ color: textMuted, fontSize: 12, fontFamily: "DMSans_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                {t.agent.filterRating}
              </Text>
              <View style={{ gap: 6 }}>
                <Pressable
                  onPress={() => setDraftMinRating(undefined)}
                  style={{
                    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12,
                    backgroundColor: !draftMinRating ? primaryColor + "15" : "transparent",
                    borderWidth: 1,
                    borderColor: !draftMinRating ? primaryColor : borderColor,
                  }}
                >
                  <Text style={{ color: !draftMinRating ? primaryColor : textMain, fontSize: 14, fontFamily: "DMSans_500Medium" }}>
                    {t.agent.filterAllRatings}
                  </Text>
                  {!draftMinRating && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: primaryColor }} />}
                </Pressable>
                {RATING_OPTIONS.map(({ label, value }) => (
                  <Pressable
                    key={value}
                    onPress={() => setDraftMinRating(draftMinRating === value ? undefined : value)}
                    style={{
                      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                      paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12,
                      backgroundColor: draftMinRating === value ? primaryColor + "15" : "transparent",
                      borderWidth: 1,
                      borderColor: draftMinRating === value ? primaryColor : borderColor,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Star size={14} color={draftMinRating === value ? primaryColor : textMuted} fill={draftMinRating === value ? primaryColor : "transparent"} />
                      <Text style={{ color: draftMinRating === value ? primaryColor : textMain, fontSize: 14, fontFamily: "DMSans_500Medium" }}>{label}</Text>
                    </View>
                    {draftMinRating === value && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: primaryColor }} />}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Language */}
            <View>
              <Text style={{ color: textMuted, fontSize: 12, fontFamily: "DMSans_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                {t.agent.filterLanguage}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                <Pressable
                  onPress={() => setDraftLanguage(undefined)}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                    backgroundColor: !draftLanguage ? primaryColor : mutedBg,
                    borderWidth: 1,
                    borderColor: !draftLanguage ? primaryColor : borderColor,
                  }}
                >
                  <Text style={{ color: !draftLanguage ? "#fff" : textMuted, fontSize: 13, fontFamily: "DMSans_500Medium" }}>
                    {t.agent.filterAllLanguages}
                  </Text>
                </Pressable>
                {LANGUAGES.map((lang) => (
                  <Pressable
                    key={lang}
                    onPress={() => setDraftLanguage(draftLanguage === lang ? undefined : lang)}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                      backgroundColor: draftLanguage === lang ? primaryColor : mutedBg,
                      borderWidth: 1,
                      borderColor: draftLanguage === lang ? primaryColor : borderColor,
                    }}
                  >
                    <Text style={{ color: draftLanguage === lang ? "#fff" : textMain, fontSize: 13, fontFamily: "DMSans_500Medium" }}>
                      {lang}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Action buttons */}
          <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingTop: 16 }}>
            <TouchableOpacity
              onPress={resetFilter}
              activeOpacity={0.8}
              style={{
                flex: 1, paddingVertical: 14, borderRadius: 14,
                backgroundColor: mutedBg, borderWidth: 1, borderColor,
                alignItems: "center",
              }}
            >
              <Text style={{ color: textMain, fontSize: 15, fontFamily: "DMSans_600SemiBold" }}>
                {t.agent.filterReset}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={applyFilter}
              activeOpacity={0.8}
              style={{
                flex: 2, paddingVertical: 14, borderRadius: 14,
                backgroundColor: primaryColor,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 15, fontFamily: "DMSans_600SemiBold" }}>
                {t.agent.filterApply}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
