import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
import {
  getFavourites,
  removeFavourite,
  getAlerts,
  createAlertFromFavourite,
  type Favourite,
  type Alert as AlertType,
} from "../../../src/services/auth";
import { useAuthStore } from "../../../src/store/useAuthStore";
import { useThemeStore } from "../../../src/store/useThemeStore";
import { useAuthGuard } from "../../../src/hooks/useAuthGuard";
import Loader from "../../../src/components/ui/Loader";
import EmptyState from "../../../src/components/ui/EmptyState";
import { Colors } from "../../../src/constants/colors";
import { Trash2, Heart, MapPin, Home, Bell, BellRing } from "lucide-react-native";
import { API_URL } from "../../../src/constants/api";
import { useT } from "../../../src/i18n/useT";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(
  price: number,
  listingType: string | null,
  period?: string | null
): string {
  const n = price.toLocaleString("en-US");
  if (listingType === "rent") {
    return period === "nightly" ? `$${n} / nuit` : `$${n} / mois`;
  }
  return `$${n}`;
}

function hasMatchingAlert(fav: Favourite, alerts: AlertType[]): boolean {
  const prop = fav.property;
  const propListingType =
    prop.listingType === "sale" ? "for-sale"
    : prop.listingType === "rent" ? "for-rent"
    : null;

  return alerts.some((alert) => {
    const sameSuburb =
      !alert.suburb ||
      alert.suburb.toLowerCase() === (prop.suburb ?? "").toLowerCase();
    const sameCategory = !alert.category || alert.category === prop.category;
    const sameType =
      !alert.listingType || alert.listingType === propListingType;
    return sameSuburb && sameCategory && sameType;
  });
}

function getStatusBadge(
  status: string | null,
  t: ReturnType<typeof useT>
): { label: string; color: string; bg: string } | null {
  if (!status) return null;
  const map: Record<string, { label: string; color: string; bg: string }> = {
    LIVE:     { label: t.listing.statusLive,     color: "#15803d", bg: "#dcfce7" },
    PENDING:  { label: t.listing.statusPending,  color: "#92400e", bg: "#fef3c7" },
    EXPIRED:  { label: t.listing.statusExpired,  color: "#b91c1c", bg: "#fee2e2" },
    HIDDEN:   { label: t.listing.statusHidden,   color: "#374151", bg: "#f3f4f6" },
    DRAFT:    { label: t.listing.statusDraft,    color: "#374151", bg: "#f3f4f6" },
    REJECTED: { label: t.listing.statusRejected, color: "#b91c1c", bg: "#fee2e2" },
  };
  return map[status] ?? null;
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function FavorisScreen() {
  const t = useT();
  const isAuth = useAuthGuard();
  const { token } = useAuthStore();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const queryClient = useQueryClient();

  const pageBg  = isDark ? Colors.dark.background : Colors.backgroundAlt;
  const cardBg  = isDark ? Colors.dark.card : Colors.white;
  const borderC = isDark ? Colors.dark.border : Colors.border;
  const textMain = isDark ? Colors.dark.foreground : Colors.textDark;
  const textMut  = isDark ? Colors.dark.mutedFg : Colors.mutedFg;
  const primary  = isDark ? Colors.dark.primary : Colors.primary;

  const [creatingAlertFor, setCreatingAlertFor] = useState<Set<string>>(new Set());

  const { data: favData, isLoading: favLoading } = useQuery({
    queryKey: ["favourites"],
    queryFn: () => getFavourites(token!),
    enabled: !!token,
  });

  const { data: alertData } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => getAlerts(token!),
    enabled: !!token,
  });

  const favourites = favData ?? [];
  const alerts = alertData ?? [];

  async function handleRemove(propertyId: string) {
    try {
      await removeFavourite(token!, propertyId);
      queryClient.invalidateQueries({ queryKey: ["favourites"] });
    } catch {
      Alert.alert(t.common.error, t.property.favError);
    }
  }

  async function handleCreateAlert(propertyId: string) {
    if (creatingAlertFor.has(propertyId)) return;
    setCreatingAlertFor((prev) => new Set(prev).add(propertyId));
    try {
      await createAlertFromFavourite(token!, propertyId);
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    } catch {
      Alert.alert(t.common.error, t.common.error);
    } finally {
      setCreatingAlertFor((prev) => {
        const next = new Set(prev);
        next.delete(propertyId);
        return next;
      });
    }
  }

  if (!isAuth) return null;
  if (favLoading) return <Loader />;

  if (favourites.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: pageBg }}>
        <EmptyState
          title={t.user.noFavorites}
          subtitle={t.user.noFavoritesDesc}
          icon={Heart}
          action={{
            label: "Parcourir les biens",
            onPress: () => router.push("/(tabs)/acheter" as any),
          }}
        />
      </View>
    );
  }

  return (
    <FlatList
      data={favourites}
      keyExtractor={(f) => f.id}
      style={{ backgroundColor: pageBg }}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => {
        const p = item.property;
        const gallery: string[] = Array.isArray(p?.gallery) ? p.gallery : [];
        const raw = gallery[0] || p?.imageUrl;
        const imageUri = raw
          ? raw.startsWith("http")
            ? raw
            : `${API_URL}/${raw.replace(/^\/+/, "")}`
          : null;
        const placeholderBg = isDark ? Colors.dark.muted : Colors.backgroundAlt;

        const location = [p?.suburb, p?.city].filter(Boolean).join(", ") || p?.location || "";
        const price = p ? formatPrice(p.price, p.listingType, p.period) : "—";
        const statusBadge = getStatusBadge(p?.status ?? null, t);
        const activeAlert = hasMatchingAlert(item, alerts);
        const isCreating = creatingAlertFor.has(p?.id ?? "");

        return (
          <TouchableOpacity
            onPress={() => router.push(`/property/${item.propertyId}` as any)}
            style={{
              backgroundColor: cardBg,
              borderColor: borderC,
              borderWidth: 1,
              borderRadius: 16,
              marginBottom: 12,
              overflow: "hidden",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: isDark ? 0.2 : 0.05,
              shadowRadius: 4,
              elevation: 1,
            }}
          >
            {/* Row: image + content + trash */}
            <View style={{ flexDirection: "row" }}>
              {/* Thumbnail with status badge */}
              <View style={{ width: 96, position: "relative" }}>
                <FavouriteImage uri={imageUri} placeholderBg={placeholderBg} iconColor={textMut} />
                {statusBadge && (
                  <View
                    style={{
                      position: "absolute",
                      top: 6,
                      left: 6,
                      backgroundColor: statusBadge.bg,
                      borderRadius: 99,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                    }}
                  >
                    <Text style={{ color: statusBadge.color, fontSize: 9, fontFamily: "DMSans_600SemiBold" }}>
                      {statusBadge.label}
                    </Text>
                  </View>
                )}
              </View>

              {/* Content */}
              <View style={{ flex: 1, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 10 }}>
                <Text
                  style={{ color: textMain, fontFamily: "DMSans_600SemiBold", fontSize: 14, lineHeight: 19 }}
                  numberOfLines={2}
                >
                  {p?.title}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                  <MapPin size={12} color={textMut} />
                  <Text style={{ color: textMut, fontSize: 12, flex: 1 }} numberOfLines={1}>
                    {location}
                  </Text>
                </View>
                <Text style={{ color: primary, fontFamily: "DMSans_700Bold", fontSize: 14, marginTop: 6 }}>
                  {price}
                </Text>
              </View>

              {/* Trash */}
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(t.common.delete, t.user.removeFavMsg, [
                    { text: t.common.cancel, style: "cancel" },
                    { text: t.common.delete, style: "destructive", onPress: () => handleRemove(item.propertyId) },
                  ]);
                }}
                style={{ paddingHorizontal: 14, alignItems: "center", justifyContent: "center" }}
              >
                <Trash2 size={18} color={isDark ? Colors.dark.destructive : Colors.destructive} />
              </TouchableOpacity>
            </View>

            {/* Alert row */}
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: borderC,
                paddingHorizontal: 12,
                paddingVertical: 9,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              {activeAlert ? (
                <TouchableOpacity
                  onPress={() => router.push("/(tabs)/compte" as any)}
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <BellRing size={14} color="#15803d" />
                  <Text style={{ color: "#15803d", fontSize: 12, fontFamily: "DMSans_500Medium" }}>
                    Alerte active
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => handleCreateAlert(p?.id ?? item.propertyId)}
                  disabled={isCreating}
                  style={{ flexDirection: "row", alignItems: "center", gap: 6, opacity: isCreating ? 0.5 : 1 }}
                >
                  <Bell size={14} color={textMut} />
                  <Text style={{ color: textMut, fontSize: 12, fontFamily: "DMSans_500Medium" }}>
                    {isCreating
                      ? "Création…"
                      : p?.suburb
                      ? `Créer une alerte pour ${p.suburb}`
                      : "Créer une alerte"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

function FavouriteImage({
  uri,
  placeholderBg,
  iconColor,
}: {
  uri: string | null;
  placeholderBg: string;
  iconColor: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!uri || failed) {
    return (
      <View
        style={{
          width: 96,
          height: 96,
          backgroundColor: placeholderBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Home size={28} color={iconColor} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={{ width: 96, height: 96 }}
      contentFit="cover"
      onError={() => setFailed(true)}
    />
  );
}
