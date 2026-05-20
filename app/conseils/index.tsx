import React from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { conseilsPosts } from "../../src/lib/conseils";
import { Colors } from "../../src/constants/colors";
import { ArrowRight, Clock } from "lucide-react-native";

export default function ConseilsListScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.backgroundAlt }} edges={["top"]}>
      <View className="px-5 py-4 bg-white border-b border-border">
        <Text className="text-text-dark text-xl font-sans-bold">Guides & Conseils</Text>
        <Text className="text-muted-fg text-xs mt-0.5">Nos guides pour réussir votre projet immobilier</Text>
      </View>
      <FlatList
        data={conseilsPosts}
        keyExtractor={c => c.slug}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/conseils/${item.slug}` as any)}
            className="bg-white border border-border rounded-2xl p-4 mb-3 flex-row items-center gap-4"
            style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 }}
          >
            <View className="flex-1">
              <View className="bg-accent rounded-full px-2.5 py-0.5 self-start mb-2">
                <Text className="text-primary text-xs font-sans-medium">{item.category}</Text>
              </View>
              <Text className="text-text-dark font-sans-semibold mb-1" numberOfLines={2}>{item.title}</Text>
              <Text className="text-muted-fg text-sm" numberOfLines={1}>{item.excerpt}</Text>
              <View className="flex-row items-center gap-1 mt-1.5">
                <Clock size={11} color={Colors.mutedFg} />
                <Text className="text-muted-fg text-xs">{item.readTime}</Text>
              </View>
            </View>
            <ArrowRight size={18} color={Colors.mutedFg} />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
