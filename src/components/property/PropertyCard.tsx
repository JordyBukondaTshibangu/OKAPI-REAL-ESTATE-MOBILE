import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Heart, MapPin, BedDouble, Bath, Maximize2, MessageCircle } from "lucide-react-native";
import type { Property } from "../../types/property";
import { Colors } from "../../constants/colors";
import { formatPrice } from "../../lib/format";
import { useAuthStore } from "../../store/useAuthStore";
import { useThemeStore } from "../../store/useThemeStore";
import { useT } from "../../i18n/useT";
import { addFavourite, removeFavourite } from "../../services/auth";
import Badge from "../ui/Badge";
import { API_URL } from "../../constants/api";
import { openWhatsApp, buildPropertyWhatsAppMessage, getContactPhone } from "../../lib/whatsapp";

interface PropertyCardProps {
  property: Property;
  isFavourite?: boolean;
  onFavouriteChange?: () => void;
}

export default function PropertyCard({ property, isFavourite = false, onFavouriteChange }: PropertyCardProps) {
  const { token, isAuthenticated } = useAuthStore();
  const { theme } = useThemeStore();
  const t = useT();
  const queryClient = useQueryClient();
  const isDark = theme === "dark";
  const [fav, setFav] = useState(isFavourite);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    setFav(isFavourite);
  }, [isFavourite]);

  const cardBg = isDark ? Colors.dark.card : Colors.white;
  const borderColor = isDark ? Colors.dark.border : Colors.border;
  const textMain = isDark ? Colors.dark.foreground : Colors.textDark;
  const textMuted = isDark ? Colors.dark.mutedFg : Colors.mutedFg;
  const iconColor = isDark ? Colors.dark.primary : Colors.primary;

  const imageUri = property.gallery?.[0]
    ? property.gallery[0].startsWith("http")
      ? property.gallery[0]
      : `${API_URL}/${property.gallery[0].replace(/^\/+/, "")}`
    : null;

  const contactPhone = getContactPhone(property);

  async function handleFavourite() {
    if (!isAuthenticated || !token) {
      router.push("/(auth)/connexion");
      return;
    }
    setToggling(true);
    try {
      if (fav) {
        await removeFavourite(token, property.id);
        setFav(false);
      } else {
        await addFavourite(token, property.id);
        setFav(true);
      }
      queryClient.invalidateQueries({ queryKey: ["favourites"] });
      onFavouriteChange?.();
    } catch {
      Alert.alert("Erreur", "Impossible de modifier les favoris.");
    } finally {
      setToggling(false);
    }
  }

  function handleWhatsApp() {
    if (!contactPhone) return;
    const msg = buildPropertyWhatsAppMessage(t.property.whatsappMessage, property.id, property.reference);
    openWhatsApp(contactPhone, msg);
  }

  return (
    <TouchableOpacity
      onPress={() => router.push(`/property/${property.id}` as any)}
      activeOpacity={0.95}
      style={{
        backgroundColor: cardBg,
        borderColor,
        borderWidth: 1,
        borderRadius: 16,
        marginBottom: 16,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.25 : 0.06,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      {/* Image */}
      <View style={{ height: 200, position: "relative" }}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={{ width: "100%", height: 200 }} contentFit="cover" />
        ) : (
          <View style={{ width: "100%", height: 200, backgroundColor: isDark ? Colors.dark.muted : "#EAF2FB" }} />
        )}
        {/* Badges */}
        <View style={{ position: "absolute", top: 10, left: 10, flexDirection: "row", gap: 6 }}>
          {property.verified && <Badge label={t.property.badgeVerified} variant="secondary" />}
          {property.isNew && <Badge label={t.property.badgeNew} variant="gold" />}
          {property.premium && <Badge label={t.property.badgePremium} variant="gold" />}
        </View>
        {/* Heart */}
        <TouchableOpacity
          onPress={handleFavourite}
          disabled={toggling}
          style={{
            position: "absolute", top: 10, right: 10,
            backgroundColor: isDark ? "rgba(17,34,52,0.85)" : "rgba(255,255,255,0.9)",
            borderRadius: 20, padding: 8,
          }}
        >
          <Heart
            size={18}
            color={fav ? "#DC2626" : textMuted}
            fill={fav ? "#DC2626" : "transparent"}
          />
        </TouchableOpacity>
      </View>

      {/* Body */}
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 20, fontFamily: "DMSans_700Bold", color: textMain }}>
          {formatPrice(property.price, property.currency, property.period)}
        </Text>
        <Text style={{ fontSize: 15, fontFamily: "DMSans_600SemiBold", color: textMain, marginTop: 4 }} numberOfLines={2}>
          {property.title}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 }}>
          <MapPin size={13} color={textMuted} />
          <Text style={{ color: textMuted, fontSize: 12 }}>{property.suburb}, {property.city}</Text>
        </View>

        {/* Stats row */}
        <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
          {property.bedrooms > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <BedDouble size={14} color={textMuted} />
              <Text style={{ fontSize: 12, color: textMuted }}>{property.bedrooms}</Text>
            </View>
          )}
          {property.bathrooms > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Bath size={14} color={textMuted} />
              <Text style={{ fontSize: 12, color: textMuted }}>{property.bathrooms}</Text>
            </View>
          )}
          {property.areaSqm > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Maximize2 size={14} color={textMuted} />
              <Text style={{ fontSize: 12, color: textMuted }}>{property.areaSqm} m²</Text>
            </View>
          )}
        </View>

        {/* Agent row */}
        <View style={{
          flexDirection: "row", alignItems: "center", justifyContent: "space-between",
          marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: borderColor,
        }}>
          <Text style={{ fontSize: 12, color: textMuted }}>{property.agent?.name}</Text>
          {!!contactPhone && (
            <TouchableOpacity
              onPress={handleWhatsApp}
              style={{
                flexDirection: "row", alignItems: "center", gap: 4,
                backgroundColor: isDark ? "rgba(37,211,102,0.12)" : "#f0fdf4",
                paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
              }}
            >
              <MessageCircle size={13} color="#25D366" />
              <Text style={{ color: "#25D366", fontSize: 12, fontFamily: "DMSans_600SemiBold" }}>WhatsApp</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
