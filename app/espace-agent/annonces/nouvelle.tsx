import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import axios from "axios";
import { ArrowLeft } from "lucide-react-native";
import { useAgentSessionStore } from "../../../src/store/useAgentSessionStore";
import { useThemeStore } from "../../../src/store/useThemeStore";
import { useT } from "../../../src/i18n/useT";
import { Colors } from "../../../src/constants/colors";
import { API_URL } from "../../../src/constants/api";

const CATEGORIES = [
  "Appartement","Villa","Studio","Duplex","Penthouse",
  "Maison","Terrain","Local commercial","Bureau","Entrepôt",
];
const COMMUNES = [
  "Gombe","Limete","Ngaliema","Kalamu","Ndjili","Kintambo",
  "Barumbu","Kinshasa","Lemba","Matete","Selembao","Makala","Bumbu","Masina",
];
const CURRENCIES = ["USD", "CDF"];

type FormState = {
  listingType: string; category: string; title: string; subtitle: string;
  price: string; currency: string; period: string;
  bedrooms: string; bathrooms: string; areaSqm: string;
  suburb: string; neighborhood: string; city: string; description: string;
};

function SectionLabel({ label, color }: { label: string; color: string }) {
  return (
    <Text style={{ color, fontSize: 10, fontFamily: "DMSans_600SemiBold", letterSpacing: 0.9, textTransform: "uppercase", marginBottom: 10 }}>
      {label}
    </Text>
  );
}

export default function NouvelleAnnonceScreen() {
  const { token, agent } = useAgentSessionStore();
  const { theme } = useThemeStore();
  const t = useT().espaceAgent;
  const isDark = theme === "dark";

  const bg      = isDark ? Colors.dark.background  : Colors.backgroundAlt;
  const card    = isDark ? Colors.dark.card         : Colors.white;
  const border  = isDark ? Colors.dark.border       : Colors.border;
  const text    = isDark ? Colors.dark.foreground   : Colors.foreground;
  const textMut = isDark ? Colors.dark.mutedFg      : Colors.mutedFg;
  const primary = isDark ? Colors.dark.primary      : Colors.primary;
  const inputBg = isDark ? Colors.dark.muted        : Colors.backgroundAlt;

  const LISTING_TYPES = [
    { value: "rent", label: t.typeRent },
    { value: "sale", label: t.typeSale },
  ];
  const PERIODS = [
    { value: "month", label: t.periodMonth },
    { value: "year",  label: t.periodYear },
    { value: "day",   label: t.periodDay },
  ];

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({
    listingType: "rent", category: "Appartement", title: "", subtitle: "",
    price: "", currency: "USD", period: "month",
    bedrooms: "", bathrooms: "", areaSqm: "",
    suburb: "", neighborhood: "", city: "Kinshasa", description: "",
  });

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    if (!token || !agent) return;
    if (!form.title.trim()) { Alert.alert("Erreur", t.errTitle); return; }
    if (!form.price || isNaN(Number(form.price))) { Alert.alert("Erreur", t.errPrice); return; }
    if (!form.suburb) { Alert.alert("Erreur", t.errCommune); return; }

    setSaving(true);
    try {
      const payload = {
        listingType:  form.listingType,
        category:     form.category,
        title:        form.title.trim(),
        subtitle:     form.subtitle.trim() || form.category,
        price:        Number(form.price),
        currency:     form.currency,
        period:       form.listingType === "rent" ? form.period : undefined,
        bedrooms:     form.bedrooms ? Number(form.bedrooms) : undefined,
        bathrooms:    form.bathrooms ? Number(form.bathrooms) : undefined,
        areaSqm:      form.areaSqm ? Number(form.areaSqm) : undefined,
        suburb:       form.suburb,
        neighborhood: form.neighborhood || undefined,
        city:         form.city,
        description:  form.description.trim() || undefined,
        amenities: [], gallery: [],
      };
      await axios.post(`${API_URL}/properties/mine`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      router.replace("/espace-agent/annonces");
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      Alert.alert("Erreur", Array.isArray(msg) ? msg.join(", ") : msg ?? t.errPublish);
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    backgroundColor: inputBg, borderWidth: 1, borderColor: border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: text, fontFamily: "DMSans_400Regular",
  } as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>

        {/* Header */}
        <View style={{ backgroundColor: Colors.navy, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 18, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
          <View>
            <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <ArrowLeft size={16} color="rgba(255,255,255,0.6)" />
              <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{t.back}</Text>
            </TouchableOpacity>
            <Text style={{ color: "#fff", fontSize: 18, fontFamily: "DMSans_700Bold" }}>{t.nouvelleTitle}</Text>
          </View>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={saving}
            style={{ backgroundColor: Colors.secondary, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20, opacity: saving ? 0.7 : 1, flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            {saving && <ActivityIndicator size="small" color={Colors.navy} />}
            <Text style={{ color: Colors.navy, fontSize: 13, fontFamily: "DMSans_700Bold" }}>{saving ? t.publishing : t.publishBtn}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12 }} keyboardShouldPersistTaps="handled">

          {/* Type & Category */}
          <View style={{ backgroundColor: card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: border }}>
            <SectionLabel label={t.sectionType} color={primary} />
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
              {LISTING_TYPES.map(({ value, label }) => (
                <TouchableOpacity
                  key={value}
                  onPress={() => set("listingType", value)}
                  style={{
                    flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, alignItems: "center",
                    borderColor: form.listingType === value ? primary : border,
                    backgroundColor: form.listingType === value ? (isDark ? Colors.dark.accent : Colors.accent) : "transparent",
                  }}
                >
                  <Text style={{ color: form.listingType === value ? primary : textMut, fontSize: 14, fontFamily: "DMSans_600SemiBold" }}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ color: textMut, fontSize: 12, marginBottom: 8 }}>{t.labelCategory}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
              <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 4 }}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => set("category", c)}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
                      borderColor: form.category === c ? primary : border,
                      backgroundColor: form.category === c ? (isDark ? Colors.dark.accent : Colors.accent) : "transparent",
                    }}
                  >
                    <Text style={{ color: form.category === c ? primary : textMut, fontSize: 13 }}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Presentation */}
          <View style={{ backgroundColor: card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: border, gap: 12 }}>
            <SectionLabel label={t.sectionPresentation} color={primary} />
            <View>
              <Text style={{ color: textMut, fontSize: 12, marginBottom: 5 }}>{t.labelTitle} *</Text>
              <TextInput style={inputStyle} value={form.title} onChangeText={(v) => set("title", v)} placeholder={t.titlePlaceholder} placeholderTextColor={textMut} />
            </View>
            <View>
              <Text style={{ color: textMut, fontSize: 12, marginBottom: 5 }}>{t.labelDescription}</Text>
              <TextInput
                style={[inputStyle, { height: 90, textAlignVertical: "top" }]}
                value={form.description}
                onChangeText={(v) => set("description", v)}
                placeholder={t.descPlaceholder}
                placeholderTextColor={textMut}
                multiline
              />
            </View>
          </View>

          {/* Price */}
          <View style={{ backgroundColor: card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: border }}>
            <SectionLabel label={t.sectionPrice} color={primary} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TextInput
                style={[inputStyle, { flex: 1 }]}
                value={form.price}
                onChangeText={(v) => set("price", v)}
                keyboardType="numeric"
                placeholder="1500"
                placeholderTextColor={textMut}
              />
              <View style={{ flexDirection: "row", gap: 6 }}>
                {CURRENCIES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => set("currency", c)}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 11, borderRadius: 12, borderWidth: 1,
                      borderColor: form.currency === c ? primary : border,
                      backgroundColor: form.currency === c ? (isDark ? Colors.dark.accent : Colors.accent) : "transparent",
                    }}
                  >
                    <Text style={{ color: form.currency === c ? primary : textMut, fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {form.listingType === "rent" && (
              <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                {PERIODS.map(({ value, label }) => (
                  <TouchableOpacity
                    key={value}
                    onPress={() => set("period", value)}
                    style={{
                      flex: 1, paddingVertical: 9, borderRadius: 12, borderWidth: 1, alignItems: "center",
                      borderColor: form.period === value ? primary : border,
                      backgroundColor: form.period === value ? (isDark ? Colors.dark.accent : Colors.accent) : "transparent",
                    }}
                  >
                    <Text style={{ color: form.period === value ? primary : textMut, fontSize: 13 }}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Features */}
          <View style={{ backgroundColor: card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: border }}>
            <SectionLabel label={t.sectionFeatures} color={primary} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              {[
                { key: "bedrooms",  label: t.labelBedrooms,  placeholder: "3" },
                { key: "bathrooms", label: t.labelBathrooms, placeholder: "2" },
                { key: "areaSqm",   label: t.labelArea,      placeholder: "120" },
              ].map(({ key, label, placeholder }) => (
                <View key={key} style={{ flex: 1 }}>
                  <Text style={{ color: textMut, fontSize: 11, marginBottom: 5 }}>{label}</Text>
                  <TextInput
                    style={inputStyle}
                    value={(form as any)[key]}
                    onChangeText={(v) => set(key as keyof FormState, v)}
                    keyboardType="numeric"
                    placeholder={placeholder}
                    placeholderTextColor={textMut}
                  />
                </View>
              ))}
            </View>
          </View>

          {/* Location */}
          <View style={{ backgroundColor: card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: border, gap: 12 }}>
            <SectionLabel label={t.sectionLocation} color={primary} />
            <View>
              <Text style={{ color: textMut, fontSize: 12, marginBottom: 8 }}>{t.labelCommune} *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
                <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 4 }}>
                  {COMMUNES.map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => set("suburb", c)}
                      style={{
                        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
                        borderColor: form.suburb === c ? primary : border,
                        backgroundColor: form.suburb === c ? (isDark ? Colors.dark.accent : Colors.accent) : "transparent",
                      }}
                    >
                      <Text style={{ color: form.suburb === c ? primary : textMut, fontSize: 13 }}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: textMut, fontSize: 12, marginBottom: 5 }}>{t.labelNeighborhood}</Text>
                <TextInput style={inputStyle} value={form.neighborhood} onChangeText={(v) => set("neighborhood", v)} placeholder={t.neighborhoodPlaceholder} placeholderTextColor={textMut} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: textMut, fontSize: 12, marginBottom: 5 }}>{t.labelCity} *</Text>
                <TextInput style={inputStyle} value={form.city} onChangeText={(v) => set("city", v)} placeholder="Kinshasa" placeholderTextColor={textMut} />
              </View>
            </View>
          </View>

          <Text style={{ color: textMut, fontSize: 12, textAlign: "center" }}>{t.photosNote}</Text>
          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
