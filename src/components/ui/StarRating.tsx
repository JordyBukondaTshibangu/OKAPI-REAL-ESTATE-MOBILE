import React from "react";
import { View } from "react-native";
import { Star } from "lucide-react-native";
import { Colors } from "../../constants/colors";

interface StarRatingProps {
  rating: number;
  size?: number;
}

export default function StarRating({ rating, size = 14 }: StarRatingProps) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          color={i <= Math.round(rating) ? Colors.secondary : Colors.border}
          fill={i <= Math.round(rating) ? Colors.secondary : "transparent"}
        />
      ))}
    </View>
  );
}
