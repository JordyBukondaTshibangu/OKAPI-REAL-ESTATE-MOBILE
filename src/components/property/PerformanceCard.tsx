import React from "react";
import { View, Text } from "react-native";
import { Eye, Share2, Heart } from "lucide-react-native";
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
  const primary   = isDark ? Colors.dark.primary : Colors.primary;

  const score = demandScore(performance);
  const demand =
    score >= 75
      ? { label: t.property.demandHigh,   ratio: 1,                          color: "#16A34A" }
      : score >= 25
      ? { label: t.property.demandMedium, ratio: Math.min(score / 100, 0.66), color: "#F59E0B" }
      : { label: t.property.demandLow,    ratio: Math.max(score / 100, 0.04), color: "#DC2626" };

  const stats = [
    { icon: Eye,    value: performance.viewed, label: t.property.views,  color: primary },
    { icon: Share2, value: performance.shared, label: t.property.shares, color: "#0E9BB5" },
    { icon: Heart,  value: performance.saved,  label: t.property.saved,  color: "#E8336E" },
  ];

  return (
    <View style={{ backgroundColor: cardBg, paddingHorizontal: 20, paddingVertical: 14, marginBottom: 8 }}>
      {/* Compact stats row */}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: borderC,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 0,
      }}>
        {stats.map(({ icon: Icon, value, label, color }, i) => (
          <React.Fragment key={label}>
            {i > 0 && (
              <View style={{ width: 1, height: 28, backgroundColor: borderC, marginHorizontal: 16 }} />
            )}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Icon size={14} color={color} />
              <Text style={{ color: textMain, fontFamily: "DMSans_600SemiBold", fontSize: 14 }}>{value}</Text>
              <Text style={{ color: textMuted, fontSize: 12 }}>{label}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      {/* Demand bar */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, marginBottom: 6 }}>
        <Text style={{ color: textMuted, fontSize: 13 }}>{t.property.demandLevel}</Text>
        <Text style={{ color: demand.color, fontFamily: "DMSans_600SemiBold", fontSize: 13 }}>{demand.label}</Text>
      </View>
      <View style={{ height: 5, borderRadius: 3, backgroundColor: trackBg, overflow: "hidden" }}>
        <View style={{ height: 5, borderRadius: 3, width: `${Math.round(demand.ratio * 100)}%`, backgroundColor: demand.color }} />
      </View>
    </View>
  );
}
