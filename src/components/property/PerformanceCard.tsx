import React from "react";
import { View, Text } from "react-native";
import { Eye, Share2, Heart, TrendingUp } from "lucide-react-native";
import { Colors } from "../../constants/colors";
import type { PropertyPerformance } from "../../types/property";
import { useT } from "../../i18n/useT";

type Props = {
  performance: PropertyPerformance;
  isDark: boolean;
};

/** viewed counts 1, shared 4, saved 6 — engagement weighs more than raw views */
function demandScore({ viewed, shared, saved }: PropertyPerformance) {
  return viewed + shared * 4 + saved * 6;
}

export default function PerformanceCard({ performance, isDark }: Props) {
  const t = useT();
  const cardBg    = isDark ? Colors.dark.card : Colors.white;
  const borderC   = isDark ? Colors.dark.border : Colors.border;
  const textMain  = isDark ? Colors.dark.foreground : Colors.textDark;
  const textMuted = isDark ? Colors.dark.mutedFg : Colors.mutedFg;
  const trackBg   = isDark ? Colors.dark.muted : Colors.backgroundAlt;

  const score = demandScore(performance);
  const demand =
    score >= 75
      ? { label: t.property.demandHigh,   ratio: 1,                          color: "#16A34A" }
      : score >= 25
      ? { label: t.property.demandMedium, ratio: Math.min(score / 100, 0.66), color: "#F59E0B" }
      : { label: t.property.demandLow,    ratio: Math.max(score / 100, 0.04), color: "#DC2626" };

  const stats = [
    { icon: Eye,    value: performance.viewed, label: t.property.views,  tint: isDark ? Colors.dark.primary : Colors.primary, bg: isDark ? Colors.dark.accent : Colors.accent },
    { icon: Share2, value: performance.shared, label: t.property.shares, tint: "#0E9BB5", bg: isDark ? "#11343F" : "#E0F5FA" },
    { icon: Heart,  value: performance.saved,  label: t.property.saved,  tint: "#E8336E", bg: isDark ? "#3F1828" : "#FDE8EF" },
  ];

  return (
    <View style={{ backgroundColor: cardBg, paddingHorizontal: 20, paddingVertical: 16, marginBottom: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <TrendingUp size={18} color={isDark ? Colors.dark.primary : Colors.primary} />
        <Text style={{ color: textMain, fontFamily: "DMSans_700Bold", fontSize: 16 }}>
          {t.property.popularityTitle}
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        {stats.map(({ icon: Icon, value, label: statLabel, tint, bg }) => (
          <View
            key={statLabel}
            style={{
              flexDirection: "row", alignItems: "center", gap: 14,
              borderWidth: 1, borderColor: borderC, borderRadius: 16,
              paddingHorizontal: 16, paddingVertical: 14,
            }}
          >
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
              <Icon size={20} color={tint} />
            </View>
            <View>
              <Text style={{ color: textMain, fontFamily: "DMSans_700Bold", fontSize: 20 }}>{value}</Text>
              <Text style={{ color: textMuted, fontSize: 13 }}>{statLabel}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16, marginBottom: 8 }}>
        <Text style={{ color: textMuted, fontSize: 14 }}>{t.property.demandLevel}</Text>
        <Text style={{ color: textMain, fontFamily: "DMSans_700Bold", fontSize: 14 }}>{demand.label}</Text>
      </View>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: trackBg, overflow: "hidden" }}>
        <View style={{ height: 6, borderRadius: 3, width: `${Math.round(demand.ratio * 100)}%`, backgroundColor: demand.color }} />
      </View>
    </View>
  );
}
