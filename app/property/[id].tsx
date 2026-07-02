import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, FlatList, Modal, TextInput, Alert, Dimensions, KeyboardAvoidingView, Platform } from "react-native";
import { openURL } from "../../src/utils/linking";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { fetchPropertyById, recordPropertyView, recordPropertyShare } from "../../src/services/properties";
import type { PropertyPerformance } from "../../src/types/property";
import PerformanceCard from "../../src/components/property/PerformanceCard";
import LocationMap from "../../src/components/property/LocationMap";
import { addFavourite, removeFavourite, createEnquiry } from "../../src/services/auth";
import { useFavouriteIds } from "../../src/hooks/useFavouriteIds";
import { useAuthStore } from "../../src/store/useAuthStore";
import { useThemeStore } from "../../src/store/useThemeStore";
import Loader from "../../src/components/ui/Loader";
import Avatar from "../../src/components/ui/Avatar";
import Badge from "../../src/components/ui/Badge";
import Button from "../../src/components/ui/Button";
import { Colors } from "../../src/constants/colors";
import { formatPrice, categoryLabel } from "../../src/lib/format";
import { shareProperty } from "../../src/lib/share";
import { openWhatsApp as launchWhatsApp, buildPropertyWhatsAppMessage, getContactPhone } from "../../src/lib/whatsapp";
import { useT } from "../../src/i18n/useT";
import { API_URL } from "../../src/constants/api";
import { Stack } from "expo-router";
import { Heart, Share2, BedDouble, Bath, Maximize2, Moon, Phone, MessageCircle, MapPin, CheckCircle, ChevronRight } from "lucide-react-native";

const { width } = Dimensions.get("window");

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, isAuthenticated } = useAuthStore();
  const { theme } = useThemeStore();
  const t = useT();
  const isDark = theme === "dark";
  const queryClient = useQueryClient();

  // Theme helpers
  const pageBg    = isDark ? Colors.dark.background : Colors.backgroundAlt;
  const cardBg    = isDark ? Colors.dark.card : Colors.white;
  const borderC   = isDark ? Colors.dark.border : Colors.border;
  const textMain  = isDark ? Colors.dark.foreground : Colors.textDark;
  const textMuted = isDark ? Colors.dark.mutedFg : Colors.mutedFg;
  const altBg     = isDark ? Colors.dark.muted : Colors.backgroundAlt;
  const accentBg  = isDark ? Colors.dark.accent : Colors.accent;
  const iconColor = isDark ? Colors.dark.primary : Colors.primary;

  const favouriteIds = useFavouriteIds();
  const [fav, setFav] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [enquiryModal, setEnquiryModal] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [performance, setPerformance] = useState<PropertyPerformance | null>(null);

  const { data: property, isLoading } = useQuery({
    queryKey: ["property", id],
    queryFn: () => fetchPropertyById(id!),
    enabled: !!id,
  });

  // Sync fav state once the server favourites list is loaded
  useEffect(() => {
    if (id) setFav(favouriteIds.has(id));
  }, [favouriteIds, id]);

  // Record one view per visit; response carries fresh counters
  useEffect(() => {
    if (!id) return;
    recordPropertyView(id).then(setPerformance).catch(() => {});
  }, [id]);

  if (isLoading) return <Loader />;
  if (!property) return null;

  const images = property.gallery?.length ? property.gallery : [];
  const contactPhone = getContactPhone(property);

  async function handleFavourite() {
    if (!isAuthenticated || !token) { router.push("/(auth)/connexion"); return; }
    setToggling(true);
    try {
      if (fav) {
        await removeFavourite(token, property!.id); setFav(false);
        setPerformance(p => p ? { ...p, saved: Math.max(0, p.saved - 1) } : p);
      } else {
        await addFavourite(token, property!.id); setFav(true);
        setPerformance(p => p ? { ...p, saved: p.saved + 1 } : p);
      }
      queryClient.invalidateQueries({ queryKey: ["favourites"] });
    } catch { Alert.alert(t.common.error, t.property.favError); }
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
      Alert.alert(t.property.enquirySent, t.property.enquirySentMsg);
    } catch { Alert.alert(t.common.error, t.property.enquiryError); }
    finally { setSending(false); }
  }

  async function handleShare() {
    await shareProperty(property!.id, property!.title);
    recordPropertyShare(property!.id).then(setPerformance).catch(() => {});
  }

  function openWhatsApp() {
    if (!contactPhone || !property) return;
    const msg = buildPropertyWhatsAppMessage(t.property.whatsappMessage, property.id, property.reference);
    launchWhatsApp(contactPhone, msg);
  }

  const sectionStyle = {
    backgroundColor: cardBg,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 8,
  };

  return (
    <View style={{ flex: 1, backgroundColor: pageBg }}>
      <Stack.Screen options={{ title: t.property.screenTitle }} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image gallery */}
        <View style={{ height: 260, backgroundColor: altBg }}>
          <FlatList
            data={images.length ? images : [null]}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => String(i)}
            onScroll={e => setActiveImage(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({ item }) => {
              const uri = item ? (item.startsWith("http") ? item : `${API_URL}/${item}`) : null;
              return uri ? (
                <Image source={{ uri }} style={{ width, height: 260 }} contentFit="cover" />
              ) : (
                <View style={{ width, height: 260, backgroundColor: altBg }} />
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

        {/* Price / title / actions */}
        <View style={sectionStyle}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ fontSize: 26, fontFamily: "DMSans_700Bold", color: textMain }}>
                {formatPrice(property.price, property.currency, property.period)}
              </Text>
              <Text style={{ fontSize: 16, fontFamily: "DMSans_600SemiBold", color: textMain, marginTop: 4 }}>
                {property.title}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                <MapPin size={13} color={textMuted} />
                <Text style={{ color: textMuted, fontSize: 13 }}>{property.suburb}, {property.city}</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={handleFavourite} disabled={toggling}
                style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: borderC, alignItems: "center", justifyContent: "center", backgroundColor: cardBg }}
              >
                <Heart size={18} color={fav ? Colors.destructive : textMuted} fill={fav ? Colors.destructive : "transparent"} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleShare}
                style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: borderC, alignItems: "center", justifyContent: "center", backgroundColor: cardBg }}
              >
                <Share2 size={18} color={textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats row */}
          <View style={{ flexDirection: "row", gap: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: borderC, alignItems: "center" }}>
            {property.bedrooms > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <BedDouble size={16} color={iconColor} />
                <Text style={{ fontSize: 13, color: textMain, fontFamily: "DMSans_500Medium" }}>{property.bedrooms} {t.property.bedsBadge}</Text>
              </View>
            )}
            {property.bathrooms > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Bath size={16} color={iconColor} />
                <Text style={{ fontSize: 13, color: textMain, fontFamily: "DMSans_500Medium" }}>{property.bathrooms} {t.property.bathsBadge}</Text>
              </View>
            )}
            {property.areaSqm > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Maximize2 size={16} color={iconColor} />
                <Text style={{ fontSize: 13, color: textMain, fontFamily: "DMSans_500Medium" }}>{property.areaSqm} m²</Text>
              </View>
            )}
            <Badge label={categoryLabel(property.category)} variant="muted" />
          </View>
        </View>

        {/* Performance metrics */}
        {(performance ?? property.performance) && (
          <PerformanceCard performance={(performance ?? property.performance)!} isDark={isDark} />
        )}

        {/* Description */}
        {property.description && (
          <View style={sectionStyle}>
            <Text style={{ color: textMain, fontFamily: "DMSans_700Bold", fontSize: 16, marginBottom: 8 }}>{t.property.description}</Text>
            <Text style={{ color: textMuted, fontSize: 14, lineHeight: 22 }}>{property.description}</Text>
          </View>
        )}

        {/* Short-term rental info */}
        {property.isShortTerm && (
          <View style={sectionStyle}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Moon size={16} color={isDark ? Colors.dark.primary : Colors.primary} />
              <Text style={{ color: textMain, fontFamily: "DMSans_700Bold", fontSize: 16 }}>{t.property.shortTermTitle}</Text>
              <View style={{ backgroundColor: isDark ? "rgba(99,102,241,0.15)" : "#EEF2FF", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ color: isDark ? Colors.dark.primary : Colors.primary, fontSize: 10, fontFamily: "DMSans_600SemiBold" }}>{t.property.shortTermBadge}</Text>
              </View>
              {property.isLongTerm && (
                <View style={{ backgroundColor: altBg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text style={{ color: textMuted, fontSize: 10, fontFamily: "DMSans_500Medium" }}>{t.property.longTermBadge}</Text>
                </View>
              )}
            </View>
            <View style={{ backgroundColor: altBg, borderRadius: 12, padding: 14, flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
              {property.pricePerNight != null && (
                <View style={{ flex: 1, minWidth: 100 }}>
                  <Text style={{ color: textMuted, fontSize: 11, fontFamily: "DMSans_400Regular", marginBottom: 2 }}>{t.property.pricePerNight}</Text>
                  <Text style={{ color: textMain, fontSize: 15, fontFamily: "DMSans_600SemiBold" }}>{property.pricePerNight.toLocaleString("fr-FR")} {property.currency}</Text>
                </View>
              )}
              {property.minStayNights != null && (
                <View style={{ flex: 1, minWidth: 100 }}>
                  <Text style={{ color: textMuted, fontSize: 11, fontFamily: "DMSans_400Regular", marginBottom: 2 }}>{t.property.minStay}</Text>
                  <Text style={{ color: textMain, fontSize: 15, fontFamily: "DMSans_600SemiBold" }}>{property.minStayNights} {t.property.nightUnit}</Text>
                </View>
              )}
              {property.maxStayNights != null && (
                <View style={{ flex: 1, minWidth: 100 }}>
                  <Text style={{ color: textMuted, fontSize: 11, fontFamily: "DMSans_400Regular", marginBottom: 2 }}>{t.property.maxStay}</Text>
                  <Text style={{ color: textMain, fontSize: 15, fontFamily: "DMSans_600SemiBold" }}>{property.maxStayNights} {t.property.nightUnit}</Text>
                </View>
              )}
            </View>
            {property.shortTermNotes && (
              <Text style={{ color: textMuted, fontSize: 13, lineHeight: 20, marginTop: 10 }}>{property.shortTermNotes}</Text>
            )}
          </View>
        )}

        {/* Amenities */}
        {property.amenities?.length > 0 && (
          <View style={sectionStyle}>
            <Text style={{ color: textMain, fontFamily: "DMSans_700Bold", fontSize: 16, marginBottom: 12 }}>{t.property.amenities}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {property.amenities.map((a, i) => (
                <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: accentBg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <CheckCircle size={12} color={iconColor} />
                  <Text style={{ color: iconColor, fontSize: 12, fontFamily: "DMSans_500Medium" }}>{a}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Location */}
        <View style={sectionStyle}>
          <Text style={{ color: textMain, fontFamily: "DMSans_700Bold", fontSize: 16, marginBottom: 8 }}>{t.property.location}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: altBg, borderRadius: 12, padding: 12 }}>
            <MapPin size={16} color={iconColor} />
            <Text style={{ color: textMain, fontSize: 14, flex: 1 }}>
              {property.neighborhood ? `${property.neighborhood}, ` : ""}{property.suburb}, {property.city}
            </Text>
          </View>
          {property.zone && <Text style={{ color: textMuted, fontSize: 12, marginTop: 6, marginLeft: 4 }}>{t.property.zone}: {property.zone}</Text>}
          <LocationMap
            neighborhood={property.neighborhood}
            suburb={property.suburb}
            city={property.city}
            title={property.title}
            isDark={isDark}
          />
        </View>

        {/* Agent card */}
        <View style={sectionStyle}>
          <Text style={{ color: textMain, fontFamily: "DMSans_700Bold", fontSize: 16, marginBottom: 12 }}>{t.property.yourAgent}</Text>
          <TouchableOpacity
            disabled={!property.agent.id}
            onPress={() => router.push(`/agents/${property.agent.id}` as any)}
            activeOpacity={0.7}
            style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}
          >
            <Avatar name={property.agent.name} size={48} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: textMain, fontFamily: "DMSans_600SemiBold", fontSize: 15 }}>{property.agent.name}</Text>
              <Text style={{ color: textMuted, fontSize: 12, marginTop: 2 }}>{property.agent.title}</Text>
            </View>
            {!!property.agent.id && <ChevronRight size={18} color={textMuted} />}
          </TouchableOpacity>
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
            {!!contactPhone && (
              <Button variant="outline" onPress={() => openURL(`tel:${contactPhone}`)} style={{ flex: 1 }}>
                <Phone size={15} color={isDark ? Colors.dark.primary : Colors.primary} />
                <Text style={{ color: isDark ? Colors.dark.primary : Colors.primary, marginLeft: 4 }}>{t.property.call}</Text>
              </Button>
            )}
            {!!contactPhone && (
              <Button variant="default" onPress={openWhatsApp} style={{ flex: 1 }}>
                <MessageCircle size={15} color="#fff" />
                <Text style={{ color: "#fff", marginLeft: 4 }}>{t.property.whatsapp}</Text>
              </Button>
            )}
          </View>
          <Button variant="navy" onPress={() => setEnquiryModal(true)} style={{ width: "100%" }}>
            {t.property.submitEnquiry}
          </Button>
        </View>

        {/* Agency */}
        {property.agency && (
          <View style={sectionStyle}>
            <Text style={{ color: textMain, fontFamily: "DMSans_700Bold", fontSize: 16, marginBottom: 8 }}>{t.property.agency}</Text>
            <TouchableOpacity
              disabled={!property.agency.id}
              onPress={() => router.push(`/agences/${property.agency.id}` as any)}
              activeOpacity={0.7}
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.navy, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: Colors.secondary, fontFamily: "DMSans_700Bold", fontSize: 16 }}>{property.agency.monogram}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: textMain, fontFamily: "DMSans_600SemiBold" }}>{property.agency.name}</Text>
                <Text style={{ color: textMuted, fontSize: 12, marginTop: 2 }}>{property.agency.tagline}</Text>
              </View>
              {!!property.agency.id && <ChevronRight size={18} color={textMuted} />}
            </TouchableOpacity>
          </View>
        )}

        {/* Property details table */}
        <View style={{ ...sectionStyle, marginBottom: 24 }}>
          <Text style={{ color: textMain, fontFamily: "DMSans_700Bold", fontSize: 16, marginBottom: 12 }}>{t.property.propertyDetails}</Text>
          {[
            [t.property.reference, property.reference],
            [t.property.type, categoryLabel(property.category)],
            [t.property.area, `${property.areaSqm} m²`],
            [t.property.bedrooms, String(property.bedrooms)],
            [t.property.bathrooms, String(property.bathrooms)],
            property.availableFrom ? [t.property.availableFrom, property.availableFrom] : null,
          ].filter(Boolean).map(([label, value]: any, i: number) => (
            <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: borderC }}>
              <Text style={{ color: textMuted, fontSize: 14 }}>{label}</Text>
              <Text style={{ color: textMain, fontSize: 14, fontFamily: "DMSans_500Medium" }}>{value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Enquiry modal */}
      <Modal visible={enquiryModal} transparent animationType="slide" onRequestClose={() => setEnquiryModal(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }} onPress={() => setEnquiryModal(false)} />
          <View style={{
            backgroundColor: cardBg,
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40,
          }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: borderC, alignSelf: "center", marginBottom: 16 }} />
            <Text style={{ color: textMain, fontSize: 17, fontFamily: "DMSans_700Bold", marginBottom: 16 }}>
              {t.property.sendEnquiryTitle}
            </Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder={t.property.enquiryDescPlaceholder}
              placeholderTextColor={textMuted}
              multiline
              numberOfLines={4}
              style={{
                borderWidth: 1.5, borderColor: borderC, borderRadius: 12,
                padding: 12, minHeight: 100, textAlignVertical: "top",
                color: textMain, marginBottom: 16, backgroundColor: altBg,
                fontFamily: "DMSans_400Regular", fontSize: 14,
              }}
            />
            <Button onPress={handleEnquiry} loading={sending} size="lg">{t.property.send}</Button>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
