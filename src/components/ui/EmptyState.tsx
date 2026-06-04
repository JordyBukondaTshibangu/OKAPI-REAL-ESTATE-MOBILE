import React from "react";
import { View, Text } from "react-native";
import { Inbox } from "lucide-react-native";
import { Colors } from "../../constants/colors";
import Button from "./Button";

type IconComponent = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  icon?: IconComponent;
  action?: { label: string; onPress: () => void };
}

export default function EmptyState({ title, subtitle, icon, action }: EmptyStateProps) {
  const Icon = icon ?? Inbox;

  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      {/* Soft layered icon badge */}
      <View
        className="items-center justify-center mb-5"
        style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.accent }}
      >
        <View
          className="items-center justify-center"
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: Colors.white,
            shadowColor: Colors.navy,
            shadowOpacity: 0.08,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 3,
          }}
        >
          <Icon size={28} color={Colors.primary} strokeWidth={1.75} />
        </View>
      </View>

      <Text className="text-foreground dark:text-dark-foreground text-lg font-sans-bold text-center mb-1.5">{title}</Text>
      {subtitle && (
        <Text className="text-muted-fg dark:text-dark-muted-fg text-sm text-center" style={{ lineHeight: 20, maxWidth: 280 }}>
          {subtitle}
        </Text>
      )}
      {action && (
        <View className="mt-6">
          <Button onPress={action.onPress}>{action.label}</Button>
        </View>
      )}
    </View>
  );
}
