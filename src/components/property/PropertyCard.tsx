import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Alert, Animated } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
// Helper: returns true if the Axios error is a 401
function is401(err: unknown): boolean {
  return (err as any)?.response?.status === 401;
}
import { useQueryClient } from "@tanstack/react-query";
import { Heart, MapPin, BedDouble, Bath, Maximize2, ArrowRight, Moon, Building2, CheckCircle } from "lucide-react-native";
import type { Property } from "../../types/property";
import { Colors } from "../../constants/colors";
import { formatPrice } from "../../lib/format";
import { useAuthStore } from "../../store/useAuthStore";
import { useThemeStore } from "../../store/useThemeStore";
import { useAgentSessionStore } from "../../store/useAgentSessionStore";
import { useT } from "../../i18n/useT";
import { addFavourite, removeFavourite } from "../../services/auth";
import Badge from "../ui/Badge";
import { API_URL } from "../../constants/api";

interface PropertyCardProps {
  property: Property;
  isFavourite?: boolean;
  onFavouriteChange?: () => void;
}

export default function PropertyCard({ property, isFavourite = false, onFavouriteChange }: PropertyCardProps) {
  const { token, isAuthenticated, logout } = useAuthStore();
  const { theme } = useThemeStore();
  const { isAuthenticated: isAgentLoggedIn } = useAgentSessionStore();
  const t = useT();
  const queryClient = useQueryClient();
  const isDark = theme === "dark";
  const [fav, setFav] = useState(isFavourite);
  const [toggling, setToggling] = useState(false);
  const heartScale = useRef(new Animated.Value(1)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.spring(cardTranslateY, { toValue: 0, speed: 14, bounciness: 4, useNativeDriver: true }),
    ]).start();
  }, []);

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

  function animateHeart() {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.35, useNativeDriver: true, speed: 40, bounciness: 14 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }),
    ]).start();
  }

  async function handleFavourite() {
    if (!isAuthenticated || !token) {
      router.push("/(auth)/connexion");
      return;
    }
    animateHeart();
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
    } catch (err) {
      if (is401(err)) {
        logout();
        router.replace("/(auth)/connexion");
      } else {
        Alert.alert("Erreur", "Impossible de modifier les favoris.");
      }
    } finally {
      setToggling(false);
    }
  }

  return (
    <Animated.View style={{ opacity: cardOpacity, transform: [{ translateY: cardTranslateY }] }}>
    <TouchableOpacity
      onPress={() => router.push(`/property/${property.id}` as any)}
      activeOpacity={0.92}
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
          <View style={{ width: "100%", height: 200, backgroundColor: isDark ? "#1a2733" : "#EAF2FB", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Building2 size={44} color={isDark ? "#2e4a63" : "#a8c5da"} />
            <Text style={{ color: isDark ? "#2e4a63" : "#a8c5da", fontSize: 12, fontFamily: "DMSans_400Regular" }}>
              Pas de photo
            </Text>
          </View>
        )}
        {/* Badges */}
        <View style={{ position: "absolute", top: 10, left: 10, flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
          {property.isBoosted && (
            <View style={{ backgroundColor: "rgba(245,158,11,0.9)", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ fontSize: 10 }}>✨</Text>
              <Text style={{ fontSize: 11, color: "#fff", fontFamily: "DMSans_600SemiBold" }}>{t.espaceAgent.boostBadge}</Text>
            </View>
          )}
          {property.verified && (
            <View style={{ backgroundColor: "#d1fae5", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, flexDirection: "row", alignItems: "center", gap: 4 }}>
              <CheckCircle size={10} color="#065f46" />
              <Text style={{ fontSize: 11, color: "#065f46", fontFamily: "DMSans_600SemiBold" }}>{t.property.badgeVerified}</Text>
            </View>
          )}
          {property.isNew && <Badge label={t.property.badgeNew} variant="gold" />}
          {property.premium && <Badge label={t.property.badgePremium} variant="gold" />}
          {property.isShortTerm && <Badge label={t.property.shortTermBadge} variant="primary" />}
        </View>
        {/* Heart — hidden for logged-in agents */}
        {!isAgentLoggedIn && (
          <TouchableOpacity
            onPress={handleFavourite}
            disabled={toggling}
            activeOpacity={0.8}
            style={{ position: "absolute", top: 10, right: 10 }}
          >
            <Animated.View style={{
              transform: [{ scale: heartScale }],
              backgroundColor: fav
                ? "#DC2626"
                : isDark ? "rgba(17,34,52,0.88)" : "rgba(255,255,255,0.95)",
              borderRadius: 24,
              padding: 10,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.18,
              shadowRadius: 4,
              elevation: 4,
            }}>
              <Heart
                size={20}
                color={fav ? "#fff" : "#DC2626"}
                fill={fav ? "#fff" : "transparent"}
              />
            </Animated.View>
          </TouchableOpacity>
        )}
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12 }}>
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
          {property.isShortTerm && (
            <>
              <View style={{ flex: 1 }} />
              <View style={{
                flexDirection: "row", alignItems: "center", gap: 4,
                backgroundColor: isDark ? "rgba(99,102,241,0.12)" : "#EEF2FF",
                borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
              }}>
                <Moon size={11} color={isDark ? Colors.dark.primary : Colors.primary} />
                <Text style={{ color: isDark ? Colors.dark.primary : Colors.primary, fontSize: 11, fontFamily: "DMSans_500Medium" }}>
                  {t.property.shortTermBadge}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Agent row */}
        <View style={{
          flexDirection: "row", alignItems: "center", justifyContent: "space-between",
          marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: borderColor,
        }}>
          <Text style={{ fontSize: 12, color: textMuted }}>{property.agent?.name}</Text>
          <TouchableOpacity
            onPress={() => router.push(`/property/${property.id}` as any)}
            style={{
              flexDirection: "row", alignItems: "center", gap: 4,
              backgroundColor: isDark ? `${Colors.dark.primary}22` : `${Colors.primary}18`,
              paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
            }}
          >
            <Text style={{ color: iconColor, fontSize: 12, fontFamily: "DMSans_600SemiBold" }}>{t.property.viewDetails ?? "Voir les détails"}</Text>
            <ArrowRight size={13} color={iconColor} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
    </Animated.View>
  );
}
