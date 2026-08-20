import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Modal,
  ActivityIndicator, Alert, Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Star, Check, Copy, Upload, XCircle, Building2,
} from "lucide-react-native";
import { useAgentSessionStore } from "../../../src/store/useAgentSessionStore";
import { useThemeStore } from "../../../src/store/useThemeStore";
import { useT } from "../../../src/i18n/useT";
import { Colors } from "../../../src/constants/colors";
import {
  createSubscriptionRequest,
  getMySubscriptions,
  updateSubscriptionScreenshot,
  presignSubscriptionScreenshot,
  type BoostPaymentMethod,
  type SubscriptionRequest,
} from "../../../src/services/agentAuth";

// ─── Payment methods ──────────────────────────────────────────────────────────

const PAYMENT_METHODS: BoostPaymentMethod[] = [
  "ORANGE_MONEY", "MTN_MONEY", "AIRTEL_MONEY", "MPESA",
];

const PM_LABELS: Record<string, string> = {
  ORANGE_MONEY: "Orange Money",
  MTN_MONEY: "MTN Money",
  AIRTEL_MONEY: "Airtel Money",
  MPESA: "M-Pesa (Vodacom)",
  CASH: "Cash",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-CD", { day: "2-digit", month: "long", year: "numeric" });
}

// ─── 3-step subscribe modal ───────────────────────────────────────────────────

function AgencySubscriptionModal({
  visible, token, t, onClose, onSuccess,
}: {
  visible: boolean;
  token: string;
  t: ReturnType<typeof useT>["espaceAgence"];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { theme } = useThemeStore();
  const dark = theme === "dark";
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedMethod, setSelectedMethod] = useState<BoostPaymentMethod | null>(null);
  const [reference, setReference] = useState("");
  const [subId, setSubId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [screenshotUploaded, setScreenshotUploaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const bg = dark ? "#18181b" : "#fff";
  const surface = dark ? "#27272a" : "#f8fafc";
  const textColor = dark ? "#f4f4f5" : "#1e293b";
  const mutedColor = dark ? "#a1a1aa" : "#64748b";
  const borderColor = dark ? "#3f3f46" : "#e2e8f0";
  const accentColor = "#8b5cf6";

  const STEPS = ["Choisir paiement", "Effectuer paiement", "Confirmation"];

  const handleSubmit = async () => {
    if (!selectedMethod) return;
    setSubmitting(true);
    try {
      const req = await createSubscriptionRequest(token, { tier: "AGENCY", paymentMethod: selectedMethod });
      setSubId(req.id);
      setReference(req.paymentReference ?? "");
      setStep(2);
    } catch (e: any) {
      Alert.alert("Erreur", e?.response?.data?.message ?? "Impossible de créer la demande.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePickScreenshot = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission requise", "Autorisez l'accès à la galerie.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const filename = asset.uri.split("/").pop() ?? "screenshot.jpg";
    const contentType = asset.mimeType ?? "image/jpeg";
    setUploading(true);
    try {
      const { key, url } = await presignSubscriptionScreenshot(token, filename, contentType);
      const blob = await fetch(asset.uri).then((r) => r.blob());
      await fetch(url, { method: "PUT", body: blob, headers: { "Content-Type": contentType } });
      const R2_BASE = process.env.EXPO_PUBLIC_R2_PUBLIC_URL ?? "";
      const publicUrl = key.startsWith("http") ? key : `${R2_BASE}/${key.replace(/^\/+/, "")}`;
      await updateSubscriptionScreenshot(token, subId, publicUrl);
      setScreenshotUploaded(true);
    } catch (e: any) {
      Alert.alert("Erreur", e?.response?.data?.message ?? "Impossible d'envoyer la capture.");
    } finally {
      setUploading(false);
    }
  };

  const handleCopyRef = async () => {
    await Clipboard.setStringAsync(reference);
    Alert.alert("", "Référence copiée !");
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderColor }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {step > 1 && (
              <Pressable onPress={() => setStep((s) => (s - 1) as 1 | 2 | 3)} hitSlop={10}>
                <ArrowLeft size={20} color={textColor} />
              </Pressable>
            )}
            <Text style={{ fontSize: 17, fontFamily: "DMSans_600SemiBold", color: textColor }}>
              {t.agencySubsTitle}
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={10}>
            <XCircle size={22} color={mutedColor} />
          </Pressable>
        </View>

        {/* Step indicator */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingVertical: 16 }}>
          {STEPS.map((label, i) => {
            const idx = i + 1;
            const done = step > idx;
            const active = step === idx;
            return (
              <React.Fragment key={idx}>
                <View style={{ alignItems: "center", gap: 4 }}>
                  <View style={{
                    width: 28, height: 28, borderRadius: 14,
                    backgroundColor: done || active ? accentColor : borderColor,
                    alignItems: "center", justifyContent: "center",
                  }}>
                    {done
                      ? <Check size={14} color="#fff" />
                      : <Text style={{ fontSize: 12, fontFamily: "DMSans_700Bold", color: done || active ? "#fff" : mutedColor }}>{idx}</Text>
                    }
                  </View>
                  <Text style={{ fontSize: 10, fontFamily: "DMSans_500Medium", color: active ? accentColor : mutedColor }}>{label}</Text>
                </View>
                {i < STEPS.length - 1 && (
                  <View style={{ flex: 1, height: 2, backgroundColor: done ? accentColor : borderColor, marginBottom: 16, marginHorizontal: 6 }} />
                )}
              </React.Fragment>
            );
          })}
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 16 }}>

          {/* ── Step 1: Choose payment method ── */}
          {step === 1 && (
            <>
              {/* Plan summary card */}
              <View style={{ borderRadius: 14, borderWidth: 2, borderColor: accentColor, backgroundColor: dark ? `${accentColor}22` : `${accentColor}11`, padding: 16, marginBottom: 4 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: `${accentColor}22`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                    <Building2 size={14} color={accentColor} />
                    <Text style={{ color: accentColor, fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>Plan Agence</Text>
                  </View>
                  <Text style={{ fontSize: 18, fontFamily: "DMSans_700Bold", color: accentColor }}>$50/mois</Text>
                </View>
                {[
                  t.agencySubsFeature1,
                  t.agencySubsFeature2,
                  t.agencySubsFeature3,
                  t.agencySubsFeature4,
                ].map((f, fi) => (
                  <View key={fi} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
                    <Check size={13} color="#22c55e" />
                    <Text style={{ fontSize: 12, color: mutedColor, fontFamily: "DMSans_400Regular", flex: 1 }}>{f}</Text>
                  </View>
                ))}
              </View>

              <Text style={{ fontSize: 12, fontFamily: "DMSans_600SemiBold", color: mutedColor, textTransform: "uppercase", letterSpacing: 0.8, marginTop: 8, marginBottom: 8 }}>
                Payer avec
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {PAYMENT_METHODS.map((m) => {
                  const isSel = selectedMethod === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setSelectedMethod(m)}
                      style={{
                        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5,
                        borderColor: isSel ? accentColor : borderColor,
                        backgroundColor: isSel ? (dark ? "#2d1f4f" : "#f5f3ff") : surface,
                      }}
                    >
                      <Text style={{ fontSize: 13, fontFamily: "DMSans_500Medium", color: isSel ? accentColor : textColor }}>
                        {PM_LABELS[m] ?? m}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!selectedMethod || submitting}
                style={{
                  backgroundColor: accentColor, borderRadius: 12, paddingVertical: 14,
                  alignItems: "center", marginTop: 8,
                  opacity: !selectedMethod || submitting ? 0.5 : 1,
                }}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={{ fontSize: 15, fontFamily: "DMSans_600SemiBold", color: "#fff" }}>{t.agencySubsSubscribeBtn}</Text>
                }
              </TouchableOpacity>
            </>
          )}

          {/* ── Step 2: Make payment ── */}
          {step === 2 && (
            <>
              <View style={{ backgroundColor: dark ? "#2d1f4f" : "#f5f3ff", borderRadius: 14, padding: 16, gap: 12, borderWidth: 1, borderColor: dark ? `${accentColor}44` : "#ddd6fe" }}>
                <Text style={{ fontSize: 14, fontFamily: "DMSans_600SemiBold", color: dark ? "#c4b5fd" : "#5b21b6" }}>
                  Plan Agence — $50/mois · {PM_LABELS[selectedMethod ?? ""] ?? ""}
                </Text>
                <View style={{ gap: 4 }}>
                  <Text style={{ fontSize: 12, color: dark ? "#c4b5fd" : "#5b21b6", fontFamily: "DMSans_400Regular" }}>
                    Numéro : <Text style={{ fontFamily: "DMSans_600SemiBold" }}>+243 XXX XXX XXX</Text>
                  </Text>
                  <Text style={{ fontSize: 12, color: dark ? "#c4b5fd" : "#5b21b6", fontFamily: "DMSans_400Regular" }}>
                    Nom : <Text style={{ fontFamily: "DMSans_600SemiBold" }}>Okapi Real Estate</Text>
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleCopyRef}
                  style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: dark ? "#27272a" : "#fff", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                    <Text style={{ fontSize: 11, color: mutedColor, fontFamily: "DMSans_400Regular" }}>Référence :</Text>
                    <Text style={{ fontFamily: "DMSans_700Bold", color: dark ? "#c4b5fd" : "#7c3aed", fontSize: 15, letterSpacing: 1.5 }}>{reference}</Text>
                  </View>
                  <Copy size={16} color={mutedColor} />
                </TouchableOpacity>
                <Text style={{ fontSize: 11, color: dark ? "#c4b5fd" : "#7c3aed", fontFamily: "DMSans_400Regular" }}>
                  ⚠ Incluez cette référence dans votre paiement.
                </Text>
              </View>

              <View style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 13, fontFamily: "DMSans_500Medium", color: textColor, marginBottom: 10 }}>
                  Joindre une capture du paiement (recommandé)
                </Text>
                {screenshotUploaded ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#d1fae5", borderRadius: 10, padding: 12 }}>
                    <Check size={16} color="#065f46" />
                    <Text style={{ color: "#065f46", fontFamily: "DMSans_500Medium", fontSize: 13 }}>Capture envoyée avec succès</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={handlePickScreenshot}
                    disabled={uploading}
                    style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, borderWidth: 2, borderColor, borderStyle: "dashed", paddingVertical: 20 }}
                  >
                    {uploading ? <ActivityIndicator color={accentColor} /> : <Upload size={18} color={mutedColor} />}
                    <Text style={{ fontSize: 13, color: mutedColor, fontFamily: "DMSans_500Medium" }}>
                      {uploading ? "Envoi en cours…" : "Choisir une capture"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                <TouchableOpacity
                  onPress={() => setStep(3)}
                  style={{ flex: 1, borderRadius: 12, borderWidth: 1.5, borderColor, paddingVertical: 13, alignItems: "center" }}
                >
                  <Text style={{ fontSize: 14, fontFamily: "DMSans_600SemiBold", color: textColor }}>Passer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setStep(3)}
                  disabled={uploading}
                  style={{ flex: 1, borderRadius: 12, backgroundColor: accentColor, paddingVertical: 13, alignItems: "center", opacity: uploading ? 0.5 : 1 }}
                >
                  <Text style={{ fontSize: 14, fontFamily: "DMSans_600SemiBold", color: "#fff" }}>Soumettre</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ── Step 3: Confirmation ── */}
          {step === 3 && (
            <View style={{ alignItems: "center", paddingVertical: 24, gap: 16 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#d1fae5", alignItems: "center", justifyContent: "center" }}>
                <Check size={32} color="#059669" />
              </View>
              <View style={{ alignItems: "center", gap: 6 }}>
                <Text style={{ fontSize: 18, fontFamily: "DMSans_700Bold", color: textColor }}>Demande envoyée !</Text>
                <Text style={{ fontSize: 13, color: mutedColor, fontFamily: "DMSans_400Regular", textAlign: "center", lineHeight: 20 }}>
                  Notre équipe traitera votre demande dans les 24–48h. Vous serez notifié par email dès validation.
                </Text>
              </View>
              <View style={{ backgroundColor: surface, borderRadius: 12, padding: 16, width: "100%", gap: 8 }}>
                <Text style={{ fontSize: 13, color: textColor, fontFamily: "DMSans_400Regular" }}>
                  <Text style={{ color: mutedColor }}>Formule : </Text>Plan Agence — $50/mois
                </Text>
                <Text style={{ fontSize: 13, color: textColor, fontFamily: "DMSans_400Regular" }}>
                  <Text style={{ color: mutedColor }}>Paiement : </Text>{PM_LABELS[selectedMethod ?? ""] ?? ""}
                </Text>
                <Text style={{ fontSize: 13, color: textColor, fontFamily: "DMSans_400Regular" }}>
                  <Text style={{ color: mutedColor }}>Référence : </Text>
                  <Text style={{ fontFamily: "DMSans_700Bold", color: accentColor, letterSpacing: 1 }}>{reference}</Text>
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => { onSuccess(); onClose(); }}
                style={{ backgroundColor: accentColor, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 32, width: "100%" }}
              >
                <Text style={{ fontSize: 14, fontFamily: "DMSans_600SemiBold", color: "#fff", textAlign: "center" }}>Terminer</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING:   { bg: "#fef3c7", text: "#92400e" },
  CONFIRMED: { bg: "#d1fae5", text: "#065f46" },
  REJECTED:  { bg: "#fee2e2", text: "#991b1b" },
  EXPIRED:   { bg: "#f1f5f9", text: "#64748b" },
};

const STATUS_LABELS: Record<string, string> = {
  PENDING:   "En attente",
  CONFIRMED: "Confirmé",
  REJECTED:  "Refusé",
  EXPIRED:   "Expiré",
};

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS.EXPIRED;
  return (
    <View style={{ backgroundColor: c.bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ color: c.text, fontSize: 11, fontFamily: "DMSans_600SemiBold" }}>{STATUS_LABELS[status] ?? status}</Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function AgenceAbonnementScreen() {
  const { token } = useAgentSessionStore();
  const { theme } = useThemeStore();
  const dark = theme === "dark";
  const t = useT().espaceAgence;
  const [showModal, setShowModal] = useState(false);
  const qc = useQueryClient();

  const bg = dark ? "#09090b" : "#f8fafc";
  const cardBg = dark ? "#1c1c1e" : "#fff";
  const textColor = dark ? "#f4f4f5" : "#1e293b";
  const mutedColor = dark ? "#a1a1aa" : "#64748b";
  const borderColor = dark ? "#3f3f46" : "#e2e8f0";
  const surface = dark ? "#27272a" : "#f8fafc";
  const accentColor = "#8b5cf6";

  const { data: subs = [], isLoading, refetch } = useQuery<SubscriptionRequest[]>({
    queryKey: ["my-subscriptions"],
    queryFn: () => getMySubscriptions(token!),
    enabled: !!token,
  });

  const agencySubs = subs.filter((s) => s.tier === "AGENCY");
  const hasActive = agencySubs.some((s) => s.status === "CONFIRMED");
  const activeSub = agencySubs.find((s) => s.status === "CONFIRMED");
  const pendingSub = agencySubs.find((s) => s.status === "PENDING");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={["top", "left", "right"]}>
      {/* Top bar */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: borderColor, backgroundColor: cardBg }}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ padding: 6, borderRadius: 10, backgroundColor: dark ? "#27272a" : "#f1f5f9" }}>
          <ArrowLeft size={20} color={textColor} />
        </Pressable>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: accentColor, alignItems: "center", justifyContent: "center" }}>
            <Building2 size={16} color="#fff" />
          </View>
          <Text style={{ fontSize: 18, fontFamily: "DMSans_700Bold", color: textColor }}>{t.agencySubsTitle}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>

        {/* Hero card */}
        <View style={{ borderRadius: 16, padding: 16, backgroundColor: dark ? "#2d1f4f" : "#f5f3ff", borderWidth: 1, borderColor: dark ? `${accentColor}44` : "#ddd6fe", flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: accentColor, alignItems: "center", justifyContent: "center" }}>
            <Building2 size={22} color="#fff" />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontSize: 14, fontFamily: "DMSans_700Bold", color: dark ? "#c4b5fd" : "#5b21b6" }}>{t.agencySubsTitle}</Text>
            <Text style={{ fontSize: 12, color: dark ? "#a78bfa" : "#7c3aed", fontFamily: "DMSans_400Regular" }}>{t.agencySubsHeroDesc}</Text>
          </View>
          {!hasActive && !pendingSub && (
            <TouchableOpacity
              onPress={() => setShowModal(true)}
              style={{ backgroundColor: accentColor, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}
            >
              <Text style={{ fontSize: 13, fontFamily: "DMSans_600SemiBold", color: "#fff" }}>Souscrire</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Active plan card */}
        {activeSub && (
          <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderColor, padding: 16, gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: `${accentColor}22`, alignItems: "center", justifyContent: "center" }}>
                <Star size={20} color={accentColor} fill={accentColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontFamily: "DMSans_700Bold", color: accentColor }}>Plan Agence actif</Text>
                <Text style={{ fontSize: 12, color: mutedColor, fontFamily: "DMSans_400Regular" }}>$50/mois</Text>
              </View>
              <StatusBadge status={activeSub.status} />
            </View>
            {activeSub.periodEnd && (
              <View style={{ backgroundColor: surface, borderRadius: 10, padding: 12 }}>
                <Text style={{ fontSize: 13, color: textColor, fontFamily: "DMSans_400Regular" }}>
                  <Text style={{ color: mutedColor }}>{t.agencySubsActiveUntil} : </Text>
                  <Text style={{ fontFamily: "DMSans_600SemiBold", color: "#059669" }}>{fmtDate(activeSub.periodEnd)}</Text>
                </Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => setShowModal(true)}
              style={{ borderRadius: 10, borderWidth: 1.5, borderColor: accentColor, paddingVertical: 10, alignItems: "center" }}
            >
              <Text style={{ fontSize: 14, fontFamily: "DMSans_600SemiBold", color: accentColor }}>{t.agencySubsRenewBtn}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Pending request card */}
        {pendingSub && (
          <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: "#fde68a", padding: 16, gap: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 14, fontFamily: "DMSans_600SemiBold", color: textColor }}>Demande en cours</Text>
              <StatusBadge status={pendingSub.status} />
            </View>
            <View style={{ backgroundColor: "#fffbeb", borderRadius: 8, padding: 10 }}>
              <Text style={{ fontSize: 12, color: "#92400e", fontFamily: "DMSans_400Regular" }}>
                Référence : <Text style={{ fontFamily: "DMSans_700Bold" }}>{pendingSub.paymentReference}</Text>
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: mutedColor, fontFamily: "DMSans_400Regular" }}>
              Notre équipe va vérifier votre paiement dans les 24–48h.
            </Text>
          </View>
        )}

        {/* No subscription — show plan features + CTA */}
        {!hasActive && !pendingSub && !isLoading && (
          <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderColor, padding: 16, gap: 12 }}>
            <Text style={{ fontSize: 14, fontFamily: "DMSans_600SemiBold", color: textColor }}>Ce que vous obtenez</Text>
            {[
              t.agencySubsFeature1,
              t.agencySubsFeature2,
              t.agencySubsFeature3,
              t.agencySubsFeature4,
            ].map((f, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "#d1fae5", alignItems: "center", justifyContent: "center" }}>
                  <Star size={12} color="#059669" fill="#059669" />
                </View>
                <Text style={{ flex: 1, fontSize: 13, color: textColor, fontFamily: "DMSans_400Regular" }}>{f}</Text>
              </View>
            ))}
            <TouchableOpacity
              onPress={() => setShowModal(true)}
              style={{ backgroundColor: accentColor, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 4 }}
            >
              <Text style={{ fontSize: 15, fontFamily: "DMSans_600SemiBold", color: "#fff" }}>{t.agencySubsSubscribeBtn}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* History of AGENCY subscription requests */}
        {agencySubs.length > 0 && (
          <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderColor, overflow: "hidden" }}>
            <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: borderColor }}>
              <Text style={{ fontSize: 14, fontFamily: "DMSans_600SemiBold", color: textColor }}>Historique</Text>
            </View>
            {agencySubs.map((sub, i) => (
              <View key={sub.id} style={{ paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: borderColor }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ fontSize: 13, fontFamily: "DMSans_500Medium", color: textColor }}>
                    ${sub.amount} · {PM_LABELS[sub.paymentMethod] ?? sub.paymentMethod}
                  </Text>
                  <StatusBadge status={sub.status} />
                </View>
                <Text style={{ fontSize: 12, color: mutedColor, fontFamily: "DMSans_400Regular" }}>
                  Réf : {sub.paymentReference}
                </Text>
                {sub.status === "CONFIRMED" && sub.periodEnd && (
                  <Text style={{ fontSize: 12, color: "#059669", fontFamily: "DMSans_500Medium", marginTop: 2 }}>
                    {t.agencySubsActiveUntil} {fmtDate(sub.periodEnd)}
                  </Text>
                )}
                {sub.status === "REJECTED" && sub.rejectionReason && (
                  <View style={{ backgroundColor: "#fee2e2", borderRadius: 8, padding: 8, marginTop: 6 }}>
                    <Text style={{ fontSize: 12, color: "#991b1b", fontFamily: "DMSans_500Medium" }}>
                      Raison : {sub.rejectionReason}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      <AgencySubscriptionModal
        visible={showModal}
        token={token ?? ""}
        t={t}
        onClose={() => setShowModal(false)}
        onSuccess={() => { refetch(); qc.invalidateQueries({ queryKey: ["my-subscriptions"] }); }}
      />
    </SafeAreaView>
  );
}
