import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  Image, useWindowDimensions,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
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

// AMENITIES: French strings are the canonical DB values — labels are translated in component
const AMENITIES = [
  "Eau courante","Électricité","Groupe électrogène","Climatisation",
  "Gardiennage","Parking","Terrasse","Cuisine équipée",
  "Internet","Piscine","Garage","Sécurité 24h/24",
];

const COMMUNES = [
  "Gombe","Limete","Ngaliema","Kalamu","Ndjili","Kintambo",
  "Barumbu","Kinshasa","Lemba","Matete","Selembao","Makala","Bumbu","Masina",
];

const CURRENCIES = ["USD", "CDF"];

const TOTAL_STEPS = 5;

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
  isExclusive: boolean;
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

type StagedPhoto = { uri: string; fileName: string; mimeType: string; uploaded?: boolean };

// ── Photo normalization ──────────────────────────────────────────────────────

const PHOTO_MIN_W = 800, PHOTO_MIN_H = 600;
const PHOTO_MIN_RATIO = 4 / 3, PHOTO_MAX_RATIO = 16 / 9;
const PHOTO_MAX_W = 1920;

// Brings any picked photo (HEIC, portrait, huge…) in line with the listing
// standards: landscape 4:3–16:9, max 1920px wide, JPEG. Returns null when the
// photo is too small to meet the 800×600 minimum.
async function normalizePhoto(a: ImagePicker.ImagePickerAsset): Promise<StagedPhoto | null> {
  let w = a.width, h = a.height;
  const ctx = ImageManipulator.manipulate(a.uri);

  // Center-crop to the nearest accepted ratio
  const ratio = w / h;
  if (ratio < PHOTO_MIN_RATIO) {
    const cropH = Math.round(w / PHOTO_MIN_RATIO);
    ctx.crop({ originX: 0, originY: Math.round((h - cropH) / 2), width: w, height: cropH });
    h = cropH;
  } else if (ratio > PHOTO_MAX_RATIO) {
    const cropW = Math.round(h * PHOTO_MAX_RATIO);
    ctx.crop({ originX: Math.round((w - cropW) / 2), originY: 0, width: cropW, height: h });
    w = cropW;
  }

  if (w < PHOTO_MIN_W || h < PHOTO_MIN_H) return null;

  if (w > PHOTO_MAX_W) ctx.resize({ width: PHOTO_MAX_W });

  const image = await ctx.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
  return {
    uri: saved.uri,
    fileName: `photo_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`,
    mimeType: "image/jpeg",
  };
}

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

function StepBar({ step, primary, labels }: { step: number; primary: string; labels: string[] }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 14 }}>
      {labels.map((label, i) => {
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
            {i < labels.length - 1 && (
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
  const { id: editId } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!editId;
  const { token, logout } = useAgentSessionStore();
  const { theme } = useThemeStore();
  const t = useT().espaceAgent;
  const isDark = theme === "dark";
  const queryClient = useQueryClient();

  // ── Translated constants (must be inside component to access t) ──────────
  const STEP_LABELS = [t.stepLabel1, t.stepLabel2, t.stepLabel3, t.stepLabel4, t.stepLabel5];
  const STEP_TITLES = [t.stepTitle1, t.stepTitle2, t.stepTitle3, t.stepTitle4, t.stepTitle5];
  const CATEGORIES = [
    { value: "apartment",  label: t.catApartment },
    { value: "villa",      label: t.catVilla },
    { value: "studio",     label: t.catStudio },
    { value: "duplex",     label: t.catDuplex },
    { value: "penthouse",  label: t.catPenthouse },
    { value: "house",      label: t.catHouse },
    { value: "land",       label: t.catLand },
    { value: "commercial", label: t.catCommercial },
    { value: "office",     label: t.catOffice },
    { value: "warehouse",  label: t.catWarehouse },
  ];
  // Map French DB keys → translated labels for amenities
  const AMENITY_LABELS: Record<string, string> = {
    "Eau courante":      t.amenityWater,
    "Électricité":       t.amenityElec,
    "Groupe électrogène": t.amenityGenerator,
    "Climatisation":     t.amenityAC,
    "Gardiennage":       t.amenityGuard,
    "Parking":           t.amenityParking,
    "Terrasse":          t.amenityTerrace,
    "Cuisine équipée":   t.amenityKitchen,
    "Internet":          t.amenityInternet,
    "Piscine":           t.amenityPool,
    "Garage":            t.amenityGarage,
    "Sécurité 24h/24":  t.amenitySecurity24,
  };

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
  const [photoStandardsOpen, setPhotoStandardsOpen] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  // Tracks the current server-side status of an existing listing (edit mode only).
  // Used to decide whether to call /publish (only valid from DRAFT status).
  const [editStatus, setEditStatus] = useState<string | null>(null);
  // Start as true when editId is set; useEffect will flip to false after fetch
  const [loadingDraft, setLoadingDraft] = useState(false);

  const [form, setForm] = useState<FormState>({
    listingType: "rent",
    category: "apartment",
    durationType: "longterm",
    title: "", subtitle: "", description: "",
    suburb: "", neighborhood: "", landmark: "",
    bedrooms: "", bathrooms: "", areaSqm: "",
    isFurnished: false, isExclusive: false, availableFrom: "",
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

  // ── Pre-fill form when editing an existing listing ──────────────────────
  useEffect(() => {
    if (!editId || !token) return;
    setLoadingDraft(true); // show spinner as soon as editId is known
    (async () => {
      try {
        const { data: p } = await axios.get(`${API_URL}/properties/${editId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEditStatus(p.status ?? null);
        setForm({
          listingType:    p.listingType ?? "rent",
          category:       p.category   ?? "apartment",
          durationType:   p.isShortTerm && p.isLongTerm ? "both"
                        : p.isShortTerm ? "shortterm" : "longterm",
          title:          p.title       ?? "",
          subtitle:       p.subtitle    ?? "",
          description:    p.description ?? "",
          suburb:         p.suburb      ?? "",
          neighborhood:   p.neighborhood ?? "",
          landmark:       p.landmark    ?? "",
          bedrooms:       p.bedrooms != null ? String(p.bedrooms) : "",
          bathrooms:      p.bathrooms != null ? String(p.bathrooms) : "",
          areaSqm:        p.areaSqm  != null ? String(p.areaSqm)  : "",
          isFurnished:    p.isFurnished  ?? false,
          isExclusive:    p.isExclusive  ?? false,
          availableFrom:  p.availableFrom ? p.availableFrom.split("T")[0] : "",
          price:          p.price   != null ? String(p.price)   : "",
          currency:       p.currency  ?? "USD",
          period:         p.period    ?? "month",
          pricePerNight:  p.pricePerNight != null ? String(p.pricePerNight) : "",
          minStayNights:  p.minStayNights != null ? String(p.minStayNights) : "2",
          maxStayNights:  p.maxStayNights != null ? String(p.maxStayNights) : "30",
          shortTermNotes: p.shortTermNotes ?? "",
          amenities:      Array.isArray(p.amenities) ? p.amenities : [],
        });
        // Load existing photos as already-uploaded (display only, no re-upload needed)
        if (Array.isArray(p.gallery) && p.gallery.length > 0) {
          setPhotos(p.gallery.map((url: string) => ({
            uri: url,
            fileName: url.split("/").pop() ?? "photo.jpg",
            mimeType: "image/jpeg",
            uploaded: true, // flag: already on the server, skip upload
          })));
        }
      } catch {
        Alert.alert(t.errAlertTitle, t.errLoadListing);
      } finally {
        setLoadingDraft(false);
      }
    })();
  }, [editId, token]);

  // ── Photo handling ──────────────────────────────────────────────────────

  async function handleAddPhotos() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t.errAlertTitle, t.errGalleryPermission);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, 15 - photos.length),
      quality: 0.7,
      exif: false,
    });
    if (result.canceled || !result.assets?.length) return;

    const rejected: string[] = [];
    const toAdd: StagedPhoto[] = [];

    for (const a of result.assets.slice(0, 15 - photos.length)) {
      try {
        const normalized = await normalizePhoto(a);
        if (!normalized) {
          rejected.push(`${t.errImageDimensions} (${a.width}×${a.height} px)`);
          continue;
        }
        toAdd.push(normalized);
      } catch {
        rejected.push(t.errImageFormat);
      }
    }

    if (rejected.length > 0) {
      Alert.alert(t.errAlertTitle, [...new Set(rejected)].join("\n\n"));
    }
    if (toAdd.length > 0) setPhotos((prev) => [...prev, ...toAdd]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadPhotos(): Promise<string[]> {
    if (photos.length === 0) return [];

    // Split already-uploaded (editing) from new local picks
    const existingKeys = photos.filter((p) => p.uploaded).map((p) => p.uri);
    const newPhotos    = photos.filter((p) => !p.uploaded);

    if (newPhotos.length === 0) return existingKeys;

    const files = newPhotos.map((p) => ({ filename: p.fileName, contentType: p.mimeType }));
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
          xhr.open("GET", newPhotos[i].uri);
          xhr.send();
        });
        await fetch(url, { method: "PUT", body: blob, headers: { "Content-Type": newPhotos[i].mimeType } });
        setUploadProgress(Math.round(((i + 1) / presigned.length) * 100));
      }),
    );
    return [...existingKeys, ...presigned.map(({ key }) => key)];
  }

  // ── Validation ──────────────────────────────────────────────────────────

  function validateStep(s: number): string | null {
    if (s === 1) {
      const title = form.title.trim();
      if (!title) return t.errTitle;
      if (title.length < 10) return t.errTitleMin;
      const desc = form.description.trim();
      if (!desc) return t.errDescription;
      if (desc.length < 20) return t.errDescMin;
    }
    if (s === 2) {
      if (!form.suburb) return t.errCommune;
      if (form.bedrooms && (Number(form.bedrooms) < 0 || Number(form.bedrooms) > 50)) return t.errBedroomsRange;
      if (form.bathrooms && (Number(form.bathrooms) < 0 || Number(form.bathrooms) > 30)) return t.errBathroomsRange;
      if (form.areaSqm && (Number(form.areaSqm) < 1 || Number(form.areaSqm) > 100_000)) return t.errAreaRange;
    }
    if (s === 3) {
      const price = Number(form.price);
      if (!form.price || isNaN(price) || price <= 0) return t.errPrice;
      const minPrice = form.currency === "CDF" ? 1_000 : 10;
      if (price < minPrice) return t.errPriceMin;
    }
    return null;
  }

  /** Full pre-submit check across all steps. */
  function validateForSubmit(): string | null {
    for (let s = 1; s <= 3; s++) {
      const err = validateStep(s);
      if (err) return err;
    }
    return null;
  }

  function handleNext() {
    const err = validateStep(step);
    if (err) { Alert.alert(t.errAlertTitle, err); return; }
    // Require ≥3 photos before advancing to the review step
    if (step === 4 && photos.length < 3) {
      Alert.alert(t.errAlertTitle, t.errMinPhotos);
      return;
    }
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
      isExclusive:    form.isExclusive,
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
    if (!form.title.trim()) { Alert.alert(t.errAlertTitle, t.errTitle); return; }
    setSavingDraft(true);
    try {
      const gallery = await uploadPhotos();
      if (isEditing) {
        await axios.patch(`${API_URL}/properties/mine/${editId}`, buildPayload(gallery), {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API_URL}/properties/mine`, buildPayload(gallery), {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      invalidate();
      router.replace("/espace-agent/annonces");
    } catch (e: any) {
      if (e?.response?.status === 401) {
        logout();
        Alert.alert(
          t.errAlertTitle,
          "Votre session a expiré. Veuillez vous reconnecter.",
          [{ text: "OK", onPress: () => router.replace("/(auth)/agent-connexion") }],
        );
        return;
      }
      const msg = e?.response?.data?.message;
      Alert.alert(t.errAlertTitle, Array.isArray(msg) ? msg.join(", ") : msg ?? t.errPublish);
    } finally {
      setSavingDraft(false);
      setUploadProgress(0);
    }
  }

  async function handleSubmit() {
    if (!token) return;
    if (photos.length < 3) {
      Alert.alert(t.errAlertTitle, t.errMinPhotos);
      return;
    }
    const err = validateForSubmit();
    if (err) { Alert.alert(t.errAlertTitle, err); return; }
    setSubmitting(true);
    try {
      const gallery = await uploadPhotos();
      let propertyId = editId;
      if (isEditing) {
        await axios.patch(
          `${API_URL}/properties/mine/${editId}`,
          buildPayload(gallery),
          { headers: { Authorization: `Bearer ${token}` } },
        );
      } else {
        const { data } = await axios.post(
          `${API_URL}/properties/mine`,
          buildPayload(gallery),
          { headers: { Authorization: `Bearer ${token}` } },
        );
        propertyId = data.id;
      }
      // Skip /publish when the listing is already live — backend rejects re-publishing.
      // Only publish fresh creations or listings that are still in DRAFT state.
      const alreadyLive = isEditing && (editStatus === "LIVE" || editStatus === "PENDING_REVIEW");
      if (!alreadyLive) {
        await axios.post(
          `${API_URL}/properties/mine/${propertyId}/publish`,
          {},
          { headers: { Authorization: `Bearer ${token}` } },
        );
      }
      invalidate();
      router.replace("/espace-agent/annonces");
    } catch (e: any) {
      if (e?.response?.status === 401) {
        logout();
        Alert.alert(
          t.errAlertTitle,
          "Votre session a expiré. Veuillez vous reconnecter.",
          [{ text: "OK", onPress: () => router.replace("/(auth)/agent-connexion") }],
        );
        return;
      }
      const msg = e?.response?.data?.message;
      Alert.alert(t.errAlertTitle, Array.isArray(msg) ? msg.join(", ") : msg ?? t.errPublish);
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
              <FieldLabel label={t.labelDurationType} color={textMut} />
              <View style={{ flexDirection: "row", gap: 6 }}>
                {[
                  { value: "longterm",  label: t.durationLongterm },
                  { value: "shortterm", label: t.durationShortterm },
                  { value: "both",      label: t.durationBoth },
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
              placeholder={t.titlePlaceholder}
              placeholderTextColor={textMut}
            />
          </View>
          <View>
            <FieldLabel label={t.labelSubtitle} color={textMut} />
            <TextInput
              style={inputStyle}
              value={form.subtitle}
              onChangeText={(v) => set("subtitle", v)}
              placeholder={t.subtitlePlaceholder}
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
            <FieldLabel label={t.labelLandmark} color={textMut} />
            <TextInput
              style={inputStyle}
              value={form.landmark}
              onChangeText={(v) => set("landmark", v)}
              placeholder={t.landmarkPlaceholder}
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
          <SectionLabel label={t.sectionOptions} color={primary} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
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
              <Text style={chipText(form.isFurnished)}>{t.labelFurnished}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => set("isExclusive", !form.isExclusive)}
              style={[chipStyle(form.isExclusive), {
                flexDirection: "row", alignItems: "center", gap: 10, alignSelf: "flex-start",
                borderColor: form.isExclusive ? "#F59E0B" : undefined,
                backgroundColor: form.isExclusive ? "#F59E0B" : "transparent",
              }]}
            >
              <View style={{
                width: 18, height: 18, borderRadius: 4, borderWidth: 1.5,
                borderColor: form.isExclusive ? "#fff" : textMut,
                backgroundColor: form.isExclusive ? "rgba(255,255,255,0.25)" : "transparent",
                alignItems: "center", justifyContent: "center",
              }}>
                {form.isExclusive && (
                  <Text style={{ color: "#fff", fontSize: 11, fontFamily: "DMSans_700Bold" }}>✓</Text>
                )}
              </View>
              <Text style={[chipText(form.isExclusive), form.isExclusive ? { color: "#fff" } : {}]}>⭐ {t.labelExclusive}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Availability */}
        <View style={sectionStyle}>
          <SectionLabel label={t.sectionAvailability} color={primary} />
          <FieldLabel label={t.labelAvailableFrom} color={textMut} />
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={[inputStyle, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}
          >
            <Text style={{ color: form.availableFrom ? text : textMut, fontSize: 15, fontFamily: "DMSans_400Regular" }}>
              {form.availableFrom
                ? (() => {
                    // Append T00:00:00 to force local-time parsing — avoids "Invalid Date"
                    // on Android/Hermes and prevents UTC-midnight timezone shift.
                    const d = new Date(`${form.availableFrom}T00:00:00`);
                    return isNaN(d.getTime())
                      ? form.availableFrom
                      : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
                  })()
                : t.availableImmediately}
            </Text>
            {form.availableFrom ? (
              <TouchableOpacity
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => set("availableFrom", "")}
              >
                <Text style={{ color: textMut, fontSize: 13 }}>✕</Text>
              </TouchableOpacity>
            ) : (
              <Text style={{ color: textMut, fontSize: 13 }}>📅</Text>
            )}
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={form.availableFrom ? new Date(form.availableFrom) : new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              minimumDate={new Date()}
              onChange={(_, date) => {
                setShowDatePicker(Platform.OS === "ios");
                if (date) {
                  // Use local date components — toISOString() gives UTC which can
                  // shift the day by one in timezones behind UTC.
                  const yyyy = date.getFullYear();
                  const mm = String(date.getMonth() + 1).padStart(2, "0");
                  const dd = String(date.getDate()).padStart(2, "0");
                  set("availableFrom", `${yyyy}-${mm}-${dd}`);
                }
              }}
              style={{ marginTop: 8 }}
            />
          )}

          {showDatePicker && Platform.OS === "ios" && (
            <TouchableOpacity
              onPress={() => setShowDatePicker(false)}
              style={{
                marginTop: 8, alignSelf: "flex-end",
                paddingHorizontal: 16, paddingVertical: 8,
                backgroundColor: primary, borderRadius: 10,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>{t.confirmBtn}</Text>
            </TouchableOpacity>
          )}
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
            <SectionLabel label={t.sectionShortTerm} color={primary} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              {[
                { key: "pricePerNight",  label: t.labelPricePerNight, placeholder: "80" },
                { key: "minStayNights",  label: t.labelMinNights,     placeholder: "2" },
                { key: "maxStayNights",  label: t.labelMaxNights,     placeholder: "30" },
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
              <FieldLabel label={t.labelShortTermNotes} color={textMut} />
              <TextInput
                style={inputStyle}
                value={form.shortTermNotes}
                onChangeText={(v) => set("shortTermNotes", v)}
                placeholder={t.shortTermNotesPlaceholder}
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
          <SectionLabel label={t.sectionPhotos} color={primary} />
          <Text style={{ color: textMut, fontSize: 12, marginBottom: 12, lineHeight: 18 }}>
            {t.photosHint}
          </Text>

          {/* Photo standards banner */}
          <View style={{
            backgroundColor: isDark ? "#0d1f3c" : "#EFF6FF",
            borderRadius: 12, marginBottom: 14,
            borderWidth: 1, borderColor: isDark ? "#1e3a5f" : "#BFDBFE",
          }}>
            <TouchableOpacity
              onPress={() => setPhotoStandardsOpen((v) => !v)}
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12 }}
            >
              <Text style={{ color: "#3B82F6", fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>
                📋 {t.photoStandardsTitle}
              </Text>
              <Text style={{ color: "#3B82F6", fontSize: 13 }}>{photoStandardsOpen ? "▲" : "▼"}</Text>
            </TouchableOpacity>
            {photoStandardsOpen && (
              <View style={{ paddingHorizontal: 12, paddingBottom: 12, gap: 6 }}>
                <Text style={{ color: textMut, fontSize: 11, lineHeight: 16 }}>
                  📐 {t.photoStandardsDimensions}
                </Text>
                <Text style={{ color: textMut, fontSize: 11, lineHeight: 16 }}>
                  🖼️ {t.photoStandardsFormats}
                </Text>
                <Text style={{ color: textMut, fontSize: 11, lineHeight: 16 }}>
                  ↔️ {t.photoStandardsRatio}
                </Text>
                <Text style={{ color: textMut, fontSize: 11, marginTop: 4, fontFamily: "DMSans_600SemiBold" }}>
                  {t.photoStandardsOrderTitle}
                </Text>
                {t.photoStandardsOrderItems.map((item, i) => (
                  <Text key={i} style={{ color: textMut, fontSize: 11, lineHeight: 16 }}>{item}</Text>
                ))}
              </View>
            )}
          </View>

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
                {t.addPhotosBtn.replace("{n}", String(photos.length))}
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
                      <Text style={{ color: "#fff", fontSize: 9, fontFamily: "DMSans_700Bold" }}>{t.photoCoverBadge}</Text>
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
              {t.photosMissingCount.replace("{n}", String(3 - photos.length))}
            </Text>
          )}
        </View>

        {/* Amenities */}
        <View style={sectionStyle}>
          <SectionLabel label={t.sectionAmenities} color={primary} />
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
                    {selected ? "✓ " : ""}{AMENITY_LABELS[a] ?? a}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </>
    );
  }

  function renderStep5() {
    const isRent = form.listingType === "rent";
    const hasShortTerm = form.durationType === "shortterm" || form.durationType === "both";
    const categoryLabel = CATEGORIES.find((c) => c.value === form.category)?.label ?? form.category;
    const durationMap: Record<string, string> = {
      longterm: t.durationLongterm, shortterm: t.durationShortterm, both: t.durationBoth,
    };
    const periodMap: Record<string, string> = {
      month: t.periodMonth, year: t.periodYear, day: t.periodDay,
    };

    function RRow({ label, value }: { label: string; value: string }) {
      return (
        <View style={{
          flexDirection: "row", justifyContent: "space-between", alignItems: "center",
          paddingVertical: 10, paddingHorizontal: 14, gap: 12,
          borderBottomWidth: 1, borderBottomColor: border,
        }}>
          <Text style={{ color: textMut, fontSize: 13, fontFamily: "DMSans_400Regular", flexShrink: 0 }}>{label}</Text>
          <Text style={{ color: text, fontSize: 13, fontFamily: "DMSans_600SemiBold", textAlign: "right", flex: 1 }} numberOfLines={2}>
            {value || t.reviewNone}
          </Text>
        </View>
      );
    }

    function RSection({ title, children }: { title: string; children: React.ReactNode }) {
      return (
        <View style={{ marginBottom: 14 }}>
          <Text style={{
            color: primary, fontSize: 10, fontFamily: "DMSans_700Bold",
            letterSpacing: 0.9, textTransform: "uppercase", marginBottom: 6,
          }}>{title}</Text>
          <View style={{ backgroundColor: card, borderRadius: 14, borderWidth: 1, borderColor: border, overflow: "hidden" }}>
            {children}
          </View>
        </View>
      );
    }

    return (
      <>
        <Text style={{ color: textMut, fontSize: 13, marginBottom: 16, lineHeight: 20 }}>{t.reviewBody}</Text>

        <RSection title={t.sectionType}>
          <RRow label={t.reviewListingType} value={isRent ? t.typeRent : t.typeSale} />
          <RRow label={t.labelCategory} value={categoryLabel} />
          {isRent && <RRow label={t.labelDurationType} value={durationMap[form.durationType] ?? form.durationType} />}
        </RSection>

        <RSection title={t.sectionPresentation}>
          <RRow label={t.labelTitle} value={form.title || t.reviewNone} />
          <RRow label={t.labelSubtitle} value={form.subtitle || t.reviewNone} />
          <RRow label={t.labelDescription} value={form.description ? form.description.slice(0, 80) + (form.description.length > 80 ? "…" : "") : t.reviewNone} />
        </RSection>

        <RSection title={t.sectionLocation}>
          <RRow label={t.labelCommune} value={form.suburb || t.reviewNone} />
          <RRow label={t.labelNeighborhood} value={form.neighborhood || t.reviewNone} />
          <RRow label={t.labelLandmark} value={form.landmark || t.reviewNone} />
        </RSection>

        <RSection title={t.sectionFeatures}>
          <RRow label={t.labelBedrooms} value={form.bedrooms || t.reviewNone} />
          <RRow label={t.labelBathrooms} value={form.bathrooms || t.reviewNone} />
          <RRow label={t.labelArea} value={form.areaSqm ? `${form.areaSqm} m²` : t.reviewNone} />
          <RRow label={t.labelFurnished} value={form.isFurnished ? t.reviewFurnishedYes : t.reviewFurnishedNo} />
          {form.availableFrom && <RRow label={t.labelAvailableFrom} value={form.availableFrom} />}
        </RSection>

        <RSection title={t.sectionPrice}>
          <RRow
            label={t.labelPrice}
            value={`${form.price} ${form.currency}${isRent ? ` ${periodMap[form.period] ?? form.period}` : ""}`}
          />
          {hasShortTerm && form.pricePerNight && (
            <RRow label={t.labelPricePerNight} value={`${form.pricePerNight} ${form.currency} / ${t.periodDay}`} />
          )}
        </RSection>

        <RSection title={t.sectionPhotos}>
          <RRow
            label={t.sectionPhotos}
            value={t.reviewPhotosCount.replace("{n}", String(photos.length))}
          />
        </RSection>

        {form.amenities.length > 0 && (
          <RSection title={t.sectionAmenities}>
            <View style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
              <Text style={{ color: text, fontSize: 13, fontFamily: "DMSans_400Regular", lineHeight: 20 }}>
                {form.amenities.map((a) => AMENITY_LABELS[a] ?? a).join(" · ")}
              </Text>
            </View>
          </RSection>
        )}

        <View style={{
          backgroundColor: "#fffbeb", borderWidth: 1, borderColor: "#fde68a",
          borderRadius: 12, padding: 14, marginBottom: 4,
        }}>
          <Text style={{ color: "#92400e", fontSize: 13, lineHeight: 20 }}>{t.reviewConfirmBody}</Text>
        </View>
      </>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────

  if (loadingDraft) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={primary} />
        <Text style={{ color: textMut, marginTop: 12, fontSize: 14 }}>{t.loadingListing}</Text>
      </SafeAreaView>
    );
  }

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
            {isEditing ? t.editListingTitle : t.nouvelleTitle}
          </Text>
          <StepBar step={step} primary={primary} labels={STEP_LABELS} />
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
            {t.stepCounter.replace("{step}", String(step)).replace("{total}", String(TOTAL_STEPS))}
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
          {step === 5 && renderStep5()}

          {/* Upload progress bar */}
          {(savingDraft || submitting) && uploadProgress > 0 && uploadProgress < 100 && (
            <View style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                <Text style={{ color: textMut, fontSize: 12 }}>{t.uploadingPhotos}</Text>
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

            {/* Back / Cancel */}
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

            {/* Save draft icon (steps 1–4 only) */}
            {step < TOTAL_STEPS && (
              <TouchableOpacity
                onPress={handleSaveDraft}
                disabled={busy}
                style={{
                  width: 50, height: 50, borderRadius: 14,
                  borderWidth: 1.5, borderColor: border,
                  alignItems: "center", justifyContent: "center",
                  opacity: busy ? 0.6 : 1,
                }}
              >
                {savingDraft
                  ? <ActivityIndicator size="small" color={textMut} />
                  : <Save size={18} color={textMut} />}
              </TouchableOpacity>
            )}

            {/* Next (steps 1–4) / Confirm & Submit (step 5) */}
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
                <Text style={{ color: "#fff", fontSize: 14, fontFamily: "DMSans_700Bold" }}>{t.nextBtn}</Text>
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
                {submitting && <ActivityIndicator size="small" color="#fff" />}
                <SendHorizontal size={16} color="#fff" />
                <Text style={{ color: "#fff", fontSize: 14, fontFamily: "DMSans_700Bold" }}>
                  {submitting ? t.publishing : t.reviewConfirmBtn}
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
