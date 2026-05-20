import React, { useState, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, FlatList, Modal, TextInput, Alert, Linking, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { fetchPropertyById } from "../../src/services/properties";
import { addFavourite, removeFavourite, createEnquiry } from "../../src/services/auth";
import { useAuthStore } from "../../src/store/useAuthStore";
import Loader from "../../src/components/ui/Loader";
import Avatar from "../../src/components/ui/Avatar";
import Badge from "../../src/components/ui/Badge";
import Button from "../../src/components/ui/Button";
import { Colors } from "../../src/constants/colors";
import { formatPrice, categoryLabel } from "../../src/lib/format";
import { shareProperty } from "../../src/lib/share";
import { API_URL } from "../../src/constants/api";
import { Heart, Share2, BedDouble, Bath, Maximize2, Phone, MessageCircle, MapPin, CheckCircle } from "lucide-react-native";

const { width } = Dimensions.get("window");

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const [fav, setFav] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [enquiryModal, setEnquiryModal] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const { data: property, isLoading } = useQuery({
    queryKey: ["property", id],
    queryFn: () => fetchPropertyById(id!),
    enabled: !!id,
  });

  if (isLoading) return <Loader />;
  if (!property) return null;

  const images = property.gallery?.length ? property.gallery : [];

  async function handleFavourite() {
    if (!isAuthenticated || !token) { router.push("/(auth)/connexion"); return; }
    setToggling(true);
    try {
      if (fav) { await removeFavourite(token, property!.id); setFav(false); }
      else { await addFavourite(token, property!.id); setFav(true); }
    } catch { Alert.alert("Erreur", "Impossible de modifier les favoris."); }
    finally { setToggling(false); }
  }

  async function handleEnquiry() {
    if (!isAuthenticated || !token) { router.push("/(auth)/connexion"); return; }
    if (!message.trim()) return;
    setSending(true);
    try {
      await createEnquiry(token, { propertyId: property!.id, message });
      setEnquiryModal(false);
      setMessage("");
      Alert.alert("Demande envoyée", "Votre message a été transmis à l'agent.");
    } catch { Alert.alert("Erreur", "Impossible d'envoyer votre demande."); }
    finally { setSending(false); }
  }

  function openWhatsApp() {
    const phone = (property?.agent as any)?.phone ?? "";
    if (!phone) return;
    const msg = encodeURIComponent(`Bonjour, je suis intéressé par ${property?.title ?? ""}`);
    Linking.openURL(`https://wa.me/${phone.replace(/\D/g, "")}?text=${msg}`);
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.backgroundAlt }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image gallery */}
        <View style={{ height: 260, backgroundColor: Colors.backgroundAlt }}>
          <FlatList
            data={images.length ? images : [null]}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => String(i)}
            onScroll={e => setActiveImage(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({ item }) => {
              const uri = item
                ? item.startsWith("http") ? item : `${API_URL}/${item}`
                : null;
              return uri ? (
                <Image source={{ uri }} style={{ width, height: 260 }} contentFit="cover" />
              ) : (
                <View style={{ width, height: 260, backgroundColor: Colors.backgroundAlt }} />
              );
            }}
          />
          {images.length > 1 && (
            <View style={{ position: "absolute", bottom: 12, alignSelf: "center", flexDirection: "row", gap: 6 }}>
              {images.map((_, i) => (
                <View key={i} style={{ width: i === activeImage ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === activeImage ? Colors.primary : "rgba(255,255,255,0.6)" }} />
              ))}
            </View>
          )}
        </View>

        <View className="bg-white px-5 pt-5 pb-4 mb-2">
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1 mr-4">
              <Text className="text-2xl font-sans-bold text-text-dark">
                {formatPrice(property.price, property.currency, property.period)}
              </Text>
              <Text className="text-base font-sans-semibold text-text-dark mt-1">{property.title}</Text>
              <View className="flex-row items-center gap-1 mt-1">
                <MapPin size={13} color={Colors.mutedFg} />
                <Text className="text-muted-fg text-sm">{property.suburb}, {property.city}</Text>
              </View>
            </View>
            <View className="flex-row gap-2">
              <TouchableOpacity onPress={handleFavourite} disabled={toggling} className="w-10 h-10 rounded-full border border-border items-center justify-center">
                <Heart size={18} color={fav ? Colors.destructive : Colors.mutedFg} fill={fav ? Colors.destructive : "transparent"} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => shareProperty(property.id, property.title)} className="w-10 h-10 rounded-full border border-border items-center justify-center">
                <Share2 size={18} color={Colors.mutedFg} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats row */}
          <View className="flex-row gap-4 pt-3 border-t border-border">
            {property.bedrooms > 0 && (
              <View className="flex-row items-center gap-1">
                <BedDouble size={16} color={Colors.primary} />
                <Text className="text-sm text-text-dark font-sans-medium">{property.bedrooms} ch.</Text>
              </View>
            )}
            {property.bathrooms > 0 && (
              <View className="flex-row items-center gap-1">
                <Bath size={16} color={Colors.primary} />
                <Text className="text-sm text-text-dark font-sans-medium">{property.bathrooms} bains</Text>
              </View>
            )}
            {property.areaSqm > 0 && (
              <View className="flex-row items-center gap-1">
                <Maximize2 size={16} color={Colors.primary} />
                <Text className="text-sm text-text-dark font-sans-medium">{property.areaSqm} m²</Text>
              </View>
            )}
            <Badge label={categoryLabel(property.category)} variant="muted" />
          </View>
        </View>

        {/* Description */}
        {property.description && (
          <View className="bg-white px-5 py-4 mb-2">
            <Text className="text-text-dark font-sans-semibold text-base mb-2">Description</Text>
            <Text className="text-muted-fg text-sm leading-6">{property.description}</Text>
          </View>
        )}

        {/* Amenities */}
        {property.amenities?.length > 0 && (
          <View className="bg-white px-5 py-4 mb-2">
            <Text className="text-text-dark font-sans-semibold text-base mb-3">Équipements</Text>
            <View className="flex-row flex-wrap gap-2">
              {property.amenities.map((a, i) => (
                <View key={i} className="flex-row items-center gap-1.5 bg-accent rounded-full px-3 py-1.5">
                  <CheckCircle size={12} color={Colors.primary} />
                  <Text className="text-primary text-xs font-sans-medium">{a}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Location */}
        <View className="bg-white px-5 py-4 mb-2">
          <Text className="text-text-dark font-sans-semibold text-base mb-2">Localisation</Text>
          <View className="flex-row items-center gap-2 bg-background-alt rounded-xl p-3">
            <MapPin size={16} color={Colors.primary} />
            <Text className="text-text-dark text-sm">{property.neighborhood ? `${property.neighborhood}, ` : ""}{property.suburb}, {property.city}</Text>
          </View>
          {property.zone && <Text className="text-muted-fg text-xs mt-1 ml-1">Zone: {property.zone}</Text>}
        </View>

        {/* Agent card */}
        <View className="bg-white px-5 py-4 mb-2">
          <Text className="text-text-dark font-sans-semibold text-base mb-3">Votre agent</Text>
          <View className="flex-row items-center gap-3 mb-4">
            <Avatar name={property.agent.name} size={48} />
            <View className="flex-1">
              <Text className="text-text-dark font-sans-semibold">{property.agent.name}</Text>
              <Text className="text-muted-fg text-xs">{property.agent.title}</Text>
            </View>
          </View>
          <View className="flex-row gap-3 mb-3">
            {(property.agent as any)?.phone && (
              <Button
                variant="outline"
                onPress={() => Linking.openURL(`tel:${(property.agent as any).phone}`)}
                style={{ flex: 1 }}
              >
                <Phone size={15} color={Colors.primary} />
                <Text className="text-primary ml-1">Appeler</Text>
              </Button>
            )}
            {(property.agent as any)?.phone && (
              <Button variant="default" onPress={openWhatsApp} style={{ flex: 1 }}>
                <MessageCircle size={15} color="#fff" />
                <Text className="text-white ml-1">WhatsApp</Text>
              </Button>
            )}
          </View>
          <Button variant="navy" onPress={() => setEnquiryModal(true)} style={{ width: "100%" }}>
            Soumettre une demande
          </Button>
        </View>

        {/* Agency */}
        {property.agency && (
          <View className="bg-white px-5 py-4 mb-2">
            <Text className="text-text-dark font-sans-semibold text-base mb-2">Agence</Text>
            <View className="flex-row items-center gap-3">
              <View className="w-12 h-12 rounded-xl bg-navy items-center justify-center">
                <Text style={{ color: Colors.secondary, fontWeight: "700" }}>{property.agency.monogram}</Text>
              </View>
              <View>
                <Text className="text-text-dark font-sans-semibold">{property.agency.name}</Text>
                <Text className="text-muted-fg text-xs">{property.agency.tagline}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Property details table */}
        <View className="bg-white px-5 py-4 mb-6">
          <Text className="text-text-dark font-sans-semibold text-base mb-3">Détails du bien</Text>
          {[
            ["Référence", property.reference],
            ["Type", categoryLabel(property.category)],
            ["Surface", `${property.areaSqm} m²`],
            ["Chambres", String(property.bedrooms)],
            ["Salles de bain", String(property.bathrooms)],
            property.availableFrom ? ["Disponible dès", property.availableFrom] : null,
          ].filter(Boolean).map(([label, value]: any, i: number) => (
            <View key={i} className={`flex-row justify-between py-2.5 ${i > 0 ? "border-t border-border" : ""}`}>
              <Text className="text-muted-fg text-sm">{label}</Text>
              <Text className="text-text-dark text-sm font-sans-medium">{value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Enquiry modal */}
      <Modal visible={enquiryModal} transparent animationType="slide" onRequestClose={() => setEnquiryModal(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }} onPress={() => setEnquiryModal(false)} />
        <View className="bg-white rounded-t-3xl px-5 pt-5 pb-10" style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
          <Text className="text-text-dark text-lg font-sans-semibold mb-4">Envoyer une demande</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Décrivez votre demande ou posez une question…"
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={4}
            style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 12, minHeight: 100, textAlignVertical: "top", color: Colors.foreground, marginBottom: 16 }}
          />
          <Button onPress={handleEnquiry} loading={sending} size="lg">Envoyer</Button>
        </View>
      </Modal>
    </View>
  );
}
