import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check } from "lucide-react-native";
import { useAgentSessionStore } from "../../src/store/useAgentSessionStore";
import { useThemeStore } from "../../src/store/useThemeStore";
import { useT } from "../../src/i18n/useT";
import { getMyAgentProfile } from "../../src/services/agentAuth";
import { Colors } from "../../src/constants/colors";
import { API_URL } from "../../src/constants/api";

const COMMUNES = [
  "Gombe","Limete","Ngaliema","Kalamu","Ndjili","Kintambo",
  "Barumbu","Kinshasa (toute)","Lemba","Matete","Selembao","Makala","Bumbu","Masina","N'Sele",
];
const PROPERTY_TYPES = ["Appartements","Villas","Studios","Commerciaux","Terrains","Entrepôts","Bureaux","Maisons"];
const LANGUAGES = ["Français","Lingala","Anglais","Swahili","Kikongo"];

type FormState = {
  name: string; phone: string; whatsapp: string; website: string; address: string;
  tagline: string; description: string;
  communes: string[]; propertyTypes: string[]; rentalFocus: string; languages: string[];
};

function SectionLabel({ label, color }: { label: string; color: string }) {
  return (
    <Text style={{ color, fontSize: 10, fontFamily: "DMSans_600SemiBold", letterSpacing: 0.9, textTransform: "uppercase", marginBottom: 10, marginTop: 4 }}>
      {label}
    </Text>
  );
}

export default function EditAgencyProfileScreen() {
  const { token, agent: sessionAgent } = useAgentSessionStore();
  const { theme } = useThemeStore();
  const t = useT().espaceAgence;
  const isDark = theme === "dark";

  const bg      = isDark ? Colors.dark.background  : Colors.backgroundAlt;
  const card    = isDark ? Colors.dark.card         : Colors.white;
  const border  = isDark ? Colors.dark.border       : Colors.border;
  const text    = isDark ? Colors.dark.foreground   : Colors.foreground;
  const textMut = isDark ? Colors.dark.mutedFg      : Colors.mutedFg;
  const primary = isDark ? Colors.dark.primary      : Colors.primary;
  const inputBg = isDark ? Colors.dark.muted        : Colors.backgroundAlt;

  const RENTAL_FOCUS = [
    { value: "LONG_TERM",  label: t.focusLongTerm },
    { value: "SHORT_TERM", label: t.focusShortTerm },
    { value: "BOTH",       label: t.focusBoth },
  ];

  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: "", phone: "", whatsapp: "", website: "", address: "",
    tagline: "", description: "",
    communes: [], propertyTypes: [], rentalFocus: "LONG_TERM", languages: [],
  });

  useEffect(() => {
    if (!token) { router.replace("/(tabs)/compte"); return; }
    if (sessionAgent?.agentType !== "AGENCY_OWNER") { router.replace("/espace-agent"); return; }
  }, [token, sessionAgent]);

  // TanStack Query: instant cache display + silent background revalidation
  const { data: profileData, isLoading: loading } = useQuery({
    queryKey: ["agentProfile", token],
    queryFn:  () => getMyAgentProfile(token!),
    enabled:  !!token,
    staleTime: 1_000 * 60 * 5,
  });

  useEffect(() => {
    if (!profileData) return;
    const a = (profileData as any)?.agency ?? {};
    setForm({
      name:          a.name          ?? "",
      phone:         a.phone         ?? "",
      whatsapp:      a.whatsapp      ?? "",
      website:       a.website       ?? "",
      address:       a.address       ?? "",
      tagline:       a.tagline       ?? "",
      description:   a.description   ?? "",
      communes:      a.communes      ?? [],
      propertyTypes: a.propertyTypes ?? [],
      rentalFocus:   a.rentalFocus   ?? "LONG_TERM",
      languages:     a.languages     ?? [],
    });
  }, [profileData]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggle(key: "communes" | "propertyTypes" | "languages", val: string) {
    setForm((f) => {
      const arr = f[key] as string[];
      return { ...f, [key]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val] };
    });
  }

  async function handleSave() {
    if (!token) return;
    setSaving(true);
    try {
      await axios.patch(`${API_URL}/agents/me/agency`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      queryClient.invalidateQueries({ queryKey: ["agentProfile"] });
      setSuccess(true);
      setTimeout(() => { setSuccess(false); router.back(); }, 1400);
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      Alert.alert("Erreur", Array.isArray(msg) ? msg.join(", ") : msg ?? "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={primary} size="large" />
        </View>
      </SafeAreaView>
    );
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
        <View style={{ backgroundColor: Colors.navy, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 18 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <ArrowLeft size={16} color="rgba(255,255,255,0.6)" />
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{t.back}</Text>
          </TouchableOpacity>
          <Text style={{ color: "#fff", fontSize: 18, fontFamily: "DMSans_700Bold" }}>{t.editAgencyTitle}</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12 }} keyboardShouldPersistTaps="handled">

          {success && (
            <View style={{ backgroundColor: "#d1fae5", borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Check size={16} color="#065f46" />
              <Text style={{ color: "#065f46", fontSize: 13 }}>{t.profileUpdated}</Text>
            </View>
          )}

          {/* Basic Info */}
          <View style={{ backgroundColor: card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: border, gap: 12 }}>
            <SectionLabel label={t.sectionBasicInfo} color={primary} />
            <View>
              <Text style={{ color: textMut, fontSize: 12, marginBottom: 5 }}>{t.labelName} *</Text>
              <TextInput style={inputStyle} value={form.name} onChangeText={(v) => set("name", v)} placeholder="La Référence Living" placeholderTextColor={textMut} />
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: textMut, fontSize: 12, marginBottom: 5 }}>{t.labelPhone} *</Text>
                <TextInput style={inputStyle} value={form.phone} onChangeText={(v) => set("phone", v)} keyboardType="phone-pad" placeholder="+243 81…" placeholderTextColor={textMut} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: textMut, fontSize: 12, marginBottom: 5 }}>{t.labelWhatsapp}</Text>
                <TextInput style={inputStyle} value={form.whatsapp} onChangeText={(v) => set("whatsapp", v)} keyboardType="phone-pad" placeholder="+243 81…" placeholderTextColor={textMut} />
              </View>
            </View>
            <View>
              <Text style={{ color: textMut, fontSize: 12, marginBottom: 5 }}>{t.labelWebsite}</Text>
              <TextInput style={inputStyle} value={form.website} onChangeText={(v) => set("website", v)} keyboardType="url" autoCapitalize="none" placeholder="https://agence.cd" placeholderTextColor={textMut} />
            </View>
            <View>
              <Text style={{ color: textMut, fontSize: 12, marginBottom: 5 }}>{t.labelAddress}</Text>
              <TextInput style={inputStyle} value={form.address} onChangeText={(v) => set("address", v)} placeholder="123 Avenue Kasa-Vubu, Gombe" placeholderTextColor={textMut} />
            </View>
          </View>

          {/* Public Profile */}
          <View style={{ backgroundColor: card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: border, gap: 12 }}>
            <SectionLabel label={t.sectionPublic} color={primary} />
            <View>
              <Text style={{ color: textMut, fontSize: 12, marginBottom: 5 }}>{t.labelTagline}</Text>
              <TextInput style={inputStyle} value={form.tagline} onChangeText={(v) => set("tagline", v)} placeholder="L'immobilier de confiance à Kinshasa" placeholderTextColor={textMut} />
              <Text style={{ color: textMut, fontSize: 11, marginTop: 4 }}>{t.taglineHint}</Text>
            </View>
            <View>
              <Text style={{ color: textMut, fontSize: 12, marginBottom: 5 }}>{t.labelDescription}</Text>
              <View>
                <TextInput
                  style={[inputStyle, { height: 100, textAlignVertical: "top" }]}
                  value={form.description}
                  onChangeText={(v) => set("description", v.slice(0, 800))}
                  placeholder="Présentez votre agence, votre expérience et vos valeurs…"
                  placeholderTextColor={textMut}
                  multiline
                  numberOfLines={4}
                />
                <Text style={{ color: textMut, fontSize: 10, textAlign: "right", marginTop: 4 }}>{form.description.length} / 800</Text>
              </View>
            </View>
          </View>

          {/* Activity & Market */}
          <View style={{ backgroundColor: card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: border }}>
            <SectionLabel label={t.sectionMarket} color={primary} />

            <Text style={{ color: textMut, fontSize: 12, marginBottom: 8 }}>{t.labelCommunes} *</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {COMMUNES.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => toggle("communes", c)}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
                    borderColor: form.communes.includes(c) ? primary : border,
                    backgroundColor: form.communes.includes(c) ? (isDark ? Colors.dark.accent : Colors.accent) : "transparent",
                  }}
                >
                  <Text style={{ color: form.communes.includes(c) ? primary : textMut, fontSize: 13 }}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ color: textMut, fontSize: 12, marginBottom: 8 }}>{t.labelPropertyTypes} *</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {PROPERTY_TYPES.map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => toggle("propertyTypes", p)}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
                    borderColor: form.propertyTypes.includes(p) ? primary : border,
                    backgroundColor: form.propertyTypes.includes(p) ? (isDark ? Colors.dark.accent : Colors.accent) : "transparent",
                  }}
                >
                  <Text style={{ color: form.propertyTypes.includes(p) ? primary : textMut, fontSize: 13 }}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ color: textMut, fontSize: 12, marginBottom: 8 }}>{t.labelRentalFocus} *</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
              {RENTAL_FOCUS.map(({ value, label }) => (
                <TouchableOpacity
                  key={value}
                  onPress={() => set("rentalFocus", value)}
                  style={{
                    flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: "center",
                    borderColor: form.rentalFocus === value ? primary : border,
                    backgroundColor: form.rentalFocus === value ? (isDark ? Colors.dark.accent : Colors.accent) : "transparent",
                  }}
                >
                  <Text style={{ color: form.rentalFocus === value ? primary : textMut, fontSize: 12 }}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ color: textMut, fontSize: 12, marginBottom: 8 }}>{t.labelLanguages}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {LANGUAGES.map((l) => (
                <TouchableOpacity
                  key={l}
                  onPress={() => toggle("languages", l)}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
                    borderColor: form.languages.includes(l) ? primary : border,
                    backgroundColor: form.languages.includes(l) ? (isDark ? Colors.dark.accent : Colors.accent) : "transparent",
                  }}
                >
                  <Text style={{ color: form.languages.includes(l) ? primary : textMut, fontSize: 13 }}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Save / Cancel */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ flex: 1, paddingVertical: 13, borderRadius: 14, borderWidth: 1, borderColor: border, alignItems: "center" }}
            >
              <Text style={{ color: textMut, fontSize: 14, fontFamily: "DMSans_500Medium" }}>{t.cancelBtn}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={{ flex: 2, paddingVertical: 13, borderRadius: 14, backgroundColor: primary, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8, opacity: saving ? 0.7 : 1 }}
            >
              {saving && <ActivityIndicator size="small" color="#fff" />}
              <Text style={{ color: "#fff", fontSize: 14, fontFamily: "DMSans_600SemiBold" }}>{saving ? t.saving : t.saveBtn}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
