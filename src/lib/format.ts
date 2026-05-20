export function formatPrice(price: number, currency: string, period: string | null): string {
  const formatted = price.toLocaleString("fr-FR");
  const curr = currency === "USD" ? "$" : currency;
  const per = period === "monthly" ? "/mois" : period === "yearly" ? "/an" : "";
  return `${formatted} ${curr}${per}`;
}

export function formatListedAgo(days: number): string {
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days} jours`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `Il y a ${weeks} semaine${weeks > 1 ? "s" : ""}`;
  }
  const months = Math.floor(days / 30);
  return `Il y a ${months} mois`;
}

export function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    apartment: "Appartement",
    villa: "Villa",
    townhouse: "Maison de ville",
    studio: "Studio",
    duplex: "Duplex",
    penthouse: "Penthouse",
    land: "Terrain",
    office: "Bureau",
    warehouse: "Entrepôt",
    retail: "Local commercial",
  };
  return labels[category] ?? category;
}
