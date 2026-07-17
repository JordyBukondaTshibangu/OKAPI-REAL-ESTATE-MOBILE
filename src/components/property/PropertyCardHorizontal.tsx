import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { MapPin, BedDouble, Maximize2, Building2, CheckCircle } from "lucide-react-native";
import type { Property } from "../../types/property";
import { Colors } from "../../constants/colors";
import { formatPrice } from "../../lib/format";
import { useThemeStore } from "../../store/useThemeStore";
import { useT } from "../../i18n/useT";
import Badge from "../ui/Badge";
import { API_URL } from "../../constants/api";

const CARD_WIDTH = 200;

interface PropertyCardHorizontalProps {
  property: Property;
}

export default function PropertyCardHorizontal({ property }: PropertyCardHorizontalProps) {
  const { theme } = useThemeStore();
  const t = useT();
  const isDark = theme === "dark";

  const cardBg = isDark ? Colors.dark.card : Colors.white;
  const borderColor = isDark ? Colors.dark.border : Colors.border;
  const textMain = isDark ? Colors.dark.foreground : Colors.textDark;
  const textMuted = isDark ? Colors.dark.mutedFg : Colors.mutedFg;

  const imageUri = property.gallery?.[0]
    ? property.gallery[0].startsWith("http")
      ? property.gallery[0]
      : `${API_URL}/${property.gallery[0]}`
    : null;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/property/${property.id}` as any)}
      activeOpacity={0.95}
      style={{
        width: CARD_WIDTH,
        backgroundColor: cardBg,
        borderColor,
        borderWidth: 1,
        borderRadius: 14,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.25 : 0.06,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <View style={{ height: 110, position: "relative" }}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={{ width: "100%", height: 110 }} contentFit="cover" />
        ) : (
          <View style={{ width: "100%", height: 110, backgroundColor: isDark ? "#1a2733" : "#EAF2FB", alignItems: "center", justifyContent: "center" }}>
            <Building2 size={30} color={isDark ? "#2e4a63" : "#a8c5da"} />
          </View>
        )}
        <View style={{ position: "absolute", top: 8, left: 8, gap: 4 }}>
          {property.verified && (
            <View style={{ backgroundColor: "#d1fae5", borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2, flexDirection: "row", alignItems: "center", gap: 3 }}>
              <CheckCircle size={9} color="#065f46" />
              <Text style={{ fontSize: 10, color: "#065f46", fontFamily: "DMSans_600SemiBold" }}>{t.property.badgeVerified}</Text>
            </View>
          )}
          {(property.isNew || property.premium) && (
            property.isNew ? <Badge label={t.property.badgeNew} variant="gold" /> : <Badge label={t.property.badgePremium} variant="gold" />
          )}
        </View>
        {property.isShortTerm && (
          <View style={{ position: "absolute", top: 8, right: 8 }}>
            <Badge label={t.property.shortTermBadge} variant="primary" />
          </View>
        )}
      </View>

      <View style={{ padding: 12 }}>
        <Text style={{ fontSize: 15, fontFamily: "DMSans_700Bold", color: textMain }} numberOfLines={1}>
          {formatPrice(property.price, property.currency, property.period)}
        </Text>
        <Text style={{ fontSize: 13, fontFamily: "DMSans_600SemiBold", color: textMain, marginTop: 2 }} numberOfLines={1}>
          {property.title}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 }}>
          <MapPin size={12} color={textMuted} />
          <Text style={{ color: textMuted, fontSize: 11 }} numberOfLines={1}>{property.suburb}, {property.city}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
          {property.bedrooms > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <BedDouble size={12} color={textMuted} />
              <Text style={{ fontSize: 11, color: textMuted }}>{property.bedrooms}</Text>
            </View>
          )}
          {property.areaSqm > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <Maximize2 size={12} color={textMuted} />
              <Text style={{ fontSize: 11, color: textMuted }}>{property.areaSqm} m²</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
