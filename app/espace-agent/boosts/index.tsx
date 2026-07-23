import React, { useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Modal,
  ActivityIndicator, Alert, Clipboard, Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Zap, Check, Copy, Upload, Star, Clock, XCircle,
} from "lucide-react-native";
import { useAgentSessionStore } from "../../../src/store/useAgentSessionStore";
import { useThemeStore } from "../../../src/store/useThemeStore";
import { useT } from "../../../src/i18n/useT";
import { Colors } from "../../../src/constants/colors";
import {
  createBoostRequest,
  getMyBoosts,
  updateBoostScreenshot,
  presignBoostScreenshot,
  type BoostPaymentMethod,
  type BoostRequest,
} from "../../../src/services/agentAuth";
import { API_URL } from "../../../src/constants/api";

// ─── Plans ────────────────────────────────────────────────────────────────────

const BOOST_PLANS = [
  { days: 7,  amount: 5,  currency: "USD", recommended: false },
  { days: 15, amount: 9,  currency: "USD", recommended: true  },
  { days: 30, amount: 15, currency: "USD", recommended: false },
] as const;

const PAYMENT_METHODS: { key: BoostPaymentMethod; number: string }[] = [
  { key: "ORANGE_MONEY",  number: "+243 891 234 567" },
  { key: "MTN_MONEY",     number: "+243 971 234 567" },
  { key: "AIRTEL_MONEY",  number: "+243 991 234 567" },
  { key: "MPESA",         number: "+243 XXX XXX XXX" },
];

function pmLabel(key: BoostPaymentMethod, t: ReturnType<typeof useT>["espaceAgent"]) {
  const map: Record<BoostPaymentMethod, string> = {
    ORANGE_MONEY:  t.boostPayOrangeMoney,
    MTN_MONEY:     t.boostPayMtnMoney,
    AIRTEL_MONEY:  t.boostPayAirtelMoney,
    MPESA:         t.boostPayMpesa,
    CASH:          t.boostPayCash,
  };
  return map[key] ?? key;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-CD", { day: "2-digit", month: "long", year: "numeric" });
}

function makeRef(propertyId: string) {
  return `BOOST-${propertyId.slice(-6).toUpperCase()}`;
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

// ─── 3-Step Modal ─────────────────────────────────────────────────────────────

interface BoostModalProps {
  visible: boolean;
  propertyId: string;
  propertyTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

function BoostModal({ visible, propertyId, propertyTitle, onClose, onSuccess }: BoostModalProps) {
  const { token } = useAgentSessionStore();
  const { theme } = useThemeStore();
  const t = useT().espaceAgent;
  const isDark = theme === "dark";

  const bg      = isDark ? Colors.dark.background : "#fff";
  const card    = isDark ? Colors.dark.card        : "#f8fafc";
  const border  = isDark ? Colors.dark.border      : Colors.border;
  const text    = isDark ? Colors.dark.foreground  : Colors.foreground;
  const textMut = isDark ? Colors.dark.mutedFg     : Colors.mutedFg;
  const primary = isDark ? Colors.dark.primary     : Colors.primary;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPlan, setSelectedPlan] = useState(1); // index into BOOST_PLANS
  const [paymentMethod, setPaymentMethod] = useState<BoostPaymentMethod>("ORANGE_MONEY");
  const [boostRequest, setBoostRequest] = useState<BoostRequest | null>(null);
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [refCopied, setRefCopied] = useState(false);

  const plan = BOOST_PLANS[selectedPlan];
  const pm = PAYMENT_METHODS.find(m => m.key === paymentMethod) ?? PAYMENT_METHODS[0];

  function handleClose() {
    setStep(1);
    setSelectedPlan(1);
    setPaymentMethod("ORANGE_MONEY");
    setBoostRequest(null);
    setScreenshotUri(null);
    setRefCopied(false);
    onClose();
  }

  async function handleStep1Next() {
    if (!token) return;
    setCreating(true);
    try {
      const req = await createBoostRequest(token, propertyId, {
        durationDays: plan.days,
        amount: plan.amount,
        currency: plan.currency,
        paymentMethod,
      });
      setBoostRequest(req);
      setStep(2);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? t.boostErrCreate;
      Alert.alert(t.errAlertTitle, msg);
    } finally {
      setCreating(false);
    }
  }

  async function handlePickScreenshot() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setScreenshotUri(result.assets[0].uri);
    }
  }

  async function handleStep2Submit() {
    if (!token || !boostRequest) return;
    if (!screenshotUri) {
      // Allow submitting without screenshot (it's optional before confirming)
      setStep(3);
      onSuccess();
      return;
    }
    setUploading(true);
    try {
      // Detect MIME from URI extension
      const ext = screenshotUri.split("?")[0].split(".").pop()?.toLowerCase() ?? "jpg";
      const mime = ext === "png" ? "image/png" : ext === "heic" ? "image/heic" : "image/jpeg";
      const filename = `boost-${boostRequest.id}-${Date.now()}.${ext}`;

      const { key, url: uploadUrl } = await presignBoostScreenshot(token, filename, mime);

      // Read local file as blob using XHR (fetch(localUri).blob() is unreliable in React Native)
      const blob = await new Promise<Blob>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.responseType = "blob";
        xhr.onload = () => resolve(xhr.response as Blob);
        xhr.onerror = () => reject(new Error("Failed to read file"));
        xhr.open("GET", screenshotUri);
        xhr.send();
      });

      // PUT blob to presigned R2 URL
      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": mime },
        body: blob,
      });

      // Build public URL from key
      const R2_PUBLIC = (process.env.EXPO_PUBLIC_R2_PUBLIC_URL ?? "").replace(/\/$/, "");
      const publicUrl = key.startsWith("http") ? key : `${R2_PUBLIC}/${key}`;

      await updateBoostScreenshot(token, boostRequest.id, publicUrl);
      setStep(3);
      onSuccess();
    } catch {
      Alert.alert(t.errAlertTitle, t.boostErrUpload);
    } finally {
      setUploading(false);
    }
  }

  function copyRef() {
    if (!boostRequest) return;
    Clipboard.setString(makeRef(boostRequest.propertyId));
    setRefCopied(true);
    setTimeout(() => setRefCopied(false), 2500);
  }

  const stepLabels = [t.boostStep1, t.boostStep2, t.boostStep3];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: border }}>
          <TouchableOpacity onPress={handleClose} style={{ padding: 4, marginRight: 12 }}>
            <ArrowLeft size={20} color={text} />
          </TouchableOpacity>
          <Text style={{ flex: 1, color: text, fontSize: 16, fontFamily: "DMSans_700Bold" }}>{t.boostModalTitle}</Text>
        </View>

        {/* Step indicator */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, gap: 0 }}>
          {stepLabels.map((label, i) => {
            const idx = i + 1;
            const done = step > idx;
            const active = step === idx;
            return (
              <React.Fragment key={idx}>
                {i > 0 && <View style={{ flex: 1, height: 1, backgroundColor: done ? primary : border, marginHorizontal: 4 }} />}
                <View style={{ alignItems: "center", gap: 4 }}>
                  <View style={{
                    width: 26, height: 26, borderRadius: 13,
                    backgroundColor: done ? primary : active ? primary : card,
                    borderWidth: done || active ? 0 : 1.5, borderColor: border,
                    alignItems: "center", justifyContent: "center",
                  }}>
                    {done
                      ? <Check size={13} color="#fff" />
                      : <Text style={{ color: active ? "#fff" : textMut, fontSize: 12, fontFamily: "DMSans_600SemiBold" }}>{idx}</Text>}
                  </View>
                  <Text style={{ color: active ? primary : textMut, fontSize: 10, fontFamily: active ? "DMSans_600SemiBold" : "DMSans_400Regular" }}>{label}</Text>
                </View>
              </React.Fragment>
            );
          })}
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} showsVerticalScrollIndicator={false}>
          {/* ── Step 1: Plan + payment method ── */}
          {step === 1 && (
            <>
              <Text style={{ color: text, fontSize: 14, fontFamily: "DMSans_600SemiBold", marginBottom: 4 }}>
                {propertyTitle}
              </Text>

              {/* Plan cards */}
              <View style={{ gap: 10 }}>
                {BOOST_PLANS.map((p, i) => {
                  const active = selectedPlan === i;
                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={() => setSelectedPlan(i)}
                      style={{
                        borderRadius: 12, borderWidth: 2,
                        borderColor: active ? primary : border,
                        backgroundColor: active ? (isDark ? "#1a2733" : "#f0f9ff") : card,
                        padding: 14,
                        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                      }}
                    >
                      <View style={{ gap: 2 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <Text style={{ color: text, fontSize: 15, fontFamily: "DMSans_700Bold" }}>
                            {t.boostPlanDays.replace("{days}", String(p.days))}
                          </Text>
                          {p.recommended && (
                            <View style={{ backgroundColor: "#fef3c7", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
                              <Text style={{ color: "#92400e", fontSize: 10, fontFamily: "DMSans_600SemiBold" }}>{t.boostRecommended}</Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ color: textMut, fontSize: 12 }}>{p.amount} {p.currency}</Text>
                      </View>
                      <View style={{
                        width: 22, height: 22, borderRadius: 11,
                        borderWidth: 2, borderColor: active ? primary : border,
                        backgroundColor: active ? primary : "transparent",
                        alignItems: "center", justifyContent: "center",
                      }}>
                        {active && <Check size={12} color="#fff" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Payment method */}
              <Text style={{ color: text, fontSize: 13, fontFamily: "DMSans_600SemiBold", marginTop: 8 }}>{t.boostPayWith}</Text>
              <View style={{ gap: 8 }}>
                {PAYMENT_METHODS.map(m => {
                  const active = paymentMethod === m.key;
                  const label = pmLabel(m.key, t);
                  return (
                    <TouchableOpacity
                      key={m.key}
                      onPress={() => setPaymentMethod(m.key)}
                      style={{
                        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                        borderRadius: 10, borderWidth: 1.5,
                        borderColor: active ? primary : border,
                        backgroundColor: active ? (isDark ? "#1a2733" : "#f0f9ff") : card,
                        padding: 12,
                      }}
                    >
                      <Text style={{ color: text, fontSize: 13, fontFamily: active ? "DMSans_600SemiBold" : "DMSans_400Regular" }}>
                        {label}
                      </Text>
                      <View style={{
                        width: 18, height: 18, borderRadius: 9,
                        borderWidth: 2, borderColor: active ? primary : border,
                        backgroundColor: active ? primary : "transparent",
                        alignItems: "center", justifyContent: "center",
                      }}>
                        {active && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" }} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Next */}
              <TouchableOpacity
                onPress={handleStep1Next}
                disabled={creating}
                style={{ backgroundColor: primary, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 8, opacity: creating ? 0.7 : 1 }}
              >
                {creating
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={{ color: "#fff", fontSize: 15, fontFamily: "DMSans_700Bold" }}>{t.boostNextBtn}</Text>}
              </TouchableOpacity>
            </>
          )}

          {/* ── Step 2: Payment instructions + screenshot ── */}
          {step === 2 && boostRequest && (
            <>
              {/* Payment card */}
              <View style={{ backgroundColor: card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: border, gap: 12 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ color: textMut, fontSize: 12 }}>{t.boostPayWith}</Text>
                  <Text style={{ color: text, fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>
                    {pmLabel(paymentMethod, t)}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ color: textMut, fontSize: 12 }}>{t.boostPayNumber}</Text>
                  <Text style={{ color: text, fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>{pm.number}</Text>
                </View>
                <View style={{ height: 1, backgroundColor: border }} />
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ color: textMut, fontSize: 12 }}>{t.boostPayRef}</Text>
                  <TouchableOpacity onPress={copyRef} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ color: primary, fontSize: 13, fontFamily: "DMSans_700Bold" }}>
                      {makeRef(boostRequest.propertyId)}
                    </Text>
                    <Copy size={14} color={primary} />
                  </TouchableOpacity>
                </View>
                {refCopied && (
                  <Text style={{ color: "#22c55e", fontSize: 11, textAlign: "right" }}>{t.boostPayRefCopied}</Text>
                )}
                <View style={{ height: 1, backgroundColor: border }} />
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ color: textMut, fontSize: 12 }}>Montant</Text>
                  <Text style={{ color: text, fontSize: 14, fontFamily: "DMSans_700Bold" }}>
                    {boostRequest.amount} {boostRequest.currency}
                  </Text>
                </View>
              </View>

              {/* Screenshot upload */}
              <Text style={{ color: text, fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>{t.boostScreenshotLabel}</Text>
              <TouchableOpacity
                onPress={handlePickScreenshot}
                style={{
                  borderRadius: 12, borderWidth: 1.5, borderStyle: "dashed",
                  borderColor: screenshotUri ? primary : border,
                  padding: 16, alignItems: "center", gap: 8,
                  backgroundColor: screenshotUri ? (isDark ? "#1a2733" : "#f0f9ff") : card,
                }}
              >
                {screenshotUri ? (
                  <Image source={{ uri: screenshotUri }} style={{ width: "100%", height: 160, borderRadius: 8 }} contentFit="cover" />
                ) : (
                  <>
                    <Upload size={24} color={textMut} />
                    <Text style={{ color: textMut, fontSize: 13 }}>{t.boostScreenshotBtn}</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Submit */}
              <TouchableOpacity
                onPress={handleStep2Submit}
                disabled={uploading}
                style={{ backgroundColor: primary, borderRadius: 12, paddingVertical: 14, alignItems: "center", opacity: uploading ? 0.7 : 1 }}
              >
                {uploading
                  ? <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text style={{ color: "#fff", fontSize: 15, fontFamily: "DMSans_700Bold" }}>{t.boostScreenshotUploading}</Text>
                    </View>
                  : <Text style={{ color: "#fff", fontSize: 15, fontFamily: "DMSans_700Bold" }}>{t.boostSubmitBtn}</Text>}
              </TouchableOpacity>
            </>
          )}

          {/* ── Step 3: Confirmation ── */}
          {step === 3 && (
            <View style={{ alignItems: "center", padding: 32, gap: 16 }}>
              <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "#d1fae5", alignItems: "center", justifyContent: "center" }}>
                <Check size={36} color="#059669" />
              </View>
              <Text style={{ color: text, fontSize: 20, fontFamily: "DMSans_700Bold", textAlign: "center" }}>{t.boostConfirmTitle}</Text>
              <Text style={{ color: textMut, fontSize: 14, textAlign: "center", lineHeight: 22 }}>{t.boostConfirmDesc}</Text>
              <TouchableOpacity
                onPress={handleClose}
                style={{ backgroundColor: primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40, marginTop: 8 }}
              >
                <Text style={{ color: "#fff", fontSize: 15, fontFamily: "DMSans_700Bold" }}>{t.boostDoneBtn}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

type BoostTab = "PENDING" | "CONFIRMED" | "ALL";

export default function AgentBoostsScreen() {
  const { token } = useAgentSessionStore();
  const { theme } = useThemeStore();
  const t = useT().espaceAgent;
  const isDark = theme === "dark";
  const params = useLocalSearchParams<{ propertyId?: string; title?: string }>();
  const queryClient = useQueryClient();

  const bg      = isDark ? Colors.dark.background : Colors.backgroundAlt;
  const card    = isDark ? Colors.dark.card        : Colors.white;
  const border  = isDark ? Colors.dark.border      : Colors.border;
  const text    = isDark ? Colors.dark.foreground  : Colors.foreground;
  const textMut = isDark ? Colors.dark.mutedFg     : Colors.mutedFg;
  const primary = isDark ? Colors.dark.primary     : Colors.primary;

  const [activeTab, setActiveTab] = useState<BoostTab>("PENDING");
  const [modalVisible, setModalVisible] = useState(!!params.propertyId);
  const [selectedProperty, setSelectedProperty] = useState<{ id: string; title: string } | null>(
    params.propertyId ? { id: params.propertyId, title: decodeURIComponent(params.title ?? "") } : null,
  );

  const { data: boosts = [], isLoading, refetch, isRefetching } = useQuery<BoostRequest[]>({
    queryKey: ["agent-boosts", token],
    queryFn: () => getMyBoosts(token!),
    enabled: !!token,
  });

  const tabs: { key: BoostTab; label: string }[] = [
    { key: "PENDING",   label: t.boostTabPending },
    { key: "CONFIRMED", label: t.boostTabActive  },
    { key: "ALL",       label: t.boostTabHistory },
  ];

  const filtered = activeTab === "ALL"
    ? boosts
    : boosts.filter(b => b.status === activeTab);

  const statusLabel: Record<string, string> = {
    PENDING:   t.boostStatusPending,
    CONFIRMED: t.boostStatusConfirmed,
    REJECTED:  t.boostStatusRejected,
    EXPIRED:   t.boostStatusExpired,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 10 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <ArrowLeft size={20} color={text} />
        </TouchableOpacity>
        <Text style={{ flex: 1, color: text, fontSize: 18, fontFamily: "DMSans_700Bold" }}>{t.boostsTitle}</Text>
      </View>

      {/* Tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, paddingTop: 4, gap: 8, flexDirection: "row", alignItems: "center" }}
      >
        {tabs.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={{
                paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                backgroundColor: isActive ? primary : card,
                borderWidth: 1.5, borderColor: isActive ? primary : border,
              }}
            >
              <Text style={{ color: isActive ? "#fff" : textMut, fontSize: 13, fontFamily: isActive ? "DMSans_600SemiBold" : "DMSans_400Regular" }}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={primary} size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: isDark ? "#1a2733" : "#f0f9ff", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <Zap size={28} color={primary} />
          </View>
          <Text style={{ color: text, fontSize: 16, fontFamily: "DMSans_700Bold", marginBottom: 6 }}>{t.boostEmpty}</Text>
          <Text style={{ color: textMut, fontSize: 14, textAlign: "center" }}>{t.boostEmptyDesc}</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          refreshControl={
            <Pressable onPress={() => refetch()} />
          }
        >
          {filtered.map(b => (
            <View key={b.id} style={{ backgroundColor: card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: border, gap: 10 }}>
              {/* Title + status */}
              <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <Text style={{ flex: 1, color: text, fontSize: 14, fontFamily: "DMSans_600SemiBold" }} numberOfLines={2}>
                  {b.property?.title ?? "—"}
                </Text>
                <StatusBadge status={b.status} label={statusLabel[b.status] ?? b.status} />
              </View>

              {/* Details */}
              <View style={{ gap: 6 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: textMut, fontSize: 12 }}>Plan</Text>
                  <Text style={{ color: text, fontSize: 12, fontFamily: "DMSans_600SemiBold" }}>
                    {t.boostPlanDays.replace("{days}", String(b.durationDays))} — {b.amount} {b.currency}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: textMut, fontSize: 12 }}>Référence</Text>
                  <Text style={{ color: text, fontSize: 12, fontFamily: "DMSans_600SemiBold" }}>
                    {b.paymentReference}
                  </Text>
                </View>
                {b.status === "CONFIRMED" && b.confirmedAt && (
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: textMut, fontSize: 12 }}>{t.boostActiveUntil}</Text>
                    <Text style={{ color: "#059669", fontSize: 12, fontFamily: "DMSans_600SemiBold" }}>
                      {fmtDate(new Date(new Date(b.confirmedAt).getTime() + b.durationDays * 86400000).toISOString())}
                    </Text>
                  </View>
                )}
                {b.status === "REJECTED" && b.rejectionReason && (
                  <View style={{ backgroundColor: "#fee2e2", borderRadius: 8, padding: 8, flexDirection: "row", gap: 6 }}>
                    <XCircle size={12} color="#991b1b" style={{ marginTop: 1 }} />
                    <Text style={{ color: "#991b1b", fontSize: 12, flex: 1 }}>
                      {t.boostRejectedReason} : {b.rejectionReason}
                    </Text>
                  </View>
                )}
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: textMut, fontSize: 12 }}>Date</Text>
                  <Text style={{ color: textMut, fontSize: 12 }}>{fmtDate(b.createdAt)}</Text>
                </View>
              </View>
            </View>
          ))}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}

      {/* Modal */}
      {selectedProperty && (
        <BoostModal
          visible={modalVisible}
          propertyId={selectedProperty.id}
          propertyTitle={selectedProperty.title}
          onClose={() => {
            setModalVisible(false);
            setSelectedProperty(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["agent-boosts"] });
          }}
        />
      )}
    </SafeAreaView>
  );
}
