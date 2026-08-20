import React, { useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Modal,
  ActivityIndicator, Alert, Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Star, Check, Copy, Upload, XCircle,
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
  type SubscriptionTier,
} from "../../../src/services/agentAuth";
import { API_URL } from "../../../src/constants/api";

// ─── Plans ────────────────────────────────────────────────────────────────────

const PLANS: { tier: SubscriptionTier; amount: number; currency: string }[] = [
  { tier: "PRO",    amount: 15, currency: "USD" },
  { tier: "AGENCY", amount: 50, currency: "USD" },
];

const PAYMENT_METHODS: BoostPaymentMethod[] = [
  "ORANGE_MONEY", "MTN_MONEY", "AIRTEL_MONEY", "MPESA",
];

function pmLabel(key: BoostPaymentMethod, t: ReturnType<typeof useT>["espaceAgent"]) {
  const map: Record<BoostPaymentMethod, string> = {
    ORANGE_MONEY:  t.subsPayOrangeMoney,
    MTN_MONEY:     t.subsPayMtnMoney,
    AIRTEL_MONEY:  t.subsPayAirtelMoney,
    MPESA:         t.subsPayMpesa,
    CASH:          "Cash",
  };
  return map[key] ?? key;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-CD", { day: "2-digit", month: "long", year: "numeric" });
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING:   { bg: "#fef3c7", text: "#92400e" },
  CONFIRMED: { bg: "#d1fae5", text: "#065f46" },
  REJECTED:  { bg: "#fee2e2", text: "#991b1b" },
  EXPIRED:   { bg: "#f1f5f9", text: "#64748b" },
};

function StatusBadge({ status, label }: { status: string; label: string }) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS.EXPIRED;
  return (
    <View style={{ backgroundColor: c.bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ color: c.text, fontSize: 11, fontFamily: "DMSans_600SemiBold" }}>{label}</Text>
    </View>
  );
}

// ─── 3-step modal ─────────────────────────────────────────────────────────────

function SubscriptionModal({
  visible, token, t, onClose, onSuccess,
}: {
  visible: boolean;
  token: string;
  t: ReturnType<typeof useT>["espaceAgent"];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { theme } = useThemeStore();
  const dark = theme === "dark";
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
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

  const planDetails = PLANS.find((p) => p.tier === selectedTier);
  const planLabel = selectedTier === "PRO" ? t.subsPlanPro : t.subsPlanAgency;
  const planPrice = selectedTier === "PRO" ? t.subsPlanProPrice : t.subsPlanAgencyPrice;

  const handleSubmit = async () => {
    if (!selectedTier || !selectedMethod) return;
    setSubmitting(true);
    try {
      const req = await createSubscriptionRequest(token, { tier: selectedTier, paymentMethod: selectedMethod });
      setSubId(req.id);
      setReference(req.paymentReference ?? "");
      setStep(2);
    } catch (e: any) {
      Alert.alert("Erreur", e?.response?.data?.message ?? t.subsErrCreate);
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
      Alert.alert("Erreur", e?.response?.data?.message ?? t.subsErrUpload);
    } finally {
      setUploading(false);
    }
  };

  const handleCopyRef = async () => {
    await Clipboard.setStringAsync(reference);
    Alert.alert("", t.subsPayRefCopied);
  };

  const STEPS = [t.subsStep1, t.subsStep2, t.subsStep3];

  const planFeatures = (tier: SubscriptionTier) =>
    tier === "PRO"
      ? [t.subsPlanProFeature1, t.subsPlanProFeature2, t.subsPlanProFeature3]
      : [t.subsPlanAgencyFeature1, t.subsPlanAgencyFeature2, t.subsPlanAgencyFeature3];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderColor }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {step > 1 && (
              <Pressable onPress={() => setStep((s) => (s - 1) as 1|2|3)} hitSlop={10}>
                <ArrowLeft size={20} color={textColor} />
              </Pressable>
            )}
            <Text style={{ fontSize: 17, fontFamily: "DMSans_600SemiBold", color: textColor }}>{t.subsTitle}</Text>
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
                    backgroundColor: done || active ? Colors.primary : borderColor,
                    alignItems: "center", justifyContent: "center",
                  }}>
                    {done
                      ? <Check size={14} color="#fff" />
                      : <Text style={{ fontSize: 12, fontFamily: "DMSans_700Bold", color: done || active ? "#fff" : mutedColor }}>{idx}</Text>
                    }
                  </View>
                  <Text style={{ fontSize: 10, fontFamily: "DMSans_500Medium", color: active ? Colors.primary : mutedColor }}>{label}</Text>
                </View>
                {i < STEPS.length - 1 && (
                  <View style={{ flex: 1, height: 2, backgroundColor: done ? Colors.primary : borderColor, marginBottom: 16, marginHorizontal: 6 }} />
                )}
              </React.Fragment>
            );
          })}
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 16 }}>
          {/* ── Step 1 ── */}
          {step === 1 && (
            <>
              {PLANS.map((plan) => {
                const isSelected = selectedTier === plan.tier;
                const features = planFeatures(plan.tier);
                const label = plan.tier === "PRO" ? t.subsPlanPro : t.subsPlanAgency;
                const price = plan.tier === "PRO" ? t.subsPlanProPrice : t.subsPlanAgencyPrice;
                const accentColor = plan.tier === "PRO" ? "#3b82f6" : "#8b5cf6";

                return (
                  <TouchableOpacity
                    key={plan.tier}
                    onPress={() => setSelectedTier(plan.tier)}
                    style={{
                      borderRadius: 14, borderWidth: 2,
                      borderColor: isSelected ? accentColor : borderColor,
                      backgroundColor: isSelected ? (dark ? `${accentColor}22` : `${accentColor}11`) : surface,
                      padding: 16, marginBottom: 12,
                    }}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: `${accentColor}22`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                        <Star size={14} color={accentColor} fill={accentColor} />
                        <Text style={{ color: accentColor, fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>{label}</Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <Text style={{ fontSize: 18, fontFamily: "DMSans_700Bold", color: accentColor }}>{price}</Text>
                        <View style={{
                          width: 22, height: 22, borderRadius: 11, borderWidth: 2,
                          borderColor: isSelected ? accentColor : borderColor,
                          backgroundColor: isSelected ? accentColor : "transparent",
                          alignItems: "center", justifyContent: "center",
                        }}>
                          {isSelected && <Check size={12} color="#fff" />}
                        </View>
                      </View>
                    </View>
                    {features.map((f, fi) => (
                      <View key={fi} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
                        <Check size={13} color="#22c55e" />
                        <Text style={{ fontSize: 12, color: mutedColor, fontFamily: "DMSans_400Regular", flex: 1 }}>{f}</Text>
                      </View>
                    ))}
                  </TouchableOpacity>
                );
              })}

              <Text style={{ fontSize: 12, fontFamily: "DMSans_600SemiBold", color: mutedColor, textTransform: "uppercase", letterSpacing: 0.8, marginTop: 8, marginBottom: 8 }}>
                {t.subsPayWith}
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
                        borderColor: isSel ? Colors.primary : borderColor,
                        backgroundColor: isSel ? (dark ? "#1e3a5f" : "#eff6ff") : surface,
                      }}
                    >
                      <Text style={{ fontSize: 13, fontFamily: "DMSans_500Medium", color: isSel ? Colors.primary : textColor }}>{pmLabel(m, t)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!selectedTier || !selectedMethod || submitting}
                style={{
                  backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14,
                  alignItems: "center", marginTop: 8,
                  opacity: !selectedTier || !selectedMethod || submitting ? 0.5 : 1,
                }}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={{ fontSize: 15, fontFamily: "DMSans_600SemiBold", color: "#fff" }}>{t.subsNextBtn}</Text>
                }
              </TouchableOpacity>
            </>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <>
              <View style={{ backgroundColor: dark ? "#1e3a5f" : "#eff6ff", borderRadius: 14, padding: 16, gap: 12, borderWidth: 1, borderColor: dark ? "#2563eb44" : "#bfdbfe" }}>
                <Text style={{ fontSize: 14, fontFamily: "DMSans_600SemiBold", color: dark ? "#93c5fd" : "#1e40af" }}>
                  {planLabel} — {planPrice} · {selectedMethod ? pmLabel(selectedMethod, t) : ""}
                </Text>
                <View style={{ gap: 4 }}>
                  <Text style={{ fontSize: 12, color: dark ? "#93c5fd" : "#1e40af", fontFamily: "DMSans_400Regular" }}>
                    {t.subsPayNumber} : <Text style={{ fontFamily: "DMSans_600SemiBold" }}>+243 XXX XXX XXX</Text>
                  </Text>
                  <Text style={{ fontSize: 12, color: dark ? "#93c5fd" : "#1e40af", fontFamily: "DMSans_400Regular" }}>
                    Nom : <Text style={{ fontFamily: "DMSans_600SemiBold" }}>Okapi Real Estate</Text>
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleCopyRef}
                  style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: dark ? "#27272a" : "#fff", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                    <Text style={{ fontSize: 11, color: mutedColor, fontFamily: "DMSans_400Regular" }}>{t.subsPayRef} :</Text>
                    <Text style={{ fontFamily: "DMSans_700Bold", color: dark ? "#93c5fd" : "#1d4ed8", fontSize: 15, letterSpacing: 1.5 }}>{reference}</Text>
                  </View>
                  <Copy size={16} color={mutedColor} />
                </TouchableOpacity>
                <Text style={{ fontSize: 11, color: dark ? "#93c5fd" : "#3b82f6", fontFamily: "DMSans_400Regular" }}>
                  ⚠ {t.subsPayRefWarning}
                </Text>
              </View>

              <View style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 13, fontFamily: "DMSans_500Medium", color: textColor, marginBottom: 10 }}>
                  {t.subsScreenshotLabel}
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
                    {uploading ? <ActivityIndicator color={Colors.primary} /> : <Upload size={18} color={mutedColor} />}
                    <Text style={{ fontSize: 13, color: mutedColor, fontFamily: "DMSans_500Medium" }}>
                      {uploading ? t.subsScreenshotUploading : t.subsScreenshotBtn}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                <TouchableOpacity
                  onPress={() => setStep(3)}
                  style={{ flex: 1, borderRadius: 12, borderWidth: 1.5, borderColor, paddingVertical: 13, alignItems: "center" }}
                >
                  <Text style={{ fontSize: 14, fontFamily: "DMSans_600SemiBold", color: textColor }}>{t.subsNextBtn}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setStep(3)}
                  disabled={uploading}
                  style={{ flex: 1, borderRadius: 12, backgroundColor: Colors.primary, paddingVertical: 13, alignItems: "center", opacity: uploading ? 0.5 : 1 }}
                >
                  <Text style={{ fontSize: 14, fontFamily: "DMSans_600SemiBold", color: "#fff" }}>{t.subsSubmitBtn}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ── Step 3 ── */}
          {step === 3 && (
            <View style={{ alignItems: "center", paddingVertical: 24, gap: 16 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#d1fae5", alignItems: "center", justifyContent: "center" }}>
                <Check size={32} color="#059669" />
              </View>
              <View style={{ alignItems: "center", gap: 6 }}>
                <Text style={{ fontSize: 18, fontFamily: "DMSans_700Bold", color: textColor }}>{t.subsConfirmTitle}</Text>
                <Text style={{ fontSize: 13, color: mutedColor, fontFamily: "DMSans_400Regular", textAlign: "center", lineHeight: 20 }}>{t.subsConfirmDesc}</Text>
              </View>
              <View style={{ backgroundColor: surface, borderRadius: 12, padding: 16, width: "100%", gap: 8 }}>
                <Text style={{ fontSize: 13, color: textColor, fontFamily: "DMSans_400Regular" }}>
                  <Text style={{ color: mutedColor }}>Formule : </Text>{planLabel} — {planPrice}
                </Text>
                <Text style={{ fontSize: 13, color: textColor, fontFamily: "DMSans_400Regular" }}>
                  <Text style={{ color: mutedColor }}>Paiement : </Text>{selectedMethod ? pmLabel(selectedMethod, t) : ""}
                </Text>
                <Text style={{ fontSize: 13, color: textColor, fontFamily: "DMSans_400Regular" }}>
                  <Text style={{ color: mutedColor }}>Référence : </Text>
                  <Text style={{ fontFamily: "DMSans_700Bold", color: Colors.primary, letterSpacing: 1 }}>{reference}</Text>
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => { onSuccess(); onClose(); }}
                style={{ backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 32, width: "100%" }}
              >
                <Text style={{ fontSize: 14, fontFamily: "DMSans_600SemiBold", color: "#fff", textAlign: "center" }}>{t.subsDoneBtn}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Subscription card ────────────────────────────────────────────────────────

function SubscriptionCard({
  sub, t, dark,
}: {
  sub: SubscriptionRequest;
  t: ReturnType<typeof useT>["espaceAgent"];
  dark: boolean;
}) {
  const textColor = dark ? "#f4f4f5" : "#1e293b";
  const mutedColor = dark ? "#a1a1aa" : "#64748b";
  const surface = dark ? "#27272a" : "#f8fafc";
  const borderColor = dark ? "#3f3f46" : "#e2e8f0";

  const statusLabels: Record<string, string> = {
    PENDING:   t.subsStatusPending,
    CONFIRMED: t.subsStatusConfirmed,
    REJECTED:  t.subsStatusRejected,
    EXPIRED:   t.subsStatusExpired,
  };

  const accentColor = sub.tier === "PRO" ? "#3b82f6" : "#8b5cf6";

  return (
    <View style={{ backgroundColor: dark ? "#1c1c1e" : "#fff", borderRadius: 16, borderWidth: 1, borderColor, marginBottom: 12, overflow: "hidden" }}>
      <View style={{ padding: 16, gap: 12 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: `${accentColor}22`, alignItems: "center", justifyContent: "center" }}>
              <Star size={20} color={accentColor} fill={accentColor} />
            </View>
            <View>
              <Text style={{ fontSize: 16, fontFamily: "DMSans_700Bold", color: accentColor }}>
                {sub.tier === "PRO" ? t.subsPlanPro : t.subsPlanAgency}
              </Text>
              <Text style={{ fontSize: 12, color: mutedColor, fontFamily: "DMSans_400Regular" }}>
                {sub.tier === "PRO" ? t.subsPlanProPrice : t.subsPlanAgencyPrice}
              </Text>
            </View>
          </View>
          <StatusBadge status={sub.status} label={statusLabels[sub.status] ?? sub.status} />
        </View>

        {/* Details */}
        <View style={{ backgroundColor: surface, borderRadius: 10, padding: 12, gap: 6 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 12, color: mutedColor, fontFamily: "DMSans_400Regular" }}>Paiement</Text>
            <Text style={{ fontSize: 12, color: textColor, fontFamily: "DMSans_500Medium" }}>
              {sub.paymentMethod.replace(/_/g, " ")}
            </Text>
          </View>
          {sub.paymentReference && (
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 12, color: mutedColor, fontFamily: "DMSans_400Regular" }}>Référence</Text>
              <Text style={{ fontSize: 12, color: Colors.primary, fontFamily: "DMSans_700Bold", letterSpacing: 1 }}>{sub.paymentReference}</Text>
            </View>
          )}
          {sub.status === "CONFIRMED" && sub.periodEnd && (
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 12, color: mutedColor, fontFamily: "DMSans_400Regular" }}>{t.subsActiveUntil}</Text>
              <Text style={{ fontSize: 12, color: "#059669", fontFamily: "DMSans_600SemiBold" }}>{fmtDate(sub.periodEnd)}</Text>
            </View>
          )}
          {sub.status === "REJECTED" && sub.rejectionReason && (
            <View style={{ backgroundColor: "#fee2e2", borderRadius: 8, padding: 8, marginTop: 4 }}>
              <Text style={{ fontSize: 12, color: "#991b1b", fontFamily: "DMSans_500Medium" }}>
                {t.subsRejectedReason} : {sub.rejectionReason}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

type Tab = "PENDING" | "ACTIVE" | "HISTORY";

export default function AbonnementScreen() {
  const { token } = useAgentSessionStore();
  const { theme } = useThemeStore();
  const dark = theme === "dark";
  const t = useT().espaceAgent;
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState<Tab>("PENDING");
  const qc = useQueryClient();

  const bg = dark ? "#09090b" : "#f8fafc";
  const cardBg = dark ? "#1c1c1e" : "#fff";
  const textColor = dark ? "#f4f4f5" : "#1e293b";
  const mutedColor = dark ? "#a1a1aa" : "#64748b";
  const borderColor = dark ? "#3f3f46" : "#e2e8f0";

  const { data: subs = [], isLoading, refetch } = useQuery<SubscriptionRequest[]>({
    queryKey: ["my-subscriptions"],
    queryFn: () => getMySubscriptions(token!),
    enabled: !!token,
  });

  const filtered = subs.filter((s) => {
    if (tab === "PENDING") return s.status === "PENDING";
    if (tab === "ACTIVE") return s.status === "CONFIRMED";
    return s.status === "REJECTED" || s.status === "EXPIRED";
  });

  const hasActive = subs.some((s) => s.status === "CONFIRMED");

  const tabs: { key: Tab; label: string }[] = [
    { key: "PENDING", label: t.subsTabPending },
    { key: "ACTIVE",  label: t.subsTabActive },
    { key: "HISTORY", label: t.subsTabHistory },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={["top", "left", "right"]}>
      {/* Top bar */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor, backgroundColor: cardBg }}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ padding: 6, borderRadius: 10, backgroundColor: dark ? "#27272a" : "#f1f5f9" }}>
          <ArrowLeft size={20} color={textColor} />
        </Pressable>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: "#6366f1", alignItems: "center", justifyContent: "center" }}>
            <Star size={16} color="#fff" fill="#fff" />
          </View>
          <Text style={{ fontSize: 18, fontFamily: "DMSans_700Bold", color: textColor }}>{t.subsTitle}</Text>
        </View>
      </View>

      {/* Hero */}
      <View style={{ margin: 16, padding: 16, borderRadius: 16, backgroundColor: dark ? "#1e1b4b" : "#eef2ff", borderWidth: 1, borderColor: dark ? "#4338ca44" : "#c7d2fe", flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#6366f1", alignItems: "center", justifyContent: "center" }}>
          <Star size={22} color="#fff" fill="#fff" />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: 14, fontFamily: "DMSans_700Bold", color: dark ? "#a5b4fc" : "#3730a3" }}>{t.subsTitle}</Text>
          <Text style={{ fontSize: 12, color: dark ? "#818cf8" : "#4338ca", fontFamily: "DMSans_400Regular" }}>{t.subsHeroDesc}</Text>
        </View>
        {!hasActive && (
          <TouchableOpacity
            onPress={() => setShowModal(true)}
            style={{ backgroundColor: "#6366f1", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}
          >
            <Text style={{ fontSize: 13, fontFamily: "DMSans_600SemiBold", color: "#fff" }}>{t.subsSubscribeBtn}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: "row", paddingHorizontal: 16, gap: 4, marginBottom: 8 }}>
        {tabs.map((tabItem) => {
          const cnt = subs.filter((s) =>
            tabItem.key === "PENDING" ? s.status === "PENDING"
            : tabItem.key === "ACTIVE" ? s.status === "CONFIRMED"
            : ["REJECTED","EXPIRED"].includes(s.status)
          ).length;
          const isActive = tab === tabItem.key;
          return (
            <TouchableOpacity
              key={tabItem.key}
              onPress={() => setTab(tabItem.key)}
              style={{ flex: 1, alignItems: "center", paddingVertical: 8, borderBottomWidth: 2, borderColor: isActive ? Colors.primary : "transparent" }}
            >
              <Text style={{ fontSize: 13, fontFamily: isActive ? "DMSans_600SemiBold" : "DMSans_400Regular", color: isActive ? Colors.primary : mutedColor }}>
                {tabItem.label}{cnt > 0 ? ` (${cnt})` : ""}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 }}>
          <View style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: dark ? "#27272a" : "#f1f5f9", alignItems: "center", justifyContent: "center" }}>
            <Star size={30} color={mutedColor} />
          </View>
          <Text style={{ fontSize: 16, fontFamily: "DMSans_600SemiBold", color: textColor }}>{t.subsEmpty}</Text>
          <Text style={{ fontSize: 13, color: mutedColor, fontFamily: "DMSans_400Regular", textAlign: "center" }}>{t.subsEmptyDesc}</Text>
          {tab === "PENDING" && !hasActive && (
            <TouchableOpacity
              onPress={() => setShowModal(true)}
              style={{ backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 4 }}
            >
              <Text style={{ color: "#fff", fontFamily: "DMSans_600SemiBold", fontSize: 14 }}>{t.subsSubscribeBtn}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {filtered.map((sub) => (
            <SubscriptionCard key={sub.id} sub={sub} t={t} dark={dark} />
          ))}
        </ScrollView>
      )}

      <SubscriptionModal
        visible={showModal}
        token={token ?? ""}
        t={t}
        onClose={() => setShowModal(false)}
        onSuccess={() => { refetch(); qc.invalidateQueries({ queryKey: ["my-subscriptions"] }); }}
      />
    </SafeAreaView>
  );
}
