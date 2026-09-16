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
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, Users, X } from "lucide-react-native";
import AgencyCard from "../../src/components/agent/AgencyCard";
import SearchBar from "../../src/components/property/SearchBar";
import EmptyState from "../../src/components/ui/EmptyState";
import Loader from "../../src/components/ui/Loader";
import { Colors } from "../../src/constants/colors";
import { KINSHASA_COMMUNES } from "../../src/constants/kinshasa";
import { useDebounce } from "../../src/hooks/useDebounce";
import { useThemeStore } from "../../src/store/useThemeStore";
import { fetchAgencies } from "../../src/services/agencies";
import { useT } from "../../src/i18n/useT";

const PROPERTY_TYPES = [
  { key: "propTypeApartments", value: "APARTMENT" },
  { key: "propTypeVillas", value: "VILLA" },
  { key: "propTypeStudios", value: "STUDIO" },
  { key: "propTypeLand", value: "LAND" },
  { key: "propTypeOffices", value: "OFFICE" },
  { key: "propTypeWarehouses", value: "WAREHOUSE" },
] as const;

const RENTAL_FOCUS_OPTIONS = [
  { key: "rentalFocusLong", value: "LONG_TERM" },
  { key: "rentalFocusShort", value: "SHORT_TERM" },
  { key: "rentalFocusBoth", value: "BOTH" },
] as const;

const MIN_AGENTS_OPTIONS = [
  { key: "minAgents2", value: 2 },
  { key: "minAgents5", value: 5 },
  { key: "minAgents10", value: 10 },
] as const;

const LANGUAGES = ["Français", "English", "Lingala", "Swahili", "Kikongo"];

export default function AgencesScreen() {
  const t = useT();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  // Applied filter state
  const [commune, setCommune] = useState<string | undefined>();
  const [propertyType, setPropertyType] = useState<string | undefined>();
  const [rentalFocus, setRentalFocus] = useState<string | undefined>();
  const [minAgents, setMinAgents] = useState<number | undefined>();
  const [language, setLanguage] = useState<string | undefined>();

  // Draft state
  const [showFilter, setShowFilter] = useState(false);
  const [draftCommune, setDraftCommune] = useState<string | undefined>();
  const [draftPropertyType, setDraftPropertyType] = useState<string | undefined>();
  const [draftRentalFocus, setDraftRentalFocus] = useState<string | undefined>();
  const [draftMinAgents, setDraftMinAgents] = useState<number | undefined>();
  const [draftLanguage, setDraftLanguage] = useState<string | undefined>();

  const bgColor = isDark ? Colors.dark.background : Colors.backgroundAlt;
  const cardBg = isDark ? Colors.dark.card : Colors.white;
  const borderColor = isDark ? Colors.dark.border : Colors.border;
  const textMain = isDark ? Colors.dark.foreground : Colors.textDark;
  const textMuted = isDark ? Colors.dark.mutedFg : Colors.mutedFg;
  const primaryColor = isDark ? Colors.dark.primary : Colors.primary;
  const mutedBg = isDark ? Colors.dark.muted : "#F1F5F9";

  const activeFilterCount = [commune, propertyType, rentalFocus, minAgents, language].filter(Boolean).length;

  const {
    data: agenciesData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["agencies", debouncedSearch, commune, propertyType, rentalFocus, minAgents, language],
    queryFn: () =>
      fetchAgencies({
        name: debouncedSearch || undefined,
        commune,
        propertyType,
        rentalFocus,
        minAgents,
        language,
      }),
  });

  const agencies = agenciesData?.data ?? [];

  const openFilter = () => {
    setDraftCommune(commune);
    setDraftPropertyType(propertyType);
    setDraftRentalFocus(rentalFocus);
    setDraftMinAgents(minAgents);
    setDraftLanguage(language);
    setShowFilter(true);
  };

  const applyFilter = () => {
    setCommune(draftCommune);
    setPropertyType(draftPropertyType);
    setRentalFocus(draftRentalFocus);
    setMinAgents(draftMinAgents);
    setLanguage(draftLanguage);
    setShowFilter(false);
  };

  const resetDraft = () => {
    setDraftCommune(undefined);
    setDraftPropertyType(undefined);
    setDraftRentalFocus(undefined);
    setDraftMinAgents(undefined);
    setDraftLanguage(undefined);
  };

  const clearAll = () => {
    setCommune(undefined);
    setPropertyType(undefined);
    setRentalFocus(undefined);
    setMinAgents(undefined);
    setLanguage(undefined);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }} edges={["bottom"]}>
      <View
        style={{
          backgroundColor: cardBg,
          borderBottomColor: borderColor,
          borderBottomWidth: 1,
          paddingHorizontal: 20,
          paddingTop: 12,
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
          {t.agency.agenciesTitle}
        </Text>
      </View>

      {/* Search + Filter row */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingRight: 16, gap: 8 }}>
        <View style={{ flex: 1 }}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder={t.agency.searchPlaceholder}
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
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}
        >
          {commune && (
            <Pressable onPress={() => setCommune(undefined)} style={{ flexDirection: "row", alignItems: "center", backgroundColor: primaryColor + "22", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 4 }}>
              <Text style={{ color: primaryColor, fontSize: 12, fontFamily: "DMSans_500Medium" }}>{commune}</Text>
              <X size={12} color={primaryColor} />
            </Pressable>
          )}
          {propertyType && (
            <Pressable onPress={() => setPropertyType(undefined)} style={{ flexDirection: "row", alignItems: "center", backgroundColor: primaryColor + "22", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 4 }}>
              <Text style={{ color: primaryColor, fontSize: 12, fontFamily: "DMSans_500Medium" }}>
                {t.agency[(PROPERTY_TYPES.find(p => p.value === propertyType)?.key ?? "propTypeApartments") as keyof typeof t.agency] as string}
              </Text>
              <X size={12} color={primaryColor} />
            </Pressable>
          )}
          {rentalFocus && (
            <Pressable onPress={() => setRentalFocus(undefined)} style={{ flexDirection: "row", alignItems: "center", backgroundColor: primaryColor + "22", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 4 }}>
              <Text style={{ color: primaryColor, fontSize: 12, fontFamily: "DMSans_500Medium" }}>
                {t.agency[(RENTAL_FOCUS_OPTIONS.find(r => r.value === rentalFocus)?.key ?? "rentalFocusAll") as keyof typeof t.agency] as string}
              </Text>
              <X size={12} color={primaryColor} />
            </Pressable>
          )}
          {minAgents !== undefined && (
            <Pressable onPress={() => setMinAgents(undefined)} style={{ flexDirection: "row", alignItems: "center", backgroundColor: primaryColor + "22", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 4 }}>
              <Text style={{ color: primaryColor, fontSize: 12, fontFamily: "DMSans_500Medium" }}>{minAgents}+ agents</Text>
              <X size={12} color={primaryColor} />
            </Pressable>
          )}
          {language && (
            <Pressable onPress={() => setLanguage(undefined)} style={{ flexDirection: "row", alignItems: "center", backgroundColor: primaryColor + "22", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 4 }}>
              <Text style={{ color: primaryColor, fontSize: 12, fontFamily: "DMSans_500Medium" }}>{language}</Text>
              <X size={12} color={primaryColor} />
            </Pressable>
          )}
          <Pressable onPress={clearAll} style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#EF444422", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ color: "#EF4444", fontSize: 12, fontFamily: "DMSans_500Medium" }}>
              {/* Use agent.filterClearAll since agency doesn't have it separately */}
              {t.agent.filterClearAll}
            </Text>
          </Pressable>
        </ScrollView>
      )}

      {isLoading ? (
        <Loader />
      ) : agencies.length === 0 ? (
        <EmptyState title={t.agency.notFound} icon={Users} />
      ) : (
        <FlatList
          data={agencies}
          keyExtractor={(a) => a.id}
          renderItem={({ item }) => <AgencyCard agency={item} />}
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
              {t.agency.filterTitle}
            </Text>
            <TouchableOpacity onPress={() => setShowFilter(false)}>
              <X size={22} color={textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 24, paddingBottom: 16 }}>

            {/* Commune */}
            <View>
              <Text style={{ color: textMuted, fontSize: 12, fontFamily: "DMSans_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                {t.agency.filterCommune}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                <Pressable
                  onPress={() => setDraftCommune(undefined)}
                  style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: !draftCommune ? primaryColor : mutedBg, borderWidth: 1, borderColor: !draftCommune ? primaryColor : borderColor }}
                >
                  <Text style={{ color: !draftCommune ? "#fff" : textMuted, fontSize: 13, fontFamily: "DMSans_500Medium" }}>
                    {t.agency.filterAllCommunes}
                  </Text>
                </Pressable>
                {KINSHASA_COMMUNES.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setDraftCommune(c)}
                    style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: draftCommune === c ? primaryColor : mutedBg, borderWidth: 1, borderColor: draftCommune === c ? primaryColor : borderColor }}
                  >
                    <Text style={{ color: draftCommune === c ? "#fff" : textMain, fontSize: 13, fontFamily: "DMSans_500Medium" }}>{c}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Property type */}
            <View>
              <Text style={{ color: textMuted, fontSize: 12, fontFamily: "DMSans_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                {t.agency.filterPropertyType}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {PROPERTY_TYPES.map(({ key, value }) => (
                  <Pressable
                    key={value}
                    onPress={() => setDraftPropertyType(draftPropertyType === value ? undefined : value)}
                    style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: draftPropertyType === value ? primaryColor : mutedBg, borderWidth: 1, borderColor: draftPropertyType === value ? primaryColor : borderColor }}
                  >
                    <Text style={{ color: draftPropertyType === value ? "#fff" : textMain, fontSize: 13, fontFamily: "DMSans_500Medium" }}>
                      {t.agency[key as keyof typeof t.agency] as string}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Specialization (rental focus) */}
            <View>
              <Text style={{ color: textMuted, fontSize: 12, fontFamily: "DMSans_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                {t.agency.filterSpecialization}
              </Text>
              <View style={{ gap: 6 }}>
                <Pressable
                  onPress={() => setDraftRentalFocus(undefined)}
                  style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: !draftRentalFocus ? primaryColor + "15" : "transparent", borderWidth: 1, borderColor: !draftRentalFocus ? primaryColor : borderColor }}
                >
                  <Text style={{ color: !draftRentalFocus ? primaryColor : textMain, fontSize: 14, fontFamily: "DMSans_500Medium" }}>
                    {t.agency.rentalFocusAll}
                  </Text>
                  {!draftRentalFocus && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: primaryColor }} />}
                </Pressable>
                {RENTAL_FOCUS_OPTIONS.map(({ key, value }) => (
                  <Pressable
                    key={value}
                    onPress={() => setDraftRentalFocus(draftRentalFocus === value ? undefined : value)}
                    style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: draftRentalFocus === value ? primaryColor + "15" : "transparent", borderWidth: 1, borderColor: draftRentalFocus === value ? primaryColor : borderColor }}
                  >
                    <Text style={{ color: draftRentalFocus === value ? primaryColor : textMain, fontSize: 14, fontFamily: "DMSans_500Medium" }}>
                      {t.agency[key as keyof typeof t.agency] as string}
                    </Text>
                    {draftRentalFocus === value && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: primaryColor }} />}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Team size */}
            <View>
              <Text style={{ color: textMuted, fontSize: 12, fontFamily: "DMSans_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                {t.agency.filterTeamSize}
              </Text>
              <View style={{ gap: 6 }}>
                <Pressable
                  onPress={() => setDraftMinAgents(undefined)}
                  style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: !draftMinAgents ? primaryColor + "15" : "transparent", borderWidth: 1, borderColor: !draftMinAgents ? primaryColor : borderColor }}
                >
                  <Text style={{ color: !draftMinAgents ? primaryColor : textMain, fontSize: 14, fontFamily: "DMSans_500Medium" }}>
                    {t.agency.filterAllSizes}
                  </Text>
                  {!draftMinAgents && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: primaryColor }} />}
                </Pressable>
                {MIN_AGENTS_OPTIONS.map(({ key, value }) => (
                  <Pressable
                    key={value}
                    onPress={() => setDraftMinAgents(draftMinAgents === value ? undefined : value)}
                    style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: draftMinAgents === value ? primaryColor + "15" : "transparent", borderWidth: 1, borderColor: draftMinAgents === value ? primaryColor : borderColor }}
                  >
                    <Text style={{ color: draftMinAgents === value ? primaryColor : textMain, fontSize: 14, fontFamily: "DMSans_500Medium" }}>
                      {t.agency[key as keyof typeof t.agency] as string}
                    </Text>
                    {draftMinAgents === value && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: primaryColor }} />}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Language */}
            <View>
              <Text style={{ color: textMuted, fontSize: 12, fontFamily: "DMSans_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                {t.agency.filterLanguage}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                <Pressable
                  onPress={() => setDraftLanguage(undefined)}
                  style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: !draftLanguage ? primaryColor : mutedBg, borderWidth: 1, borderColor: !draftLanguage ? primaryColor : borderColor }}
                >
                  <Text style={{ color: !draftLanguage ? "#fff" : textMuted, fontSize: 13, fontFamily: "DMSans_500Medium" }}>
                    {t.agency.filterAllLanguages}
                  </Text>
                </Pressable>
                {LANGUAGES.map((lang) => (
                  <Pressable
                    key={lang}
                    onPress={() => setDraftLanguage(draftLanguage === lang ? undefined : lang)}
                    style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: draftLanguage === lang ? primaryColor : mutedBg, borderWidth: 1, borderColor: draftLanguage === lang ? primaryColor : borderColor }}
                  >
                    <Text style={{ color: draftLanguage === lang ? "#fff" : textMain, fontSize: 13, fontFamily: "DMSans_500Medium" }}>{lang}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Action buttons */}
          <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingTop: 16 }}>
            <TouchableOpacity
              onPress={resetDraft}
              activeOpacity={0.8}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: mutedBg, borderWidth: 1, borderColor, alignItems: "center" }}
            >
              <Text style={{ color: textMain, fontSize: 15, fontFamily: "DMSans_600SemiBold" }}>
                {t.agency.filterReset}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={applyFilter}
              activeOpacity={0.8}
              style={{ flex: 2, paddingVertical: 14, borderRadius: 14, backgroundColor: primaryColor, alignItems: "center" }}
            >
              <Text style={{ color: "#fff", fontSize: 15, fontFamily: "DMSans_600SemiBold" }}>
                {t.agency.filterApply}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
