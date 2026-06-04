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
      className={`bg-card dark:bg-dark-card rounded-2xl border border-border dark:border-dark-border ${className}`}
    >
      {children}
    </View>
  );
}
