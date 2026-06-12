import React from "react";
import { View, Text, TouchableOpacity, Linking, Platform } from "react-native";
import MapView, { Marker, Circle } from "react-native-maps";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, MapPin } from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { geocodeProperty } from "../../lib/geocode";

type Props = {
  neighborhood?: string | null;
  suburb: string;
  city: string;
  title: string;
  isDark: boolean;
};

/** Approximate-area radius in meters, by geocoding precision */
const RADIUS = { neighborhood: 350, suburb: 900, city: 4000 } as const;

export default function LocationMap({ neighborhood, suburb, city, title, isDark }: Props) {
  const textMuted = isDark ? Colors.dark.mutedFg : Colors.mutedFg;
  const borderC = isDark ? Colors.dark.border : Colors.border;
  const primary = isDark ? Colors.dark.primary : Colors.primary;

  const address = [neighborhood, suburb, city].filter(Boolean).join(", ");

  const { data: location, isLoading } = useQuery({
    queryKey: ["geocode", address],
    queryFn: () => geocodeProperty({ neighborhood, suburb, city }),
    staleTime: Infinity,
    retry: false,
  });

  function openInMaps() {
    const q = encodeURIComponent(address);
    const url = Platform.select({
      ios: location
        ? `maps:0,0?q=${encodeURIComponent(title)}@${location.latitude},${location.longitude}`
        : `maps:0,0?q=${q}`,
      default: location
        ? `geo:${location.latitude},${location.longitude}?q=${location.latitude},${location.longitude}(${encodeURIComponent(title)})`
        : `geo:0,0?q=${q}`,
    });
    Linking.openURL(url).catch(() =>
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`),
    );
  }

  if (isLoading) {
    return (
      <View style={{ height: 180, borderRadius: 12, marginTop: 12, backgroundColor: isDark ? Colors.dark.muted : Colors.backgroundAlt, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: textMuted, fontSize: 13 }}>Chargement de la carte…</Text>
      </View>
    );
  }

  if (!location) {
    // Geocoding failed — still give the user a way to look it up
    return (
      <TouchableOpacity
        onPress={openInMaps}
        style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12, borderWidth: 1, borderColor: borderC, borderRadius: 12, paddingVertical: 12 }}
      >
        <MapPin size={15} color={primary} />
        <Text style={{ color: primary, fontSize: 14, fontFamily: "DMSans_500Medium" }}>Voir sur la carte</Text>
      </TouchableOpacity>
    );
  }

  const radius = RADIUS[location.precision];

  return (
    <View style={{ marginTop: 12 }}>
      <View style={{ borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: borderC }}>
        <MapView
          style={{ height: 200, width: "100%" }}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: radius / 25000,
            longitudeDelta: radius / 25000,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
          toolbarEnabled={false}
          onPress={openInMaps}
        >
          <Circle
            center={location}
            radius={radius}
            strokeColor={isDark ? "rgba(91,165,232,0.8)" : "rgba(30,99,181,0.6)"}
            fillColor={isDark ? "rgba(91,165,232,0.18)" : "rgba(30,99,181,0.14)"}
          />
          <Marker coordinate={location} title={title} description={address} pinColor={Colors.primary} />
        </MapView>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
        <Text style={{ color: textMuted, fontSize: 12, flex: 1, marginRight: 8 }}>
          Emplacement approximatif ({address})
        </Text>
        <TouchableOpacity onPress={openInMaps} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <ExternalLink size={13} color={primary} />
          <Text style={{ color: primary, fontSize: 13, fontFamily: "DMSans_500Medium" }}>Ouvrir dans Maps</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
