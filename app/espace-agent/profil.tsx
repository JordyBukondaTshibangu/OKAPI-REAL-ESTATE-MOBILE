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
const EXPERIENCE_OPTIONS = ["< 1 an","1 à 3 ans","3 à 5 ans","> 5 ans"];

type FormState = {
  name: string; phoneNumber: string; whatsappNumber: string;
  agentType: string; communes: string[]; propertyTypes: string[];
  rentalFocus: string; yearsExperienceLabel: string; bio: string;
};

function SectionLabel({ label, color }: { label: string; color: string }) {
  return (
    <Text style={{ color, fontSize: 10, fontFamily: "DMSans_600SemiBold", letterSpacing: 0.9, textTransform: "uppercase", marginBottom: 10, marginTop: 4 }}>
      {label}
    </Text>
  );
}

export default function EditAgentProfileScreen() {
  const { token, agent: sessionAgent, setAgent } = useAgentSessionStore();
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

  const AGENT_TYPES = [
    { value: "COMMISSIONNAIRE", label: t.typeIndependent },
    { value: "AGENT",           label: t.typeAgent },
    { value: "AGENCY_OWNER",    label: t.typeAgencyOwner },
    { value: "OTHER",           label: t.typeOther },
  ];
  const RENTAL_FOCUS = [
    { value: "LONG_TERM",  label: t.focusLongTerm },
    { value: "SHORT_TERM", label: t.focusShortTerm },
    { value: "BOTH",       label: t.focusBoth },
  ];

  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: sessionAgent?.name ?? "",
    phoneNumber: sessionAgent?.phoneNumber ?? "",
    whatsappNumber: sessionAgent?.whatsappNumber ?? "",
    agentType: sessionAgent?.agentType ?? "COMMISSIONNAIRE",
    communes: [], propertyTypes: [],
    rentalFocus: "LONG_TERM", yearsExperienceLabel: "", bio: "",
  });

  useEffect(() => {
    if (!token) { router.replace("/(tabs)/compte"); }
  }, [token]);

  // TanStack Query: serves cached data instantly, revalidates silently in background
  const { data: profileData, isLoading: loading } = useQuery({
    queryKey: ["agentProfile", token],
    queryFn:  () => getMyAgentProfile(token!),
    enabled:  !!token,
    staleTime: 1_000 * 60 * 5,
  });

  // Populate the form whenever fresh data arrives (including from cache on first render)
  useEffect(() => {
    if (!profileData) return;
    const p = profileData as any;
    setForm({
      name:                 p.name ?? "",
      phoneNumber:          p.phoneNumber ?? "",
      whatsappNumber:       p.whatsappNumber ?? "",
      agentType:            p.agentType ?? "COMMISSIONNAIRE",
      communes:             p.communes ?? [],
      propertyTypes:        p.propertyTypes ?? [],
      rentalFocus:          p.rentalFocus ?? "LONG_TERM",
      yearsExperienceLabel: p.yearsExperienceLabel ?? "",
      bio:                  p.bio ?? "",
    });
  }, [profileData]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggle(key: "communes" | "propertyTypes", val: string) {
    setForm((f) => {
      const arr = f[key];
      return { ...f, [key]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val] };
    });
  }

  async function handleSave() {
    if (!token) return;
    setSaving(true);
    try {
      await axios.patch(`${API_URL}/agents/me`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (sessionAgent) setAgent({ ...sessionAgent, name: form.name, agentType: form.agentType });
      // Invalidate so dashboards and this screen fetch fresh data next time
      queryClient.invalidateQueries({ queryKey: ["agentProfile"] });
      setSuccess(true);
      setTimeout(() => { setSuccess(false); router.back(); }, 1400);
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      Alert.alert("Erreur", Array.isArray(msg) ? msg.join(", ") : msg ?? t.errSave);
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
          <Text style={{ color: "#fff", fontSize: 18, fontFamily: "DMSans_700Bold" }}>{t.editProfileTitle}</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12 }} keyboardShouldPersistTaps="handled">

          {success && (
            <View style={{ backgroundColor: "#d1fae5", borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Check size={16} color="#065f46" />
              <Text style={{ color: "#065f46", fontSize: 13 }}>{t.profileUpdated}</Text>
            </View>
          )}

          {/* Basic Info */}
          <View style={{ backgroundColor: card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: border }}>
            <SectionLabel label={t.sectionBasicInfo} color={primary} />
            <View style={{ gap: 12 }}>
              <View>
                <Text style={{ color: textMut, fontSize: 12, marginBottom: 5 }}>{t.labelName} *</Text>
                <TextInput style={inputStyle} value={form.name} onChangeText={(v) => set("name", v)} placeholder="Kinsley Koman" placeholderTextColor={textMut} />
              </View>
              <View>
                <Text style={{ color: textMut, fontSize: 12, marginBottom: 5 }}>{t.labelPhone} *</Text>
                <TextInput style={inputStyle} value={form.phoneNumber} onChangeText={(v) => set("phoneNumber", v)} keyboardType="phone-pad" placeholder="+243 81 234 5678" placeholderTextColor={textMut} />
              </View>
              <View>
                <Text style={{ color: textMut, fontSize: 12, marginBottom: 5 }}>{t.labelWhatsapp}</Text>
                <TextInput style={inputStyle} value={form.whatsappNumber} onChangeText={(v) => set("whatsappNumber", v)} keyboardType="phone-pad" placeholder="+243 81 234 5678" placeholderTextColor={textMut} />
                <Text style={{ color: textMut, fontSize: 11, marginTop: 4 }}>{t.whatsappHint}</Text>
              </View>
            </View>
          </View>

          {/* Agent Type */}
          <View style={{ backgroundColor: card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: border }}>
            <SectionLabel label={t.labelAgentType} color={primary} />
            <View style={{ gap: 8 }}>
              {AGENT_TYPES.map(({ value, label }) => (
                <TouchableOpacity
                  key={value}
                  onPress={() => set("agentType", value)}
                  style={{
                    flexDirection: "row", alignItems: "center", gap: 12,
                    padding: 12, borderRadius: 12, borderWidth: 1,
                    borderColor: form.agentType === value ? primary : border,
                    backgroundColor: form.agentType === value ? (isDark ? Colors.dark.accent : Colors.accent) : "transparent",
                  }}
                >
                  <View style={{
                    width: 18, height: 18, borderRadius: 9, borderWidth: 2,
                    borderColor: form.agentType === value ? primary : border,
                    alignItems: "center", justifyContent: "center",
                  }}>
                    {form.agentType === value && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: primary }} />}
                  </View>
                  <Text style={{ color: text, fontSize: 14, fontFamily: "DMSans_500Medium" }}>{label}</Text>
                </TouchableOpacity>
              ))}
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
                  <Text style={{ color: form.rentalFocus === value ? primary : textMut, fontSize: 13 }}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ color: textMut, fontSize: 12, marginBottom: 8 }}>{t.labelExperience}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {EXPERIENCE_OPTIONS.map((exp) => (
                <TouchableOpacity
                  key={exp}
                  onPress={() => set("yearsExperienceLabel", exp)}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
                    borderColor: form.yearsExperienceLabel === exp ? primary : border,
                    backgroundColor: form.yearsExperienceLabel === exp ? (isDark ? Colors.dark.accent : Colors.accent) : "transparent",
                  }}
                >
                  <Text style={{ color: form.yearsExperienceLabel === exp ? primary : textMut, fontSize: 13 }}>{exp}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Public Profile */}
          <View style={{ backgroundColor: card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: border }}>
            <SectionLabel label={t.sectionPublic} color={primary} />
            <Text style={{ color: textMut, fontSize: 12, marginBottom: 5 }}>{t.labelBio}</Text>
            <View style={{ position: "relative" }}>
              <TextInput
                style={[inputStyle, { height: 100, textAlignVertical: "top" }]}
                value={form.bio}
                onChangeText={(v) => set("bio", v.slice(0, 500))}
                placeholder={t.bioPlaceholder}
                placeholderTextColor={textMut}
                multiline
                numberOfLines={4}
              />
              <Text style={{ color: textMut, fontSize: 10, textAlign: "right", marginTop: 4 }}>{form.bio.length} / 500</Text>
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
