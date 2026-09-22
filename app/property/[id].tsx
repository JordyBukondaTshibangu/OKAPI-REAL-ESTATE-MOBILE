import React, { useState, useEffect, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, FlatList, Modal, TextInput, Alert, Dimensions, KeyboardAvoidingView, Platform, Animated } from "react-native";
import { openURL } from "../../src/utils/linking";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { fetchPropertyById, recordPropertyView, recordPropertyShare, recordPropertyWhatsAppClick } from "../../src/services/properties";
import type { PropertyPerformance } from "../../src/types/property";
import PerformanceCard from "../../src/components/property/PerformanceCard";
import LocationMap from "../../src/components/property/LocationMap";
import { addFavourite, removeFavourite, createEnquiry, reportProperty, type ReportReason } from "../../src/services/auth";
import { useFavouriteIds } from "../../src/hooks/useFavouriteIds";
import { useAuthStore } from "../../src/store/useAuthStore";
import { useAgentSessionStore } from "../../src/store/useAgentSessionStore";
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
import { Heart, Share2, Flag, MoreHorizontal, BedDouble, Bath, Maximize2, Moon, Phone, MessageCircle, MapPin, CheckCircle, ChevronRight, Pencil } from "lucide-react-native";

const { width, height: screenHeight } = Dimensions.get("window");
const PHOTO_HEIGHT = Math.round(screenHeight * 0.52);

function formatFrenchDate(iso: string): string {
  const d = new Date(iso);
  const months = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
  const day = d.getDate();
  return `${day}${day === 1 ? "er" : ""} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, isAuthenticated, logout } = useAuthStore();
  const { isAuthenticated: isAgentLoggedIn, agent: agentSession } = useAgentSessionStore();
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
  const heartScale = useRef(new Animated.Value(1)).current;

  function animateHeart() {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true, speed: 40, bounciness: 14 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }),
    ]).start();
  }
  // Parallax scroll tracking
  const scrollY = useRef(new Animated.Value(0)).current;
  const imageParallax = scrollY.interpolate({
    inputRange: [0, 280],
    outputRange: [0, -70],
    extrapolate: "clamp",
  });

  const [actionsSheet, setActionsSheet] = useState(false);
  const [enquiryModal, setEnquiryModal] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [performance, setPerformance] = useState<PropertyPerformance | null>(null);
  const [reportModal, setReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason | "">("");
  const [reportDesc, setReportDesc] = useState("");
  const [reportSending, setReportSending] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  const { data: property, isLoading } = useQuery({
    queryKey: ["property", id],
    queryFn: () => fetchPropertyById(id!),
    enabled: !!id,
  });

  // Sync fav state once the server favourites list is loaded
  useEffect(() => {
    if (id) setFav(favouriteIds.has(id));
  }, [favouriteIds, id]);

  // Record one view per identity (logged-in agent id, or device session UUID)
  useEffect(() => {
    if (!id) return;
    recordPropertyView(id, agentSession?.id).then(setPerformance).catch(() => {});
  }, [id]);

  if (isLoading) return <Loader />;
  if (!property) return null;

  const images = property.gallery?.length ? property.gallery : [];
  const contactPhone = getContactPhone(property);

  // Agent context — determines which CTAs to show on the detail page
  const isOwnListing = isAgentLoggedIn && agentSession?.id != null && property.agent?.id === agentSession.id;

  async function handleFavourite() {
    if (!isAuthenticated || !token) { router.push("/(auth)/connexion"); return; }
    animateHeart();
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
    } catch (err: any) {
      if (err?.response?.status === 401) { logout(); router.replace("/(auth)/connexion"); }
      else { Alert.alert(t.common.error, t.property.favError); }
    } finally { setToggling(false); }
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
    recordPropertyShare(property!.id, agentSession?.id).then(setPerformance).catch(() => {});
  }

  function openWhatsApp() {
    if (!contactPhone || !property) return;
    const msg = buildPropertyWhatsAppMessage(t.property.whatsappMessage, property.id, property.reference);
    launchWhatsApp(contactPhone, msg);
    recordPropertyWhatsAppClick(property.id, agentSession?.id).then((p) => { if (p) setPerformance(p); }).catch(() => {});
  }

  const sectionStyle = {
    backgroundColor: cardBg,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 8,
  };

  return (
    <View style={{ flex: 1, backgroundColor: pageBg }}>
      <Stack.Screen options={{ title: property.title }} />
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {/* Image gallery — 52% viewport height + translateY for parallax */}
        <View style={{ height: PHOTO_HEIGHT, backgroundColor: altBg, overflow: "hidden" }}>
        <Animated.View style={{ height: PHOTO_HEIGHT + 60, transform: [{ translateY: imageParallax }] }}>
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
                <Image source={{ uri }} style={{ width, height: PHOTO_HEIGHT + 60 }} contentFit="cover" />
              ) : (
                <View style={{ width, height: PHOTO_HEIGHT + 60, backgroundColor: altBg }} />
              );
            }}
          />
          {images.length > 1 && (
            <View style={{ position: "absolute", bottom: 12, alignSelf: "center", flexDirection: "row", gap: 6, alignItems: "center" }}>
              {images.map((_, i) => (
                <Animated.View key={i} style={{
                  width: i === activeImage ? 22 : 6,
                  height: 6, borderRadius: 3,
                  backgroundColor: i === activeImage ? Colors.primary : "rgba(255,255,255,0.55)",
                  opacity: i === activeImage ? 1 : 0.7,
                }} />
              ))}
            </View>
          )}
        </Animated.View>
        </View>

        {/* Price / title / actions */}
        <View style={sectionStyle}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              {property.isExclusive && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6, alignSelf: "flex-start", backgroundColor: "#F59E0B", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ color: "#fff", fontSize: 10, fontFamily: "DMSans_700Bold" }}>⭐ {t.property.badgeExclusive}</Text>
                </View>
              )}
              <Text style={{ fontSize: 18, fontFamily: "DMSans_700Bold", color: textMain, lineHeight: 24 }}>
                {property.title}
              </Text>
              <Text style={{ fontSize: 24, fontFamily: "DMSans_700Bold", color: textMain, marginTop: 4 }}>
                {formatPrice(property.price, property.currency, property.period)}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                <MapPin size={13} color={textMuted} />
                <Text style={{ color: textMuted, fontSize: 13 }}>{property.suburb}</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {/* Heart — hidden for agents */}
              {!isAgentLoggedIn && (
                <TouchableOpacity onPress={handleFavourite} disabled={toggling} activeOpacity={0.8}>
                  <Animated.View style={{
                    transform: [{ scale: heartScale }],
                    width: 46, height: 46, borderRadius: 23,
                    alignItems: "center", justifyContent: "center",
                    backgroundColor: fav ? Colors.destructive : cardBg,
                    borderWidth: fav ? 0 : 1.5,
                    borderColor: fav ? "transparent" : Colors.destructive,
                    shadowColor: "#DC2626",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: fav ? 0.35 : 0.15,
                    shadowRadius: 6,
                    elevation: 4,
                  }}>
                    <Heart size={20} color={fav ? "#fff" : Colors.destructive} fill={fav ? "#fff" : "transparent"} />
                  </Animated.View>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => setActionsSheet(true)}
                style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: borderC, alignItems: "center", justifyContent: "center", backgroundColor: cardBg }}
              >
                <MoreHorizontal size={18} color={textMuted} />
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

        {/* Performance metrics — only show when engagement is meaningful */}
        {(() => {
          const perf = performance ?? property.performance;
          return perf && perf.viewed >= 20 ? (
            <PerformanceCard performance={perf} isDark={isDark} />
          ) : null;
        })()}

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
              {property.neighborhood ? `${property.neighborhood}, ` : ""}{property.suburb}
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
          {/* Own-listing agent CTAs */}
          {isOwnListing && (
            <Button
              variant="navy"
              onPress={() => router.push(`/espace-agent/annonces/nouvelle?id=${property!.id}` as any)}
              style={{ width: "100%", marginBottom: 8 }}
            >
              <Pencil size={15} color="#fff" />
              <Text style={{ color: "#fff", marginLeft: 6 }}>{t.espaceAgent.editBtn}</Text>
            </Button>
          )}

          {/* Contact buttons — only for regular users, never for agents */}
          {!isOwnListing && !isAgentLoggedIn && (
            <>
              {/* WhatsApp — primary full-width */}
              {!!contactPhone && (
                <Button variant="default" onPress={openWhatsApp} style={{ width: "100%", backgroundColor: "#25D366", marginBottom: 10 }}>
                  <MessageCircle size={16} color="#fff" />
                  <Text style={{ color: "#fff", marginLeft: 6, fontFamily: "DMSans_600SemiBold", fontSize: 15 }}>{t.property.whatsapp}</Text>
                </Button>
              )}
              {/* Secondary row: Call + Enquiry */}
              <View style={{ flexDirection: "row", gap: 10 }}>
                {!!contactPhone && (
                  <Button variant="outline" onPress={() => openURL(`tel:${contactPhone}`)} style={{ flex: 1 }}>
                    <Phone size={15} color={isDark ? Colors.dark.primary : Colors.primary} />
                    <Text style={{ color: isDark ? Colors.dark.primary : Colors.primary, marginLeft: 4 }}>{t.property.call}</Text>
                  </Button>
                )}
                <Button variant="outline" onPress={() => setEnquiryModal(true)} style={{ flex: 1 }}>
                  <Text style={{ color: isDark ? Colors.dark.primary : Colors.primary }}>{t.property.submitEnquiry}</Text>
                </Button>
              </View>
            </>
          )}

          {/* Enquiry only (no phone / agent viewer) */}
          {!isAgentLoggedIn && isOwnListing === false && !contactPhone && (
            <Button variant="navy" onPress={() => setEnquiryModal(true)} style={{ width: "100%" }}>
              {t.property.submitEnquiry}
            </Button>
          )}
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
            property.reference ? [t.property.reference, property.reference] : null,
            [t.property.type, categoryLabel(property.category)],
            property.areaSqm > 0 ? [t.property.area, `${property.areaSqm} m²`] : null,
            property.bedrooms > 0 ? [t.property.bedrooms, String(property.bedrooms)] : null,
            property.bathrooms > 0 ? [t.property.bathrooms, String(property.bathrooms)] : null,
            property.availableFrom ? [t.property.availableFrom, formatFrenchDate(property.availableFrom)] : null,
          ].filter(Boolean).map(([label, value]: any, i: number) => (
            <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: borderC }}>
              <Text style={{ color: textMuted, fontSize: 14 }}>{label}</Text>
              <Text style={{ color: textMain, fontSize: 14, fontFamily: "DMSans_500Medium" }}>{value}</Text>
            </View>
          ))}
        </View>

      </Animated.ScrollView>

      {/* Actions bottom sheet (⋮ menu) */}
      <Modal visible={actionsSheet} transparent animationType="slide" onRequestClose={() => setActionsSheet(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }} onPress={() => setActionsSheet(false)} activeOpacity={1} />
        <View style={{ backgroundColor: cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32 }}>
          {/* Handle */}
          <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 8 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: borderC }} />
          </View>

          {/* Share */}
          <TouchableOpacity
            onPress={() => { setActionsSheet(false); handleShare(); }}
            activeOpacity={0.7}
            style={{ flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 24, paddingVertical: 16 }}
          >
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? Colors.dark.accent : Colors.accent, alignItems: "center", justifyContent: "center" }}>
              <Share2 size={18} color={iconColor} />
            </View>
            <View>
              <Text style={{ color: textMain, fontFamily: "DMSans_600SemiBold", fontSize: 15 }}>{t.property.shareTitle}</Text>
            </View>
          </TouchableOpacity>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: borderC, marginHorizontal: 24 }} />

          {/* Report */}
          {!isAgentLoggedIn && (
            <TouchableOpacity
              onPress={() => {
                setActionsSheet(false);
                if (!isAuthenticated) { router.push("/connexion" as any); return; }
                setReportModal(true);
              }}
              activeOpacity={0.7}
              style={{ flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 24, paddingVertical: 16 }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#FEE2E2", alignItems: "center", justifyContent: "center" }}>
                <Flag size={18} color="#DC2626" />
              </View>
              <View>
                <Text style={{ color: textMain, fontFamily: "DMSans_600SemiBold", fontSize: 15 }}>{t.property.report.buttonLabel}</Text>
                <Text style={{ color: textMuted, fontSize: 12, marginTop: 1 }}>{t.property.report.buttonSubtitle}</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Cancel */}
          <View style={{ marginHorizontal: 20, marginTop: 8 }}>
            <TouchableOpacity
              onPress={() => setActionsSheet(false)}
              activeOpacity={0.8}
              style={{ backgroundColor: isDark ? Colors.dark.muted : Colors.backgroundAlt, borderRadius: 14, paddingVertical: 14, alignItems: "center" }}
            >
              <Text style={{ color: textMain, fontFamily: "DMSans_600SemiBold", fontSize: 15 }}>{t.common.cancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

      {/* Report modal */}
      <Modal visible={reportModal} transparent animationType="slide" onRequestClose={() => setReportModal(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }} onPress={() => setReportModal(false)} activeOpacity={1} />
        <View style={{
          backgroundColor: cardBg,
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40,
        }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: borderC, alignSelf: "center", marginBottom: 16 }} />
          {reportSent ? (
            <View style={{ alignItems: "center", paddingVertical: 16 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#dcfce7", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <Text style={{ fontSize: 22 }}>✓</Text>
              </View>
              <Text style={{ color: textMain, fontSize: 16, fontFamily: "DMSans_700Bold", marginBottom: 6 }}>{t.property.report.sentTitle}</Text>
              <Text style={{ color: textMuted, fontSize: 13, textAlign: "center", marginBottom: 20 }}>
                {t.property.report.sentDesc}
              </Text>
              <Button onPress={() => { setReportModal(false); setReportSent(false); setReportReason(""); setReportDesc(""); }}>{t.property.report.closeBtn}</Button>
            </View>
          ) : (
            <>
              <Text style={{ color: textMain, fontSize: 17, fontFamily: "DMSans_700Bold", marginBottom: 4 }}>{t.property.report.modalTitle}</Text>
              <Text style={{ color: textMuted, fontSize: 13, marginBottom: 16 }}>{t.property.report.modalSubtitle}</Text>
              {([
                ["FAKE_LISTING",   t.property.report.reasonFakeListing],
                ["WRONG_PRICE",    t.property.report.reasonWrongPrice],
                ["STOLEN_PHOTOS",  t.property.report.reasonStolenPhotos],
                ["ALREADY_RENTED", t.property.report.reasonAlreadyRented],
                ["SCAM",           t.property.report.reasonScam],
                ["INAPPROPRIATE",  t.property.report.reasonInappropriate],
                ["OTHER",          t.property.report.reasonOther],
              ] as [ReportReason, string][]).map(([val, label]) => (
                <TouchableOpacity
                  key={val}
                  onPress={() => setReportReason(val)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row", alignItems: "center", gap: 12,
                    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: borderC,
                  }}
                >
                  <View style={{
                    width: 18, height: 18, borderRadius: 9,
                    borderWidth: 2,
                    borderColor: reportReason === val ? (isDark ? Colors.dark.primary : Colors.primary) : borderC,
                    alignItems: "center", justifyContent: "center",
                  }}>
                    {reportReason === val && (
                      <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: isDark ? Colors.dark.primary : Colors.primary }} />
                    )}
                  </View>
                  <Text style={{ color: textMain, fontSize: 14 }}>{label}</Text>
                </TouchableOpacity>
              ))}
              <TextInput
                value={reportDesc}
                onChangeText={setReportDesc}
                placeholder={t.property.report.descPlaceholder}
                placeholderTextColor={textMuted}
                multiline
                numberOfLines={3}
                maxLength={1000}
                style={{
                  borderWidth: 1.5, borderColor: borderC, borderRadius: 12,
                  padding: 12, minHeight: 80, textAlignVertical: "top",
                  color: textMain, marginTop: 14, marginBottom: 14,
                  backgroundColor: altBg, fontFamily: "DMSans_400Regular", fontSize: 14,
                }}
              />
              <Button
                onPress={async () => {
                  if (!reportReason || !token) return;
                  setReportSending(true);
                  try {
                    await reportProperty(token, id!, reportReason, reportDesc.trim() || undefined);
                    setReportSent(true);
                  } catch {
                    Alert.alert(t.property.report.errorTitle, t.property.report.errorMsg);
                  } finally {
                    setReportSending(false);
                  }
                }}
                loading={reportSending}
                disabled={!reportReason}
                size="lg"
              >
                {t.property.report.submitBtn}
              </Button>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}
