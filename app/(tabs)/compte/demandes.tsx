import React from "react";
import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getEnquiries, deleteEnquiry } from "../../../src/services/auth";
import { useAuthStore } from "../../../src/store/useAuthStore";
import { useThemeStore } from "../../../src/store/useThemeStore";
import { useLocaleStore } from "../../../src/store/useLocaleStore";
import { useAuthGuard } from "../../../src/hooks/useAuthGuard";
import { useT } from "../../../src/i18n/useT";
import Loader from "../../../src/components/ui/Loader";
import EmptyState from "../../../src/components/ui/EmptyState";
import Badge from "../../../src/components/ui/Badge";
import { Colors } from "../../../src/constants/colors";
import { MessageSquare, Trash2 } from "lucide-react-native";

const STATUS_VARIANT: Record<string, "primary" | "secondary" | "muted" | "gold"> = {
  pending: "primary",
  replied: "gold",
  closed: "muted",
};

export default function DemandesScreen() {
  const t = useT();
  const isAuth = useAuthGuard();
  const { token } = useAuthStore();
  const { theme } = useThemeStore();
  const { locale } = useLocaleStore();
  const dateLocale = locale === "en" ? "en-GB" : "fr-FR";
  const isDark = theme === "dark";
  const queryClient = useQueryClient();

  const STATUS_LABEL: Record<string, string> = {
    pending: t.enquiries.statusPending,
    replied: t.enquiries.statusReplied,
    closed: t.enquiries.statusClosed,
  };

  const pageBg  = isDark ? Colors.dark.background : Colors.backgroundAlt;
  const cardBg  = isDark ? Colors.dark.card : Colors.white;
  const borderC = isDark ? Colors.dark.border : Colors.border;
  const textMain= isDark ? Colors.dark.foreground : Colors.textDark;
  const textMut = isDark ? Colors.dark.mutedFg : Colors.mutedFg;

  const { data, isLoading } = useQuery({
    queryKey: ["enquiries"],
    queryFn: () => getEnquiries(token!),
    enabled: !!token,
  });

  async function handleDelete(id: string) {
    Alert.alert(t.enquiries.deleteTitle, t.enquiries.deleteMsg, [
      { text: t.common.cancel, style: "cancel" },
      { text: t.common.delete, style: "destructive", onPress: async () => {
        try {
          await deleteEnquiry(token!, id);
          queryClient.invalidateQueries({ queryKey: ["enquiries"] });
        } catch {
          Alert.alert(t.common.error, t.enquiries.deleteError);
        }
      }},
    ]);
  }

  if (!isAuth) return null;
  if (isLoading) return <Loader />;

  const enquiries = data ?? [];

  if (enquiries.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: pageBg }}>
        <EmptyState title={t.user.noEnquiries} subtitle={t.enquiries.noEnquiriesDesc} icon={MessageSquare} />
      </View>
    );
  }

  return (
    <FlatList
      data={enquiries}
      keyExtractor={e => e.id}
      style={{ backgroundColor: pageBg }}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <View
          style={{
            backgroundColor: cardBg,
            borderColor: borderC,
            borderWidth: 1,
            borderRadius: 16,
            marginBottom: 12,
            padding: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: isDark ? 0.2 : 0.05,
            shadowRadius: 4,
            elevation: 1,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ color: textMain, fontFamily: "DMSans_600SemiBold", fontSize: 14 }} numberOfLines={1}>
                {item.property?.title ?? t.enquiries.propertyFallback}
              </Text>
              <Text style={{ color: textMut, fontSize: 12, marginTop: 2 }}>
                {new Date(item.createdAt).toLocaleDateString(dateLocale)}
              </Text>
            </View>
            <Badge label={STATUS_LABEL[item.status]} variant={STATUS_VARIANT[item.status]} />
          </View>
          <Text style={{ color: textMut, fontSize: 14, lineHeight: 20 }} numberOfLines={2}>
            {item.message}
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 12 }}>
            <TouchableOpacity
              onPress={() => handleDelete(item.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Trash2 size={16} color={isDark ? Colors.dark.destructive : Colors.destructive} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}
