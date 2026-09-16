import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Alert, Animated, FlatList, Dimensions } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
// Helper: returns true if the Axios error is a 401
function is401(err: unknown): boolean {
  return (err as any)?.response?.status === 401;
}
import { useQueryClient } from "@tanstack/react-query";
import { Heart, MapPin, BedDouble, Bath, Maximize2, ArrowRight, Moon, Building2, CheckCircle, MessageCircle, Lock } from "lucide-react-native";
import { openWhatsApp, buildPropertyWhatsAppMessage, getContactPhone } from "../../lib/whatsapp";
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

const CARD_WIDTH = Dimensions.get("window").width - 32; // 16px padding each side
const IMAGE_HEIGHT = 200;

interface PropertyCardProps {
  property: Property;
  isFavourite?: boolean;
  onFavouriteChange?: () => void;
}

function buildImageUri(raw: string): string {
  return raw.startsWith("http") ? raw : `${API_URL}/${raw.replace(/^\/+/, "")}`;
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
  const [activeIndex, setActiveIndex] = useState(0);
  const heartScale = useRef(new Animated.Value(1)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(16)).current;

  // Build gallery URIs — deduplicated, fallback to empty
  const images: string[] = (property.gallery ?? [])
    .filter(Boolean)
    .map(buildImageUri);

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

  // Photo counter badge (top-right of image when no heart / for agents)
  const photoCount = images.length;

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
      {/* ── Image carousel ── */}
      <View style={{ height: IMAGE_HEIGHT, position: "relative" }}>
        {images.length > 0 ? (
          <>
            <FlatList
              data={images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, i) => String(i)}
              scrollEnabled={images.length > 1}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
                setActiveIndex(idx);
              }}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  style={{ width: CARD_WIDTH, height: IMAGE_HEIGHT }}
                  contentFit="cover"
                />
              )}
              getItemLayout={(_, index) => ({
                length: CARD_WIDTH,
                offset: CARD_WIDTH * index,
                index,
              })}
            />

            {/* Dot indicators */}
            {images.length > 1 && (
              <View style={{
                position: "absolute",
                bottom: 8,
                left: 0,
                right: 0,
                flexDirection: "row",
                justifyContent: "center",
                gap: 5,
              }}>
                {images.map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: i === activeIndex ? 18 : 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: i === activeIndex ? "#fff" : "rgba(255,255,255,0.45)",
                    }}
                  />
                ))}
              </View>
            )}

            {/* Photo count badge (bottom-right) */}
            {photoCount > 1 && (
              <View style={{
                position: "absolute",
                bottom: 8,
                right: 10,
                backgroundColor: "rgba(0,0,0,0.52)",
                borderRadius: 10,
                paddingHorizontal: 7,
                paddingVertical: 3,
              }}>
                <Text style={{ color: "#fff", fontSize: 11, fontFamily: "DMSans_500Medium" }}>
                  {activeIndex + 1}/{photoCount}
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={{ width: "100%", height: IMAGE_HEIGHT, backgroundColor: isDark ? "#1a2733" : "#EAF2FB", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Building2 size={44} color={isDark ? "#2e4a63" : "#a8c5da"} />
            <Text style={{ color: isDark ? "#2e4a63" : "#a8c5da", fontSize: 12, fontFamily: "DMSans_400Regular" }}>
              Pas de photo
            </Text>
          </View>
        )}

        {/* Just-added badge — shows when listing is < 24 h old */}
        {property.createdAt && Date.now() - new Date(property.createdAt).getTime() < 86_400_000 && (
          <View style={{ position: "absolute", bottom: images.length > 1 ? 26 : 10, left: 10, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(5,150,105,0.90)", borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#6ee7b7" }} />
            <Text style={{ color: "#fff", fontSize: 11, fontFamily: "DMSans_600SemiBold" }}>
              {(() => {
                const h = Math.floor((Date.now() - new Date(property.createdAt).getTime()) / 3_600_000);
                return h < 1 ? "À l'instant" : `il y a ${h}h`;
              })()}
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
          {property.isExclusive && (
            <View style={{ backgroundColor: "rgba(30,30,30,0.88)", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Lock size={9} color="#D4AF37" />
              <Text style={{ fontSize: 10, color: "#D4AF37", fontFamily: "DMSans_700Bold" }}>Exclusif</Text>
            </View>
          )}
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
          <Text style={{ color: textMuted, fontSize: 12 }}>{property.suburb}</Text>
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
          marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: borderColor,
        }}>
          <Text style={{ fontSize: 12, color: textMuted, marginBottom: 10 }}>{property.agent?.name}</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {/* WhatsApp quick-contact */}
            {(() => {
              const phone = getContactPhone(property);
              if (!phone) return null;
              return (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation?.();
                    openWhatsApp(phone, buildPropertyWhatsAppMessage(t.property.whatsappMessage, property.id));
                  }}
                  activeOpacity={0.8}
                  style={{
                    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
                    backgroundColor: "#25D366", borderRadius: 10, paddingVertical: 9,
                  }}
                >
                  <MessageCircle size={14} color="#fff" />
                  <Text style={{ color: "#fff", fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>WhatsApp</Text>
                </TouchableOpacity>
              );
            })()}
            <TouchableOpacity
              onPress={() => router.push(`/property/${property.id}` as any)}
              style={{
                flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4,
                backgroundColor: isDark ? `${Colors.dark.primary}22` : `${Colors.primary}18`,
                borderRadius: 10, paddingVertical: 9,
              }}
            >
              <Text style={{ color: iconColor, fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>{t.property.viewDetails ?? "Voir →"}</Text>
              <ArrowRight size={13} color={iconColor} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
    </Animated.View>
  );
}
