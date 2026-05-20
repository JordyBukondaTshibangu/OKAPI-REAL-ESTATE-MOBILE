import React from "react";
import { View, type ViewProps } from "react-native";

interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = "", style, ...props }: CardProps) {
  return (
    <View
      {...props}
      style={[{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 }, style]}
      className={`bg-white rounded-2xl border border-border ${className}`}
    >
      {children}
    </View>
  );
}
