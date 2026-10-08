import React, { useState, useCallback, memo } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { ChevronDown, Check } from "lucide-react-native";

const KINSHASA_COMMUNES = [
  "Bandalungwa", "Barumbu", "Bumbu", "Gombe", "Kalamu",
  "Kasa-Vubu", "Kimbanseke", "Kinshasa", "Kintambo", "Kisenso",
  "Lemba", "Limete", "Lingwala", "Makala", "Maluku",
  "Masina", "Matete", "Mont-Ngafula", "Ndjili", "Ngaba",
  "Ngaliema", "Ngiri-Ngiri", "Nsele", "Selembao",
];
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAlerts, createAlert, deleteAlert, type CreateAlertPayload, type Alert as AlertType } from "../../../src/services/auth";
import { useAuthStore } from "../../../src/store/useAuthStore";
import { useThemeStore } from "../../../src/store/useThemeStore";
import { useLocaleStore } from "../../../src/store/useLocaleStore";
import { useAuthGuard } from "../../../src/hooks/useAuthGuard";
import { useT } from "../../../src/i18n/useT";
import Loader from "../../../src/components/ui/Loader";
import EmptyState from "../../../src/components/ui/EmptyState";
import Badge from "../../../src/components/ui/Badge";
import Button from "../../../src/components/ui/Button";
import { Colors } from "../../../src/constants/colors";
import { Bell, Plus, Trash2, X, Home, Building2, BedDouble, Landmark, TreePine, Briefcase, ShoppingBag, Warehouse, type LucideIcon } from "lucide-react-native";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  apartment:  Building2,
  studio:     BedDouble,
  villa:      Home,
  townhouse:  Landmark,
  land:       TreePine,
  office:     Briefcase,
  shop:       ShoppingBag,
  warehouse:  Warehouse,
};

// ─── Memoized card ────────────────────────────────────────────────────────────

type CardProps = {
  item: AlertType;
  isDark: boolean;
  dateLocale: string;
  cardBg: string;
  borderC: string;
  textMain: string;
  textMut: string;
  chipBg: string;
  accentBg: string;
  primaryC: string;
  labelActive: string;
  labelInactive: string;
  labelSale: string;
  labelRent: string;
  onDelete: (id: string) => void;
};

const AlertCard = memo(function AlertCard({
  item, isDark, dateLocale, cardBg, borderC, textMain, textMut,
  chipBg, accentBg, primaryC, labelActive, labelInactive,
  labelSale, labelRent, onDelete,
}: CardProps) {
  const CategoryIcon = (item.category ? CATEGORY_ICONS[item.category] : null) ?? Home;

  return (
    <View style={{
      backgroundColor: cardBg, borderColor: borderC, borderWidth: 1,
      borderRadius: 16, marginBottom: 12, padding: 16,
      shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.05, shadowRadius: 3, elevation: 1,
    }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 12, gap: 10 }}>
          <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: accentBg, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <CategoryIcon size={18} color={primaryC} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: textMain, fontFamily: "DMSans_600SemiBold" }}>{item.name}</Text>
            <Text style={{ color: textMut, fontSize: 12, marginTop: 2 }}>
              {new Date(item.createdAt).toLocaleDateString(dateLocale)}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Badge label={item.active ? labelActive : labelInactive} variant={item.active ? "primary" : "muted"} />
          <TouchableOpacity onPress={() => onDelete(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Trash2 size={16} color={isDark ? Colors.dark.destructive : Colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {!!item.listingType && (
          <View style={{ backgroundColor: chipBg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontSize: 12, color: textMut }}>
              {(item.listingType === "sale" || item.listingType === "for-sale") ? labelSale : labelRent}
            </Text>
          </View>
        )}
        {!!item.city && (
          <View style={{ backgroundColor: chipBg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontSize: 12, color: textMut }}>{item.city}</Text>
          </View>
        )}
        {!!item.suburb && (
          <View style={{ backgroundColor: chipBg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontSize: 12, color: textMut }}>{item.suburb}</Text>
          </View>
        )}
        {!!item.minPrice && (
          <View style={{ backgroundColor: chipBg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontSize: 12, color: textMut }}>≥ {item.minPrice.toLocaleString()} $</Text>
          </View>
        )}
      </View>
    </View>
  );
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AlertesScreen() {
  const t = useT();
  const isAuth = useAuthGuard();
  const { token } = useAuthStore();
  const { theme } = useThemeStore();
  const { locale } = useLocaleStore();
  const dateLocale = locale === "en" ? "en-GB" : "fr-FR";
  const isDark = theme === "dark";
  const queryClient = useQueryClient();
  const [createModal, setCreateModal] = useState(false);
  const [communePicker, setCommunePicker] = useState(false);
  const [form, setForm] = useState<Partial<CreateAlertPayload>>({ active: true, city: "Kinshasa" });
  const [creating, setCreating] = useState(false);

  const pageBg   = isDark ? Colors.dark.background : Colors.backgroundAlt;
  const cardBg   = isDark ? Colors.dark.card : Colors.white;
  const borderC  = isDark ? Colors.dark.border : Colors.border;
  const textMain = isDark ? Colors.dark.foreground : Colors.textDark;
  const textMut  = isDark ? Colors.dark.mutedFg : Colors.mutedFg;
  const chipBg   = isDark ? Colors.dark.muted : Colors.backgroundAlt;
  const accentBg = isDark ? Colors.dark.accent : Colors.accent;
  const primaryC = isDark ? Colors.dark.primary : Colors.primary;

  const { data, isLoading } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => getAlerts(token!),
    enabled: !!token,
  });

  async function handleCreate() {
    if (!form.name?.trim()) { Alert.alert(t.common.error, t.alerts.missingNameError); return; }
    setCreating(true);
    try {
      await createAlert(token!, form as CreateAlertPayload);
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      setCreateModal(false);
      setForm({ active: true, city: "Kinshasa" });
    } catch { Alert.alert(t.common.error, t.alerts.createError); }
    finally { setCreating(false); }
  }

  const handleDelete = useCallback((id: string) => {
    Alert.alert(t.alerts.deleteTitle, t.alerts.deleteMsg, [
      { text: t.common.cancel, style: "cancel" },
      {
        text: t.common.delete, style: "destructive",
        onPress: async () => {
          try {
            await deleteAlert(token!, id);
            queryClient.invalidateQueries({ queryKey: ["alerts"] });
          } catch { Alert.alert(t.common.error, t.alerts.deleteError); }
        },
      },
    ]);
  }, [token, queryClient, t]);

  const renderItem = useCallback(({ item }: { item: AlertType }) => (
    <AlertCard
      item={item}
      isDark={isDark}
      dateLocale={dateLocale}
      cardBg={cardBg}
      borderC={borderC}
      textMain={textMain}
      textMut={textMut}
      chipBg={chipBg}
      accentBg={accentBg}
      primaryC={primaryC}
      labelActive={t.alerts.active}
      labelInactive={t.alerts.inactive}
      labelSale={t.alerts.sale}
      labelRent={t.alerts.rent}
      onDelete={handleDelete}
    />
  ), [isDark, dateLocale, cardBg, borderC, textMain, textMut, chipBg, accentBg, primaryC, t, handleDelete]);

  if (!isAuth) return null;
  if (isLoading) return <Loader />;

  const alerts = data ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: pageBg }}>
      {alerts.length === 0 ? (
        <EmptyState
          title={t.user.noAlerts}
          subtitle={t.alerts.noAlertsDesc}
          icon={Bell}
          action={{ label: t.alerts.createTitle, onPress: () => setCreateModal(true) }}
        />
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={a => a.id}
          contentContainerStyle={{ padding: 16 }}
          removeClippedSubviews
          ListHeaderComponent={
            <Button onPress={() => setCreateModal(true)} style={{ marginBottom: 12 }}>
              <Plus size={16} color="#fff" />
              <Text className="text-white ml-1">{t.alerts.createTitle}</Text>
            </Button>
          }
          renderItem={renderItem}
        />
      )}

      {/* Single modal — swaps between form view and commune picker */}
      <Modal
        visible={createModal}
        transparent
        animationType="slide"
        onRequestClose={() => { if (communePicker) setCommunePicker(false); else setCreateModal(false); }}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
            activeOpacity={1}
            onPress={() => { if (communePicker) setCommunePicker(false); else setCreateModal(false); }}
          />

          {/* ── Commune list view ── */}
          {communePicker ? (
            <View style={{
              backgroundColor: cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
              paddingTop: 20, paddingBottom: 32, maxHeight: "72%",
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 12 }}>
                <Text style={{ color: textMain, fontSize: 17, fontFamily: "DMSans_600SemiBold" }}>{t.alerts.commune}</Text>
                <TouchableOpacity onPress={() => setCommunePicker(false)}>
                  <Text style={{ color: primaryC, fontFamily: "DMSans_500Medium", fontSize: 14 }}>{t.alerts.close}</Text>
                </TouchableOpacity>
              </View>
              {/* "All communes" option */}
              <TouchableOpacity
                onPress={() => { setForm(f => ({ ...f, suburb: undefined })); setCommunePicker(false); }}
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: borderC }}
              >
                <Text style={{ color: !form.suburb ? primaryC : textMut, fontFamily: !form.suburb ? "DMSans_500Medium" : undefined }}>
                  {t.alerts.allCommunes}
                </Text>
                {!form.suburb && <Check size={16} color={primaryC} />}
              </TouchableOpacity>
              <ScrollView showsVerticalScrollIndicator={false}>
                {KINSHASA_COMMUNES.map(commune => {
                  const selected = form.suburb === commune;
                  return (
                    <TouchableOpacity
                      key={commune}
                      onPress={() => { setForm(f => ({ ...f, suburb: commune })); setCommunePicker(false); }}
                      style={{
                        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                        paddingHorizontal: 20, paddingVertical: 14,
                        borderBottomWidth: 1, borderBottomColor: borderC,
                        backgroundColor: selected ? (isDark ? Colors.dark.accent : Colors.accent) : "transparent",
                      }}
                    >
                      <Text style={{ color: selected ? primaryC : textMain, fontFamily: selected ? "DMSans_500Medium" : undefined }}>
                        {commune}
                      </Text>
                      {selected && <Check size={16} color={primaryC} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ) : (
            /* ── Alert form view ── */
            <View style={{ backgroundColor: cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <Text style={{ color: textMain, fontSize: 18, fontFamily: "DMSans_600SemiBold" }}>{t.alerts.createTitle}</Text>
                <TouchableOpacity onPress={() => setCreateModal(false)}>
                  <X size={22} color={textMut} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ maxHeight: 440 }}>
                <TextInput
                  value={form.name ?? ""}
                  onChangeText={v => setForm(f => ({ ...f, name: v }))}
                  placeholder={t.alerts.alertNamePlaceholder}
                  placeholderTextColor={textMut}
                  style={{ borderColor: borderC, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: textMain, marginBottom: 12 }}
                />
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
                  {[{ value: "for-sale", label: t.alerts.sale }, { value: "for-rent", label: t.alerts.rent }].map(opt => {
                    const active = form.listingType === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => setForm(f => ({ ...f, listingType: opt.value }))}
                        style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center", borderWidth: 1, backgroundColor: active ? accentBg : chipBg, borderColor: active ? primaryC : borderC }}
                      >
                        <Text style={{ color: active ? primaryC : textMut, fontFamily: active ? "DMSans_500Medium" : undefined }}>{opt.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TextInput value="Kinshasa" editable={false} placeholder={t.alerts.city} placeholderTextColor={textMut} style={{ borderColor: borderC, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: textMut, marginBottom: 12, opacity: 0.7 }} />

                {/* Commune picker trigger */}
                <TouchableOpacity
                  onPress={() => setCommunePicker(true)}
                  style={{
                    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                    borderColor: form.suburb ? primaryC : borderC, borderWidth: 1,
                    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 12,
                    backgroundColor: form.suburb ? (isDark ? Colors.dark.accent : Colors.accent) : "transparent",
                  }}
                >
                  <Text style={{ color: form.suburb ? primaryC : textMut, fontSize: 14, fontFamily: form.suburb ? "DMSans_500Medium" : undefined }}>
                    {form.suburb ?? t.alerts.commune}
                  </Text>
                  <ChevronDown size={16} color={form.suburb ? primaryC : textMut} />
                </TouchableOpacity>

                <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
                  <TextInput value={form.minPrice ? String(form.minPrice) : ""} onChangeText={v => setForm(f => ({ ...f, minPrice: v ? Number(v) : undefined }))} placeholder={t.alerts.minPrice} placeholderTextColor={textMut} keyboardType="numeric" style={{ flex: 1, borderColor: borderC, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: textMain }} />
                  <TextInput value={form.maxPrice ? String(form.maxPrice) : ""} onChangeText={v => setForm(f => ({ ...f, maxPrice: v ? Number(v) : undefined }))} placeholder={t.alerts.maxPrice} placeholderTextColor={textMut} keyboardType="numeric" style={{ flex: 1, borderColor: borderC, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: textMain }} />
                </View>
                <Button onPress={handleCreate} loading={creating} style={{ marginTop: 8 }}>{t.alerts.createBtn}</Button>
              </ScrollView>
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
