import React, { useState } from "react";
import { View, Text, TouchableOpacity, Linking, Alert } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Heart, MapPin, BedDouble, Bath, Maximize2, MessageCircle } from "lucide-react-native";
import type { Property } from "../../types/property";
import { Colors } from "../../constants/colors";
import { formatPrice } from "../../lib/format";
import { useAuthStore } from "../../store/useAuthStore";
import { addFavourite, removeFavourite } from "../../services/auth";
import Badge from "../ui/Badge";
import { API_URL } from "../../constants/api";

interface PropertyCardProps {
  property: Property;
  isFavourite?: boolean;
  onFavouriteChange?: () => void;
}

export default function PropertyCard({ property, isFavourite = false, onFavouriteChange }: PropertyCardProps) {
  const { token, isAuthenticated } = useAuthStore();
  const [fav, setFav] = useState(isFavourite);
  const [toggling, setToggling] = useState(false);

  const imageUri = property.gallery?.[0]
    ? property.gallery[0].startsWith("http")
      ? property.gallery[0]
      : `${API_URL}/${property.gallery[0]}`
    : null;

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
      onFavouriteChange?.();
    } catch {
      Alert.alert("Erreur", "Impossible de modifier les favoris.");
    } finally {
      setToggling(false);
    }
  }

  function handleWhatsApp() {
    const phone = (property.agent as any)?.phone ?? "";
    if (!phone) return;
    const msg = encodeURIComponent(`Bonjour, je suis intéressé par ${property.title}`);
    Linking.openURL(`https://wa.me/${phone.replace(/\D/g, "")}?text=${msg}`);
  }

  return (
    <TouchableOpacity
      onPress={() => router.push(`/property/${property.id}` as any)}
      activeOpacity={0.95}
      className="bg-white rounded-2xl border border-border mb-4 overflow-hidden"
      style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}
    >
      {/* Image */}
      <View style={{ height: 200, position: "relative" }}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={{ width: "100%", height: 200 }} contentFit="cover" />
        ) : (
          <View style={{ width: "100%", height: 200, backgroundColor: "#EAF2FB" }} />
        )}
        {/* Badges */}
        <View style={{ position: "absolute", top: 10, left: 10, flexDirection: "row", gap: 6 }}>
          {property.verified && <Badge label="Vérifié" variant="secondary" />}
          {property.isNew && <Badge label="Nouveau" variant="gold" />}
          {property.premium && <Badge label="Premium" variant="gold" />}
        </View>
        {/* Heart */}
        <TouchableOpacity
          onPress={handleFavourite}
          disabled={toggling}
          style={{ position: "absolute", top: 10, right: 10, backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 20, padding: 8 }}
        >
          <Heart
            size={18}
            color={fav ? "#DC2626" : Colors.mutedFg}
            fill={fav ? "#DC2626" : "transparent"}
          />
        </TouchableOpacity>
      </View>

      {/* Body */}
      <View className="p-4">
        <Text className="text-xl font-sans-bold text-text-dark">
          {formatPrice(property.price, property.currency, property.period)}
        </Text>
        <Text className="text-base font-sans-semibold text-text-dark mt-1" numberOfLines={2}>
          {property.title}
        </Text>
        <View className="flex-row items-center mt-1 gap-1">
          <MapPin size={13} color={Colors.mutedFg} />
          <Text className="text-muted-fg text-xs">{property.suburb}, {property.city}</Text>
        </View>

        {/* Stats row */}
        <View className="flex-row gap-3 mt-3">
          {property.bedrooms > 0 && (
            <View className="flex-row items-center gap-1">
              <BedDouble size={14} color={Colors.mutedFg} />
              <Text className="text-xs text-muted-fg">{property.bedrooms}</Text>
            </View>
          )}
          {property.bathrooms > 0 && (
            <View className="flex-row items-center gap-1">
              <Bath size={14} color={Colors.mutedFg} />
              <Text className="text-xs text-muted-fg">{property.bathrooms}</Text>
            </View>
          )}
          {property.areaSqm > 0 && (
            <View className="flex-row items-center gap-1">
              <Maximize2 size={14} color={Colors.mutedFg} />
              <Text className="text-xs text-muted-fg">{property.areaSqm} m²</Text>
            </View>
          )}
        </View>

        {/* Agent row */}
        <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-border">
          <Text className="text-xs text-muted-fg">{property.agent?.name}</Text>
          {(property.agent as any)?.phone && (
            <TouchableOpacity
              onPress={handleWhatsApp}
              className="flex-row items-center gap-1 bg-green-50 px-3 py-1.5 rounded-full"
            >
              <MessageCircle size={13} color="#25D366" />
              <Text style={{ color: "#25D366", fontSize: 12, fontWeight: "600" }}>WhatsApp</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
