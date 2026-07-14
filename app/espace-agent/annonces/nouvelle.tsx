import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  Image, useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import {
  ArrowLeft, ArrowRight, ChevronLeft,
  Save, SendHorizontal, Trash2, Camera, CheckCircle2,
} from "lucide-react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useAgentSessionStore } from "../../../src/store/useAgentSessionStore";
import { useThemeStore } from "../../../src/store/useThemeStore";
import { useT } from "../../../src/i18n/useT";
import { Colors } from "../../../src/constants/colors";
import { API_URL } from "../../../src/constants/api";

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "apartment",  label: "Appartement" },
  { value: "villa",      label: "Villa" },
  { value: "studio",     label: "Studio" },
  { value: "duplex",     label: "Duplex" },
  { value: "penthouse",  label: "Penthouse" },
  { value: "house",      label: "Maison" },
  { value: "land",       label: "Terrain" },
  { value: "commercial", label: "Local commercial" },
  { value: "office",     label: "Bureau" },
  { value: "warehouse",  label: "Entrepôt" },
];

const COMMUNES = [
  "Gombe","Limete","Ngaliema","Kalamu","Ndjili","Kintambo",
  "Barumbu","Kinshasa","Lemba","Matete","Selembao","Makala","Bumbu","Masina",
];

const CURRENCIES = ["USD", "CDF"];

const AMENITIES = [
  "Eau courante","Électricité","Groupe électrogène","Climatisation",
  "Gardiennage","Parking","Terrasse","Cuisine équipée",
  "Internet","Piscine","Garage","Sécurité 24h/24",
];

const TOTAL_STEPS = 4;
const STEP_LABELS = ["Informations", "Localisation", "Prix", "Photos"];
const STEP_TITLES = [
  "Informations de base",
  "Localisation & détails",
  "Prix",
  "Photos & équipements",
];

// ── Types ────────────────────────────────────────────────────────────────────

type FormState = {
  listingType: "rent" | "sale";
  category: string;
  durationType: "longterm" | "shortterm" | "both";
  title: string;
  subtitle: string;
  description: string;
  suburb: string;
  neighborhood: string;
  landmark: string;
  bedrooms: string;
  bathrooms: string;
  areaSqm: string;
  isFurnished: boolean;
  availableFrom: string;
  price: string;
  currency: string;
  period: "month" | "year" | "day";
  pricePerNight: string;
  minStayNights: string;
  maxStayNights: string;
  shortTermNotes: string;
  amenities: string[];
};

type StagedPhoto = { uri: string; fileName: string; mimeType: string };

// ── Small components ─────────────────────────────────────────────────────────

function SectionLabel({ label, color }: { label: string; color: string }) {
  return (
    <Text style={{
      color, fontSize: 10, fontFamily: "DMSans_600SemiBold",
      letterSpacing: 0.9, textTransform: "uppercase", marginBottom: 10,
    }}>
      {label}
    </Text>
  );
}

function FieldLabel({ label, required, color }: { label: string; required?: boolean; color: string }) {
  return (
    <Text style={{ color, fontSize: 12, marginBottom: 5, fontFamily: "DMSans_500Medium" }}>
      {label}{required ? " *" : ""}
    </Text>
  );
}

// ── Step progress bar ─────────────────────────────────────────────────────────

function StepBar({ step, primary }: { step: number; primary: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 14 }}>
      {STEP_LABELS.map((label, i) => {
        const n = i + 1;
        const done   = n < step;
        const active = n === step;
        return (
          <React.Fragment key={n}>
            <View style={{ alignItems: "center" }}>
              <View style={{
                width: 28, height: 28, borderRadius: 14,
                alignItems: "center", justifyContent: "center",
                backgroundColor: done || active ? "#fff" : "rgba(255,255,255,0.15)",
                borderWidth: active ? 2 : 0,
                borderColor: active ? primary : "transparent",
              }}>
                {done
                  ? <CheckCircle2 size={14} color={primary} />
                  : <Text style={{
                      color: active ? primary : "rgba(255,255,255,0.45)",
                      fontSize: 12, fontFamily: "DMSans_700Bold",
                    }}>{n}</Text>
                }
              </View>
              <Text style={{
                color: active ? "#fff" : "rgba(255,255,255,0.45)",
                fontSize: 9, marginTop: 3,
                fontFamily: active ? "DMSans_600SemiBold" : "DMSans_400Regular",
              }}>
                {label}
              </Text>
            </View>
            {i < STEP_LABELS.length - 1 && (
              <View style={{
                flex: 1, height: 1.5, marginBottom: 14, marginHorizontal: 3,
                backgroundColor: done ? "#fff" : "rgba(255,255,255,0.2)",
              }} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function NouvelleAnnonceScreen() {
  const { token } = useAgentSessionStore();
  const { theme } = useThemeStore();
  const t = useT().espaceAgent;
  const isDark = theme === "dark";
  const queryClient = useQueryClient();

  const { width: screenWidth } = useWindowDimensions();

  const bg      = isDark ? Colors.dark.background : Colors.backgroundAlt;
  const card    = isDark ? Colors.dark.card        : Colors.white;
  const border  = isDark ? Colors.dark.border      : Colors.border;
  const text    = isDark ? Colors.dark.foreground  : Colors.foreground;
  const textMut = isDark ? Colors.dark.mutedFg     : Colors.mutedFg;
  const primary = isDark ? Colors.dark.primary     : Colors.primary;
  const accent  = isDark ? Colors.dark.accent      : Colors.accent;
  const inputBg = isDark ? Colors.dark.muted       : Colors.backgroundAlt;

  // Outer padding (16) + section padding (16) = 32px each side, 2 gaps of 8px = 64+16 = 80
  const photoSize = Math.floor((screenWidth - 80) / 3);

  const [step, setStep]           = useState(1);
  const [savingDraft, setSavingDraft]   = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [photos, setPhotos]       = useState<StagedPhoto[]>([]);

  const [form, setForm] = useState<FormState>({
    listingType: "rent",
    category: "apartment",
    durationType: "longterm",
    title: "", subtitle: "", description: "",
    suburb: "", neighborhood: "", landmark: "",
    bedrooms: "", bathrooms: "", areaSqm: "",
    isFurnished: false, availableFrom: "",
    price: "", currency: "USD", period: "month",
    pricePerNight: "", minStayNights: "2", maxStayNights: "30",
    shortTermNotes: "",
    amenities: [],
  });

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleAmenity(a: string) {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a)
        ? f.amenities.filter((x) => x !== a)
        : [...f.amenities, a],
    }));
  }

  // ── Photo handling ──────────────────────────────────────────────────────

  async function handleAddPhotos() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Erreur", "Permission d'accès à la galerie refusée.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, 15 - photos.length),
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;
    const toAdd = result.assets.slice(0, 15 - photos.length).map((a) => {
      const ext = a.uri.split(".").pop()?.toLowerCase() ?? "jpg";
      return {
        uri: a.uri,
        fileName: a.fileName ?? `photo_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`,
        mimeType: a.mimeType ?? (ext === "png" ? "image/png" : "image/jpeg"),
      };
    });
    setPhotos((prev) => [...prev, ...toAdd]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadPhotos(): Promise<string[]> {
    if (photos.length === 0) return [];
    const files = photos.map((p) => ({ filename: p.fileName, contentType: p.mimeType }));
    const { data: presigned } = await axios.post<{ key: string; url: string }[]>(
      `${API_URL}/uploads/presign-property`,
      { files },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    await Promise.all(
      presigned.map(async ({ url }, i) => {
        const blob = await new Promise<Blob>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.responseType = "blob";
          xhr.onload = () => resolve(xhr.response as Blob);
          xhr.onerror = () => reject(new Error("Failed to read image"));
          xhr.open("GET", photos[i].uri);
          xhr.send();
        });
        await fetch(url, { method: "PUT", body: blob, headers: { "Content-Type": photos[i].mimeType } });
        setUploadProgress(Math.round(((i + 1) / presigned.length) * 100));
      }),
    );
    return presigned.map(({ key }) => key);
  }

  // ── Validation ──────────────────────────────────────────────────────────

  function validateStep(s: number): string | null {
    if (s === 1 && !form.title.trim()) return t.errTitle;
    if (s === 2 && !form.suburb) return t.errCommune;
    if (s === 3 && (!form.price || isNaN(Number(form.price)))) return t.errPrice;
    return null;
  }

  function handleNext() {
    const err = validateStep(step);
    if (err) { Alert.alert("Erreur", err); return; }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  // ── Build payload ───────────────────────────────────────────────────────

  function buildPayload(gallery: string[]) {
    const isRent      = form.listingType === "rent";
    const hasShortTerm = form.durationType === "shortterm" || form.durationType === "both";
    const hasLongTerm  = form.durationType === "longterm"  || form.durationType === "both";
    return {
      listingType:    form.listingType,
      category:       form.category,
      title:          form.title.trim(),
      subtitle:       form.subtitle.trim() || CATEGORIES.find((c) => c.value === form.category)?.label || form.category,
      description:    form.description.trim() || undefined,
      price:          Number(form.price),
      currency:       form.currency,
      period:         isRent ? form.period : undefined,
      bedrooms:       form.bedrooms ? Number(form.bedrooms) : 0,
      bathrooms:      form.bathrooms ? Number(form.bathrooms) : 0,
      areaSqm:        form.areaSqm ? Number(form.areaSqm) : 0,
      suburb:         form.suburb,
      neighborhood:   form.neighborhood.trim() || undefined,
      landmark:       form.landmark.trim() || undefined,
      city:           "Kinshasa",
      isFurnished:    form.isFurnished,
      availableFrom:  form.availableFrom || undefined,
      isShortTerm:    hasShortTerm,
      isLongTerm:     hasLongTerm,
      pricePerNight:  hasShortTerm && form.pricePerNight ? Number(form.pricePerNight) : undefined,
      minStayNights:  hasShortTerm && form.minStayNights ? Number(form.minStayNights) : undefined,
      maxStayNights:  hasShortTerm && form.maxStayNights ? Number(form.maxStayNights) : undefined,
      shortTermNotes: hasShortTerm ? form.shortTermNotes.trim() || undefined : undefined,
      amenities:      form.amenities,
      gallery,
    };
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["agent-annonces-mine"] });
    queryClient.invalidateQueries({ queryKey: ["agent-listings"] });
    queryClient.invalidateQueries({ queryKey: ["properties"] });
  }

  // ── Submit handlers ─────────────────────────────────────────────────────

  async function handleSaveDraft() {
    if (!token) return;
    if (!form.title.trim()) { Alert.alert("Erreur", t.errTitle); return; }
    setSavingDraft(true);
    try {
      const gallery = await uploadPhotos();
      await axios.post(`${API_URL}/properties/mine`, buildPayload(gallery), {
        headers: { Authorization: `Bearer ${token}` },
      });
      invalidate();
      router.replace("/espace-agent/annonces");
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      Alert.alert("Erreur", Array.isArray(msg) ? msg.join(", ") : msg ?? t.errPublish);
    } finally {
      setSavingDraft(false);
      setUploadProgress(0);
    }
  }

  async function handleSubmit() {
    if (!token) return;
    if (photos.length < 3) {
      Alert.alert("Erreur", "Ajoutez au moins 3 photos pour soumettre.");
      return;
    }
    const err = validateStep(3);
    if (err) { Alert.alert("Erreur", err); return; }
    setSubmitting(true);
    try {
      const gallery = await uploadPhotos();
      const { data } = await axios.post(
        `${API_URL}/properties/mine`,
        buildPayload(gallery),
        { headers: { Authorization: `Bearer ${token}` } },
      );
      await axios.post(
        `${API_URL}/properties/mine/${data.id}/publish`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      invalidate();
      router.replace("/espace-agent/annonces");
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      Alert.alert("Erreur", Array.isArray(msg) ? msg.join(", ") : msg ?? t.errPublish);
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  }

  const busy = savingDraft || submitting;

  // ── Shared styles ───────────────────────────────────────────────────────

  const inputStyle = {
    backgroundColor: inputBg, borderWidth: 1, borderColor: border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: text, fontFamily: "DMSans_400Regular",
  } as const;

  const sectionStyle = {
    backgroundColor: card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: border, marginBottom: 12,
  } as const;

  function chipStyle(active: boolean) {
    return {
      paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1,
      borderColor: active ? primary : border,
      backgroundColor: active ? accent : "transparent",
    } as const;
  }

  function chipText(active: boolean) {
    return {
      color: active ? primary : textMut,
      fontSize: 13,
      fontFamily: active ? "DMSans_600SemiBold" : "DMSans_400Regular",
    } as const;
  }

  // ── Step content ────────────────────────────────────────────────────────

  function renderStep1() {
    return (
      <>
        {/* Listing type */}
        <View style={sectionStyle}>
          <SectionLabel label={t.sectionType} color={primary} />
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
            {[{ value: "rent", label: t.typeRent }, { value: "sale", label: t.typeSale }].map(({ value, label }) => (
              <TouchableOpacity
                key={value}
                onPress={() => set("listingType", value as "rent" | "sale")}
                style={[chipStyle(form.listingType === value), { flex: 1, alignItems: "center" }]}
              >
                <Text style={chipText(form.listingType === value)}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Duration type — rent only */}
          {form.listingType === "rent" && (
            <>
              <FieldLabel label="Type de location" color={textMut} />
              <View style={{ flexDirection: "row", gap: 6 }}>
                {[
                  { value: "longterm",  label: "Long terme" },
                  { value: "shortterm", label: "Courte durée" },
                  { value: "both",      label: "Les deux" },
                ].map(({ value, label }) => (
                  <TouchableOpacity
                    key={value}
                    onPress={() => set("durationType", value as FormState["durationType"])}
                    style={[chipStyle(form.durationType === value), { flex: 1, alignItems: "center", paddingHorizontal: 8 }]}
                  >
                    <Text style={[chipText(form.durationType === value), { fontSize: 12 }]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Category */}
        <View style={sectionStyle}>
          <SectionLabel label={t.labelCategory} color={primary} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {CATEGORIES.map(({ value, label }) => (
              <TouchableOpacity
                key={value}
                onPress={() => set("category", value)}
                style={chipStyle(form.category === value)}
              >
                <Text style={chipText(form.category === value)}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Presentation */}
        <View style={{ ...sectionStyle, gap: 12 }}>
          <SectionLabel label={t.sectionPresentation} color={primary} />
          <View>
            <FieldLabel label={t.labelTitle} required color={textMut} />
            <TextInput
              style={inputStyle}
              value={form.title}
              onChangeText={(v) => set("title", v)}
              placeholder="Ex : Appartement 3 chambres — Gombe"
              placeholderTextColor={textMut}
            />
          </View>
          <View>
            <FieldLabel label={t.labelSubtitle} color={textMut} />
            <TextInput
              style={inputStyle}
              value={form.subtitle}
              onChangeText={(v) => set("subtitle", v)}
              placeholder="Résumé en une ligne (optionnel)"
              placeholderTextColor={textMut}
            />
          </View>
          <View>
            <FieldLabel label={t.labelDescription} color={textMut} />
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
      </>
    );
  }

  function renderStep2() {
    return (
      <>
        {/* Location */}
        <View style={sectionStyle}>
          <SectionLabel label={t.sectionLocation} color={primary} />
          <FieldLabel label={t.labelCommune} required color={textMut} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ flexDirection: "row", gap: 8, paddingRight: 4 }}
            style={{ marginBottom: 14 }}
          >
            {COMMUNES.map((c) => (
              <TouchableOpacity key={c} onPress={() => set("suburb", c)} style={chipStyle(form.suburb === c)}>
                <Text style={chipText(form.suburb === c)}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <FieldLabel label={t.labelNeighborhood} color={textMut} />
              <TextInput
                style={inputStyle}
                value={form.neighborhood}
                onChangeText={(v) => set("neighborhood", v)}
                placeholder={t.neighborhoodPlaceholder}
                placeholderTextColor={textMut}
              />
            </View>
            <View style={{ flex: 1 }}>
              <FieldLabel label={t.labelCity} color={textMut} />
              <TextInput
                style={[inputStyle, { opacity: 0.5 }]}
                value="Kinshasa"
                editable={false}
                selectTextOnFocus={false}
              />
            </View>
          </View>

          <View>
            <FieldLabel label="Point de repère" color={textMut} />
            <TextInput
              style={inputStyle}
              value={form.landmark}
              onChangeText={(v) => set("landmark", v)}
              placeholder="Proche du marché central, école St-Pierre…"
              placeholderTextColor={textMut}
            />
          </View>
        </View>

        {/* Features */}
        <View style={sectionStyle}>
          <SectionLabel label={t.sectionFeatures} color={primary} />
          <View style={{ flexDirection: "row", gap: 10 }}>
            {[
              { key: "bedrooms",  label: t.labelBedrooms,  placeholder: "3" },
              { key: "bathrooms", label: t.labelBathrooms, placeholder: "2" },
              { key: "areaSqm",   label: t.labelArea,      placeholder: "120" },
            ].map(({ key, label, placeholder }) => (
              <View key={key} style={{ flex: 1 }}>
                <FieldLabel label={label} color={textMut} />
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

        {/* Options */}
        <View style={sectionStyle}>
          <SectionLabel label="Options" color={primary} />
          <TouchableOpacity
            onPress={() => set("isFurnished", !form.isFurnished)}
            style={[chipStyle(form.isFurnished), {
              flexDirection: "row", alignItems: "center", gap: 10, alignSelf: "flex-start",
            }]}
          >
            <View style={{
              width: 18, height: 18, borderRadius: 4, borderWidth: 1.5,
              borderColor: form.isFurnished ? primary : textMut,
              backgroundColor: form.isFurnished ? primary : "transparent",
              alignItems: "center", justifyContent: "center",
            }}>
              {form.isFurnished && (
                <Text style={{ color: "#fff", fontSize: 11, fontFamily: "DMSans_700Bold" }}>✓</Text>
              )}
            </View>
            <Text style={chipText(form.isFurnished)}>Meublé</Text>
          </TouchableOpacity>
        </View>

        {/* Availability */}
        <View style={sectionStyle}>
          <SectionLabel label="Disponibilité" color={primary} />
          <FieldLabel label="Disponible à partir du" color={textMut} />
          <TextInput
            style={inputStyle}
            value={form.availableFrom}
            onChangeText={(v) => set("availableFrom", v)}
            placeholder="YYYY-MM-DD (laisser vide si immédiat)"
            placeholderTextColor={textMut}
          />
        </View>
      </>
    );
  }

  function renderStep3() {
    const showShortTerm = form.listingType === "rent" &&
      (form.durationType === "shortterm" || form.durationType === "both");

    return (
      <>
        {/* Price */}
        <View style={sectionStyle}>
          <SectionLabel label={t.sectionPrice} color={primary} />
          <View style={{ flexDirection: "row", gap: 8, marginBottom: form.listingType === "rent" ? 10 : 0 }}>
            <TextInput
              style={[inputStyle, { flex: 1 }]}
              value={form.price}
              onChangeText={(v) => set("price", v)}
              keyboardType="numeric"
              placeholder="1 500"
              placeholderTextColor={textMut}
            />
            {CURRENCIES.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => set("currency", c)}
                style={[chipStyle(form.currency === c), { paddingHorizontal: 14, alignItems: "center" }]}
              >
                <Text style={chipText(form.currency === c)}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {form.listingType === "rent" && (
            <View style={{ flexDirection: "row", gap: 8 }}>
              {[
                { value: "month", label: t.periodMonth },
                { value: "year",  label: t.periodYear },
                { value: "day",   label: t.periodDay },
              ].map(({ value, label }) => (
                <TouchableOpacity
                  key={value}
                  onPress={() => set("period", value as FormState["period"])}
                  style={[chipStyle(form.period === value), { flex: 1, alignItems: "center" }]}
                >
                  <Text style={chipText(form.period === value)}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Short-term extras */}
        {showShortTerm && (
          <View style={{ ...sectionStyle, gap: 12 }}>
            <SectionLabel label="Courte durée" color={primary} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              {[
                { key: "pricePerNight",  label: "Prix / nuit",   placeholder: "80" },
                { key: "minStayNights",  label: "Min (nuits)",    placeholder: "2" },
                { key: "maxStayNights",  label: "Max (nuits)",    placeholder: "30" },
              ].map(({ key, label, placeholder }) => (
                <View key={key} style={{ flex: 1 }}>
                  <FieldLabel label={label} color={textMut} />
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
            <View>
              <FieldLabel label="Notes (optionnel)" color={textMut} />
              <TextInput
                style={inputStyle}
                value={form.shortTermNotes}
                onChangeText={(v) => set("shortTermNotes", v)}
                placeholder="Idéal pour expats, minimum 3 nuits…"
                placeholderTextColor={textMut}
              />
            </View>
          </View>
        )}
      </>
    );
  }

  function renderStep4() {
    return (
      <>
        {/* Photos */}
        <View style={sectionStyle}>
          <SectionLabel label="Photos" color={primary} />
          <Text style={{ color: textMut, fontSize: 12, marginBottom: 12, lineHeight: 18 }}>
            Min. 3 photos pour soumettre · Max. 15 · La 1ère est la couverture
          </Text>

          {photos.length < 15 && (
            <TouchableOpacity
              onPress={handleAddPhotos}
              style={{
                borderWidth: 1.5, borderColor: border, borderStyle: "dashed", borderRadius: 12,
                paddingVertical: 22, alignItems: "center", gap: 8, marginBottom: 12,
              }}
            >
              <Camera size={24} color={primary} />
              <Text style={{ color: primary, fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>
                Ajouter des photos ({photos.length}/15)
              </Text>
            </TouchableOpacity>
          )}

          {photos.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {photos.map((p, i) => (
                <View key={i} style={{ width: photoSize, height: photoSize, borderRadius: 10, overflow: "hidden" }}>
                  <Image source={{ uri: p.uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                  {i === 0 && (
                    <View style={{
                      position: "absolute", top: 4, left: 4,
                      backgroundColor: primary, borderRadius: 6,
                      paddingHorizontal: 6, paddingVertical: 2,
                    }}>
                      <Text style={{ color: "#fff", fontSize: 9, fontFamily: "DMSans_700Bold" }}>Couverture</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={() => removePhoto(i)}
                    style={{
                      position: "absolute", top: 4, right: 4,
                      backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 12, padding: 5,
                    }}
                  >
                    <Trash2 size={12} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {photos.length < 3 && (
            <Text style={{ color: "#d97706", fontSize: 12, marginTop: 10 }}>
              ⚠ {3 - photos.length} photo{3 - photos.length > 1 ? "s" : ""} manquante{3 - photos.length > 1 ? "s" : ""} pour soumettre
            </Text>
          )}
        </View>

        {/* Amenities */}
        <View style={sectionStyle}>
          <SectionLabel label="Équipements" color={primary} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {AMENITIES.map((a) => {
              const selected = form.amenities.includes(a);
              return (
                <TouchableOpacity
                  key={a}
                  onPress={() => toggleAmenity(a)}
                  style={chipStyle(selected)}
                >
                  <Text style={[chipText(selected), { fontSize: 12 }]}>
                    {selected ? "✓ " : ""}{a}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* ── Header ── */}
        <View style={{
          backgroundColor: Colors.navy,
          paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
        }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}
          >
            <ArrowLeft size={16} color="rgba(255,255,255,0.6)" />
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{t.back}</Text>
          </TouchableOpacity>
          <Text style={{ color: "#fff", fontSize: 18, fontFamily: "DMSans_700Bold" }}>
            {t.nouvelleTitle}
          </Text>
          <StepBar step={step} primary={primary} />
        </View>

        {/* ── Step subtitle strip ── */}
        <View style={{
          backgroundColor: card, borderBottomWidth: 1, borderBottomColor: border,
          paddingHorizontal: 20, paddingVertical: 12,
        }}>
          <Text style={{ color: text, fontSize: 15, fontFamily: "DMSans_600SemiBold" }}>
            {STEP_TITLES[step - 1]}
          </Text>
          <Text style={{ color: textMut, fontSize: 12, marginTop: 2 }}>
            Étape {step} sur {TOTAL_STEPS}
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}

          {/* Upload progress bar */}
          {(savingDraft || submitting) && uploadProgress > 0 && uploadProgress < 100 && (
            <View style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                <Text style={{ color: textMut, fontSize: 12 }}>Téléchargement photos…</Text>
                <Text style={{ color: textMut, fontSize: 12 }}>{uploadProgress}%</Text>
              </View>
              <View style={{ backgroundColor: border, borderRadius: 4, height: 4 }}>
                <View style={{
                  backgroundColor: primary, borderRadius: 4, height: 4,
                  width: `${uploadProgress}%` as any,
                }} />
              </View>
            </View>
          )}

          {/* ── Footer actions ── */}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>

            {/* Back / Cancel — icon-only square so the two action buttons
                get equal flex-1 width without any text competing for space */}
            <TouchableOpacity
              onPress={step > 1 ? () => setStep((s) => s - 1) : () => router.back()}
              disabled={busy}
              style={{
                width: 50, height: 50, borderRadius: 14,
                borderWidth: 1.5, borderColor: border,
                alignItems: "center", justifyContent: "center",
                opacity: busy ? 0.5 : 1,
              }}
            >
              <ChevronLeft size={20} color={textMut} />
            </TouchableOpacity>

            {/* Save draft */}
            <TouchableOpacity
              onPress={handleSaveDraft}
              disabled={busy}
              style={{
                flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
                height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: primary,
                opacity: busy ? 0.6 : 1,
              }}
            >
              {savingDraft
                ? <ActivityIndicator size="small" color={primary} />
                : <Save size={15} color={primary} />}
              <Text style={{ color: primary, fontSize: 13, fontFamily: "DMSans_600SemiBold" }} numberOfLines={1}>
                {t.saveDraftBtn}
              </Text>
            </TouchableOpacity>

            {/* Next / Submit */}
            {step < TOTAL_STEPS ? (
              <TouchableOpacity
                onPress={handleNext}
                disabled={busy}
                style={{
                  flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
                  height: 50, borderRadius: 14, backgroundColor: primary,
                  opacity: busy ? 0.6 : 1,
                }}
              >
                <Text style={{ color: "#fff", fontSize: 14, fontFamily: "DMSans_700Bold" }}>Suivant</Text>
                <ArrowRight size={15} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={busy}
                style={{
                  flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
                  height: 50, borderRadius: 14, backgroundColor: primary,
                  opacity: busy ? 0.6 : 1,
                }}
              >
                {submitting
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <SendHorizontal size={15} color="#fff" />}
                <Text style={{ color: "#fff", fontSize: 14, fontFamily: "DMSans_700Bold" }} numberOfLines={1}>
                  {submitting ? t.publishing : t.publishBtn}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
