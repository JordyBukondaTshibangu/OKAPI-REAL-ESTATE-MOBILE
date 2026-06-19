import React from "react";
import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyReviews, deleteReview } from "../../../src/services/auth";
import { useAuthStore } from "../../../src/store/useAuthStore";
import { useThemeStore } from "../../../src/store/useThemeStore";
import { useAuthGuard } from "../../../src/hooks/useAuthGuard";
import { useT } from "../../../src/i18n/useT";
import Loader from "../../../src/components/ui/Loader";
import EmptyState from "../../../src/components/ui/EmptyState";
import StarRating from "../../../src/components/ui/StarRating";
import { Colors } from "../../../src/constants/colors";
import { Star, Trash2 } from "lucide-react-native";

export default function AvisScreen() {
  const t = useT();
  const isAuth = useAuthGuard();
  const { token } = useAuthStore();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const queryClient = useQueryClient();

  const pageBg  = isDark ? Colors.dark.background : Colors.backgroundAlt;
  const cardBg  = isDark ? Colors.dark.card : Colors.white;
  const borderC = isDark ? Colors.dark.border : Colors.border;
  const textMain= isDark ? Colors.dark.foreground : Colors.textDark;
  const textMut = isDark ? Colors.dark.mutedFg : Colors.mutedFg;

  const { data, isLoading } = useQuery({
    queryKey: ["reviews"],
    queryFn: () => getMyReviews(token!),
    enabled: !!token,
  });

  async function handleDelete(id: string) {
    Alert.alert(t.reviews.deleteTitle, t.reviews.deleteMsg, [
      { text: t.common.cancel, style: "cancel" },
      {
        text: t.common.delete, style: "destructive",
        onPress: async () => {
          try {
            await deleteReview(token!, id);
            queryClient.invalidateQueries({ queryKey: ["reviews"] });
          } catch { Alert.alert(t.common.error, t.reviews.deleteError); }
        }
      },
    ]);
  }

  if (!isAuth) return null;
  if (isLoading) return <Loader />;

  const reviews = data ?? [];

  if (reviews.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: pageBg }}>
        <EmptyState
          title={t.user.noReviews}
          subtitle={t.reviews.noReviewsDesc}
          icon={Star}
        />
      </View>
    );
  }

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "0";

  return (
    <FlatList
      data={reviews}
      keyExtractor={r => r.id}
      style={{ backgroundColor: pageBg }}
      contentContainerStyle={{ padding: 16 }}
      ListHeaderComponent={
        <View style={{ backgroundColor: cardBg, borderColor: borderC, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 16, alignItems: "center" }}>
          <Text style={{ color: textMain, fontSize: 32, fontFamily: "DMSans_700Bold" }}>{avg}</Text>
          <StarRating rating={Number(avg)} size={18} />
          <Text style={{ color: textMut, fontSize: 12, marginTop: 4 }}>{reviews.length} {t.reviews.reviewsCount}</Text>
        </View>
      }
      renderItem={({ item }) => {
        const title = item.property?.title
          ?? (item.agent ? `${item.agent.firstName} ${item.agent.lastName}` : t.reviews.reviewFallback);

        return (
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
              shadowRadius: 3,
              elevation: 1,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ color: textMain, fontFamily: "DMSans_600SemiBold" }} numberOfLines={1}>
                  {title}
                </Text>
                <Text style={{ color: textMut, fontSize: 12, marginTop: 2 }}>{new Date(item.createdAt).toLocaleDateString("fr-FR")}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Trash2 size={16} color={isDark ? Colors.dark.destructive : Colors.destructive} />
              </TouchableOpacity>
            </View>
            <StarRating rating={item.rating} size={14} />
            {item.comment && <Text style={{ color: textMut, fontSize: 13, marginTop: 8 }}>{item.comment}</Text>}
          </View>
        );
      }}
    />
  );
}
