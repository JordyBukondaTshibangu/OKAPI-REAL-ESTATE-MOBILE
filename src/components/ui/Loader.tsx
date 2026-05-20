import React from "react";
import { View, ActivityIndicator } from "react-native";
import { Colors } from "../../constants/colors";

export default function Loader() {
  return (
    <View className="flex-1 items-center justify-center py-12">
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}
