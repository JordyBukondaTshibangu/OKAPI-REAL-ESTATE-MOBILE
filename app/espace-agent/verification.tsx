import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import axios from "axios";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, Upload } from "lucide-react-native";
import { useAgentSessionStore } from "../../src/store/useAgentSessionStore";
import { useThemeStore } from "../../src/store/useThemeStore";
import { useT } from "../../src/i18n/useT";
import {
  submitAgentIdentity,
  getMyAgentProfile,
} from "../../src/services/agentAuth";
import { Colors } from "../../src/constants/colors";
import { API_URL } from "../../src/constants/api";

/** Map the free-text label stored by profil.tsx to the ExperienceRange enum */
function labelToExperienceRange(
  label: string | null | undefined,
): ExperienceRange | null {
  switch (label) {
    case "< 1 an":
      return "LESS_THAN_1";
    case "1 à 3 ans":
      return "ONE_TO_3";
    case "3 à 5 ans":
      return "THREE_TO_5";
    case "> 5 ans":
      return "FIVE_PLUS";
    default:
      return null;
  }
}

const COMMUNES = [
  "Bandalungwa",
  "Barumbu",
  "Bumbu",
  "Gombe",
  "Kalamu",
  "Kasa-Vubu",
  "Kimbanseke",
  "Kinshasa",
  "Kintambo",
  "Kisenso",
  "Lemba",
  "Limete",
  "Lingwala",
  "Makala",
  "Maluku",
  "Masina",
  "Matete",
  "Mont-Ngafula",
  "Ngaba",
  "Ngaliema",
  "Ngiri-Ngiri",
  "Nsele",
  "Selembao",
  "Ndjili",
];

const PROPERTY_TYPE_OPTIONS = ["Résidentiel", "Commercial", "Les deux"];

type ExperienceRange = "LESS_THAN_1" | "ONE_TO_3" | "THREE_TO_5" | "FIVE_PLUS";
type AgentTypeVal = "COMMISSIONNAIRE" | "AGENT" | "AGENCY_OWNER" | "OTHER";

function SectionLabel({ label, color }: { label: string; color: string }) {
  return (
    <Text
      style={{
        color,
        fontSize: 10,
        fontFamily: "DMSans_600SemiBold",
        letterSpacing: 0.9,
        textTransform: "uppercase",
        marginBottom: 10,
        marginTop: 4,
      }}
    >
      {label}
    </Text>
  );
}

export default function VerificationScreen() {
  const { token } = useAgentSessionStore();
  const { theme } = useThemeStore();
  const t = useT().verification;
  const isDark = theme === "dark";

  const bg = isDark ? Colors.dark.background : Colors.backgroundAlt;
  const card = isDark ? Colors.dark.card : Colors.white;
  const border = isDark ? Colors.dark.border : Colors.border;
  const text = isDark ? Colors.dark.foreground : Colors.foreground;
  const textMut = isDark ? Colors.dark.mutedFg : Colors.mutedFg;
  const primary = isDark ? Colors.dark.primary : Colors.primary;
  const inputBg = isDark ? Colors.dark.muted : Colors.backgroundAlt;

  // Section 1: Identity
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [nationalIdNumber, setNationalIdNumber] = useState("");
  const [idPhotoUri, setIdPhotoUri] = useState<string | null>(null);
  const [idDocumentKey, setIdDocumentKey] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [selfieKey, setSelfieKey] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState(false);
  const [uploadingSelfie, setUploadingSelfie] = useState(false);

  // Section 2: Professional
  const [agentType, setAgentType] = useState<AgentTypeVal>("COMMISSIONNAIRE");
  const [experienceRange, setExperienceRange] =
    useState<ExperienceRange | null>(null);
  const [communes, setCommunes] = useState<string[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);

  // Section 3: Presence
  const [residenceCommune, setResidenceCommune] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Fetch current profile so we can pre-fill fields already saved from "Modifier mon profil"
  const { data: profileData } = useQuery({
    queryKey: ["agentProfile", token],
    queryFn: () => getMyAgentProfile(token!),
    enabled: !!token,
    staleTime: 1_000 * 60 * 5,
  });

  useEffect(() => {
    if (!profileData) return;
    const p = profileData as any;

    // Pre-fill professional section from saved profile
    if (p.agentType) setAgentType(p.agentType as AgentTypeVal);
    if (Array.isArray(p.communes) && p.communes.length > 0)
      setCommunes(p.communes);

    // experienceRange (enum) takes priority; fall back to mapping yearsExperienceLabel
    if (p.experienceRange) {
      setExperienceRange(p.experienceRange as ExperienceRange);
    } else if (p.yearsExperienceLabel) {
      const mapped = labelToExperienceRange(p.yearsExperienceLabel);
      if (mapped) setExperienceRange(mapped);
    }

    // Pre-fill residence commune if already set
    if (p.residenceCommune) setResidenceCommune(p.residenceCommune);

    // Pre-fill date of birth if already submitted before
    if (p.dateOfBirth) setDateOfBirth(new Date(p.dateOfBirth));
  }, [profileData]);

  const AGENT_TYPES: { value: AgentTypeVal; label: string }[] = [
    { value: "COMMISSIONNAIRE", label: t.agentTypes.COMMISSIONNAIRE },
    { value: "AGENT", label: t.agentTypes.AGENT },
    { value: "AGENCY_OWNER", label: t.agentTypes.AGENCY_OWNER },
    { value: "OTHER", label: t.agentTypes.OTHER },
  ];

  const EXPERIENCE_RANGES: { value: ExperienceRange; label: string }[] = [
    { value: "LESS_THAN_1", label: t.experienceRanges.LESS_THAN_1 },
    { value: "ONE_TO_3", label: t.experienceRanges.ONE_TO_3 },
    { value: "THREE_TO_5", label: t.experienceRanges.THREE_TO_5 },
    { value: "FIVE_PLUS", label: t.experienceRanges.FIVE_PLUS },
  ];

  const inputStyle = {
    backgroundColor: inputBg,
    borderWidth: 1,
    borderColor: border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: text,
    fontFamily: "DMSans_400Regular",
  } as const;

  function toggleCommune(val: string) {
    setCommunes((prev) =>
      prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val],
    );
  }

  function togglePropertyType(val: string) {
    setPropertyTypes((prev) =>
      prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val],
    );
  }

  async function uploadImage(
    uri: string,
    mimeType: string,
    fileName: string,
    endpoint: string,
  ): Promise<string> {
    // Get presigned URL + R2 key
    const {
      data: { url, key },
    } = await axios.post(
      `${API_URL}/${endpoint}`,
      { filename: fileName, contentType: mimeType },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const blob = await fetch(uri).then((r) => r.blob());
    const uploadRes = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": mimeType },
      body: blob,
    });
    if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`);
    return key; // return the R2 key, not the CDN URL
  }

  async function pickIdPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t.permissionDenied, t.permissionDeniedMsg);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setUploadingId(true);
    try {
      const key = await uploadImage(
        asset.uri,
        asset.mimeType ?? "image/jpeg",
        asset.fileName ?? "id-card.jpg",
        "uploads/presign-agent-avatar",
      );
      setIdPhotoUri(asset.uri);
      setIdDocumentKey(key);
    } catch {
      Alert.alert("Erreur", t.errGeneric);
    } finally {
      setUploadingId(false);
    }
  }

  async function pickSelfie() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t.permissionDenied, t.permissionDeniedMsg);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setUploadingSelfie(true);
    try {
      const key = await uploadImage(
        asset.uri,
        asset.mimeType ?? "image/jpeg",
        asset.fileName ?? "selfie.jpg",
        "uploads/presign-agent-avatar",
      );
      setSelfieUri(asset.uri);
      setSelfieKey(key);
    } catch {
      Alert.alert("Erreur", t.errGeneric);
    } finally {
      setUploadingSelfie(false);
    }
  }

  async function handleSubmit() {
    // Validate
    if (!dateOfBirth) {
      Alert.alert("Erreur", t.errDobRequired);
      return;
    }
    const now = new Date();
    const age = now.getFullYear() - dateOfBirth.getFullYear();
    const hadBirthday =
      now.getMonth() > dateOfBirth.getMonth() ||
      (now.getMonth() === dateOfBirth.getMonth() &&
        now.getDate() >= dateOfBirth.getDate());
    if (age < 18 || (age === 18 && !hadBirthday)) {
      Alert.alert("Erreur", t.errDobAge);
      return;
    }
    if (!nationalIdNumber.trim()) {
      Alert.alert("Erreur", t.errIdNumber);
      return;
    }
    if (!idDocumentKey) {
      Alert.alert("Erreur", t.errIdPhoto);
      return;
    }
    if (!token) return;

    setSubmitting(true);
    try {
      await submitAgentIdentity(token, {
        dateOfBirth: dateOfBirth.toISOString(),
        nationalIdNumber: nationalIdNumber.trim(),
        idDocumentUrl: idDocumentKey,
        selfieUrl: selfieKey ?? undefined,
        residenceCommune: residenceCommune ?? undefined,
        experienceRange: experienceRange ?? undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      Alert.alert(
        "Erreur",
        Array.isArray(msg) ? msg.join(", ") : (msg ?? t.errGeneric),
      );
    } finally {
      setSubmitting(false);
    }
  }

  const formattedDate = dateOfBirth
    ? dateOfBirth.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View
          style={{
            backgroundColor: Colors.navy,
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 18,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginBottom: 10,
            }}
          >
            <ArrowLeft size={16} color="rgba(255,255,255,0.6)" />
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
              {t.back}
            </Text>
          </TouchableOpacity>
          <Text
            style={{
              color: "#fff",
              fontSize: 18,
              fontFamily: "DMSans_700Bold",
            }}
          >
            {t.title}
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          keyboardShouldPersistTaps="handled"
        >
          {success && (
            <View
              style={{
                backgroundColor: "#d1fae5",
                borderRadius: 12,
                padding: 16,
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <Check size={18} color="#065f46" />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: "#065f46",
                    fontSize: 14,
                    fontFamily: "DMSans_600SemiBold",
                  }}
                >
                  {t.successTitle}
                </Text>
                <Text style={{ color: "#047857", fontSize: 12, marginTop: 2 }}>
                  {t.successMsg}
                </Text>
              </View>
            </View>
          )}

          {/* Section 1: Identity */}
          <View
            style={{
              backgroundColor: card,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: border,
            }}
          >
            <SectionLabel label={t.sectionIdentity} color={primary} />
            <View style={{ gap: 14 }}>
              {/* Date de naissance */}
              <View>
                <Text style={{ color: textMut, fontSize: 12, marginBottom: 5 }}>
                  {t.labelDob} *
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={[inputStyle, { justifyContent: "center" }]}
                >
                  <Text
                    style={{
                      color: formattedDate ? text : textMut,
                      fontSize: 14,
                      fontFamily: "DMSans_400Regular",
                    }}
                  >
                    {formattedDate || "JJ/MM/AAAA"}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={dateOfBirth ?? new Date(2000, 0, 1)}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    maximumDate={new Date()}
                    onChange={(_, selected) => {
                      setShowDatePicker(Platform.OS === "ios");
                      if (selected) setDateOfBirth(selected);
                    }}
                  />
                )}
              </View>

              {/* Numéro CIN */}
              <View>
                <Text style={{ color: textMut, fontSize: 12, marginBottom: 5 }}>
                  {t.labelIdNumber} *
                </Text>
                <TextInput
                  style={inputStyle}
                  value={nationalIdNumber}
                  onChangeText={setNationalIdNumber}
                  secureTextEntry
                  placeholder="••••••••••••"
                  placeholderTextColor={textMut}
                  autoCapitalize="none"
                />
                <Text style={{ color: textMut, fontSize: 11, marginTop: 4 }}>
                  {t.labelIdNumberHint}
                </Text>
              </View>

              {/* Photo CIN */}
              <View>
                <Text style={{ color: textMut, fontSize: 12, marginBottom: 8 }}>
                  {t.labelIdPhoto} *
                </Text>
                <TouchableOpacity
                  onPress={pickIdPhoto}
                  disabled={uploadingId}
                  style={{
                    borderWidth: 1.5,
                    borderColor: idDocumentKey ? primary : border,
                    borderStyle: "dashed",
                    borderRadius: 12,
                    padding: 14,
                    alignItems: "center",
                    gap: 8,
                    flexDirection: "row",
                    backgroundColor: idDocumentKey
                      ? isDark
                        ? Colors.dark.accent
                        : Colors.accent
                      : "transparent",
                  }}
                >
                  {uploadingId ? (
                    <ActivityIndicator size="small" color={primary} />
                  ) : (
                    <Upload size={16} color={primary} />
                  )}
                  <Text
                    style={{
                      color: primary,
                      fontSize: 13,
                      fontFamily: "DMSans_500Medium",
                    }}
                  >
                    {uploadingId
                      ? t.uploadingLabel
                      : idDocumentKey
                        ? t.photoAdded
                        : t.choosePhoto}
                  </Text>
                </TouchableOpacity>
                {idPhotoUri && (
                  <Image
                    source={{ uri: idPhotoUri }}
                    style={{
                      width: 80,
                      height: 50,
                      borderRadius: 8,
                      marginTop: 8,
                      resizeMode: "cover",
                    }}
                  />
                )}
              </View>

              {/* Selfie */}
              <View>
                <Text style={{ color: textMut, fontSize: 12, marginBottom: 4 }}>
                  {t.labelSelfie}
                </Text>
                <Text style={{ color: textMut, fontSize: 11, marginBottom: 8 }}>
                  {t.labelSelfieHint}
                </Text>
                <TouchableOpacity
                  onPress={pickSelfie}
                  disabled={uploadingSelfie}
                  style={{
                    borderWidth: 1.5,
                    borderColor: selfieKey ? primary : border,
                    borderStyle: "dashed",
                    borderRadius: 12,
                    padding: 14,
                    alignItems: "center",
                    gap: 8,
                    flexDirection: "row",
                    backgroundColor: selfieKey
                      ? isDark
                        ? Colors.dark.accent
                        : Colors.accent
                      : "transparent",
                  }}
                >
                  {uploadingSelfie ? (
                    <ActivityIndicator size="small" color={primary} />
                  ) : (
                    <Upload size={16} color={primary} />
                  )}
                  <Text
                    style={{
                      color: primary,
                      fontSize: 13,
                      fontFamily: "DMSans_500Medium",
                    }}
                  >
                    {uploadingSelfie
                      ? t.uploadingLabel
                      : selfieKey
                        ? t.selfieAdded
                        : t.chooseSelfie}
                  </Text>
                </TouchableOpacity>
                {selfieUri && (
                  <Image
                    source={{ uri: selfieUri }}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      marginTop: 8,
                    }}
                  />
                )}
              </View>
            </View>
          </View>

          {/* Section 2: Professional */}
          <View
            style={{
              backgroundColor: card,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: border,
            }}
          >
            <SectionLabel label={t.sectionProfessional} color={primary} />
            <View style={{ gap: 16 }}>
              {/* Agent Type */}
              <View>
                <Text style={{ color: textMut, fontSize: 12, marginBottom: 8 }}>
                  {t.labelAgentType}
                </Text>
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                >
                  {AGENT_TYPES.map(({ value, label }) => (
                    <TouchableOpacity
                      key={value}
                      onPress={() => setAgentType(value)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: agentType === value ? primary : border,
                        backgroundColor:
                          agentType === value
                            ? isDark
                              ? Colors.dark.accent
                              : Colors.accent
                            : "transparent",
                        minWidth: "45%",
                      }}
                    >
                      <Text
                        style={{
                          color: agentType === value ? primary : textMut,
                          fontSize: 12,
                          fontFamily: "DMSans_500Medium",
                          textAlign: "center",
                        }}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Experience */}
              <View>
                <Text style={{ color: textMut, fontSize: 12, marginBottom: 8 }}>
                  {t.labelExperience}
                </Text>
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                >
                  {EXPERIENCE_RANGES.map(({ value, label }) => (
                    <TouchableOpacity
                      key={value}
                      onPress={() => setExperienceRange(value)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor:
                          experienceRange === value ? primary : border,
                        backgroundColor:
                          experienceRange === value
                            ? isDark
                              ? Colors.dark.accent
                              : Colors.accent
                            : "transparent",
                      }}
                    >
                      <Text
                        style={{
                          color: experienceRange === value ? primary : textMut,
                          fontSize: 12,
                          fontFamily: "DMSans_500Medium",
                        }}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Communes d'opération */}
              <View>
                <Text style={{ color: textMut, fontSize: 12, marginBottom: 8 }}>
                  {t.labelCommunes}
                </Text>
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                >
                  {COMMUNES.map((commune) => (
                    <TouchableOpacity
                      key={commune}
                      onPress={() => toggleCommune(commune)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: communes.includes(commune)
                          ? primary
                          : border,
                        backgroundColor: communes.includes(commune)
                          ? isDark
                            ? Colors.dark.accent
                            : Colors.accent
                          : "transparent",
                      }}
                    >
                      <Text
                        style={{
                          color: communes.includes(commune) ? primary : textMut,
                          fontSize: 12,
                        }}
                      >
                        {commune}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Property Types */}
              <View>
                <Text style={{ color: textMut, fontSize: 12, marginBottom: 8 }}>
                  {t.labelPropertyTypes}
                </Text>
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                >
                  {PROPERTY_TYPE_OPTIONS.map((pt) => (
                    <TouchableOpacity
                      key={pt}
                      onPress={() => togglePropertyType(pt)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: propertyTypes.includes(pt)
                          ? primary
                          : border,
                        backgroundColor: propertyTypes.includes(pt)
                          ? isDark
                            ? Colors.dark.accent
                            : Colors.accent
                          : "transparent",
                      }}
                    >
                      <Text
                        style={{
                          color: propertyTypes.includes(pt) ? primary : textMut,
                          fontSize: 12,
                          fontFamily: "DMSans_500Medium",
                        }}
                      >
                        {(t.propertyTypeOptions as Record<string, string>)[
                          pt
                        ] ?? pt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* Section 3: Présence & contact */}
          <View
            style={{
              backgroundColor: card,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: border,
            }}
          >
            <SectionLabel label={t.sectionPresence} color={primary} />
            <View>
              <Text style={{ color: textMut, fontSize: 12, marginBottom: 4 }}>
                {t.labelResidenceCommune}
              </Text>
              <Text style={{ color: textMut, fontSize: 11, marginBottom: 8 }}>
                {t.labelResidenceCommuneHint}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {COMMUNES.map((commune) => (
                  <TouchableOpacity
                    key={commune}
                    onPress={() =>
                      setResidenceCommune(
                        commune === residenceCommune ? null : commune,
                      )
                    }
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor:
                        residenceCommune === commune ? primary : border,
                      backgroundColor:
                        residenceCommune === commune
                          ? isDark
                            ? Colors.dark.accent
                            : Colors.accent
                          : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        color: residenceCommune === commune ? primary : textMut,
                        fontSize: 12,
                      }}
                    >
                      {commune}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Submit button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting || success}
            style={{
              backgroundColor: primary,
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: "center",
              opacity: submitting || success ? 0.7 : 1,
              marginBottom: 24,
            }}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                style={{
                  color: "#fff",
                  fontSize: 15,
                  fontFamily: "DMSans_600SemiBold",
                }}
              >
                {submitting ? t.btnSubmitting : t.btnSubmit}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
