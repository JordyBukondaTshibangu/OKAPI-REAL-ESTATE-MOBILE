import React, { useState } from "react";
import { View, Text } from "react-native";
import { Image } from "expo-image";

interface AvatarProps {
  name: string;
  photo?: string | null;
  size?: number;
}

function getInitials(name?: string | null): string {
  if (!name?.trim()) return "?";
  // split on any whitespace, drop empty tokens (handles double-spaces, trailing spaces, etc.)
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

export default function Avatar({ name, photo, size = 40 }: AvatarProps) {
  const radius = size / 2;
  // If the photo URL fails to load (broken link, 404, etc.) fall back to
  // the initials avatar instead of leaving a blank/invisible circle.
  const [failed, setFailed] = useState(false);

  if (photo && !failed) {
    return (
      <Image
        source={{ uri: photo }}
        style={{ width: size, height: size, borderRadius: radius, backgroundColor: "#1E63B5" }}
        contentFit="cover"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <View
      style={{ width: size, height: size, borderRadius: radius, backgroundColor: "#1E63B5", alignItems: "center", justifyContent: "center" }}
    >
      <Text style={{ color: "#fff", fontSize: size * 0.35, fontWeight: "700" }}>
        {getInitials(name)}
      </Text>
    </View>
  );
}
