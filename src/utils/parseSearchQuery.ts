/**
 * Lightweight French natural-language parser for real estate search queries.
 * Extracts structured intent (category, listing type, bedrooms, suburb) from
 * free text such as "Villa a louer a la gombe" or "2 chambres salon a louer".
 *
 * Pure TypeScript — no browser or Node.js dependencies; works in React Native.
 */

// ─── Kinshasa communes ────────────────────────────────────────────────────────

const COMMUNES: { key: string; display: string }[] = [
  { key: "barumbu", display: "Barumbu" },
  { key: "bumbu", display: "Bumbu" },
  { key: "gombe", display: "Gombe" },
  { key: "kalamu", display: "Kalamu" },
  { key: "kasavubu", display: "Kasa-Vubu" },
  { key: "kimbanseke", display: "Kimbanseke" },
  { key: "kinshasa", display: "Kinshasa" },
  { key: "kintambo", display: "Kintambo" },
  { key: "kisenso", display: "Kisenso" },
  { key: "lemba", display: "Lemba" },
  { key: "limete", display: "Limete" },
  { key: "lingwala", display: "Lingwala" },
  { key: "makala", display: "Makala" },
  { key: "maluku", display: "Maluku" },
  { key: "masina", display: "Masina" },
  { key: "matete", display: "Matete" },
  { key: "montngafula", display: "Mont-Ngafula" },
  { key: "ndjili", display: "Ndjili" },
  { key: "ngaba", display: "Ngaba" },
  { key: "ngaliema", display: "Ngaliema" },
  { key: "ngirngiri", display: "Ngiri-Ngiri" },
  { key: "nsele", display: "Nsele" },
  { key: "selembao", display: "Selembao" },
  { key: "bandalungwa", display: "Bandalungwa" },
];

// ─── Property category keywords ───────────────────────────────────────────────

const CATEGORY_KEYWORDS: { patterns: string[]; category: string }[] = [
  { patterns: ["villa", "villas"], category: "villa" },
  { patterns: ["appartement", "appartements", "appart", "apparts", "apt"], category: "apartment" },
  { patterns: ["studio", "studios"], category: "studio" },
  { patterns: ["maison de ville", "maisons de ville", "townhouse"], category: "townhouse" },
  { patterns: ["duplex"], category: "duplex" },
  { patterns: ["penthouse", "penthouses"], category: "penthouse" },
  { patterns: ["terrain", "terrains", "parcelle", "parcelles"], category: "land" },
  { patterns: ["bureau", "bureaux", "office"], category: "office" },
  { patterns: ["entrepot", "entrepots", "warehouse"], category: "warehouse" },
  { patterns: ["commerce", "local commercial", "shop", "boutique"], category: "shop" },
];

// ─── Listing-type detection ───────────────────────────────────────────────────

const RENT_PATTERNS = [/\ba?\s*louer\b/, /\blocation\b/, /\bloue\b/, /\blouer\b/];
const SALE_PATTERNS = [/\ba?\s*vendre\b/, /\bvente\b/, /\bacheter\b/, /\bachat\b/];

// ─── Structural noise words ───────────────────────────────────────────────────

const STRUCTURAL_WORDS = new Set([
  "a", "au", "aux", "la", "le", "les", "de", "du", "des",
  "en", "et", "ou", "un", "une", "pour", "sur",
  "louer", "location", "loue", "acheter", "achat", "vente", "vendre",
  "chambre", "chambres", "ch", "piece", "pieces", "salon",
]);

// ─── Types ────────────────────────────────────────────────────────────────────

export type ParsedQuery = {
  category?: string;
  listingType?: "rent" | "sale";
  beds?: number;
  suburb?: string;
  /** Meaningful words left after stripping structural tokens. Use as text search. */
  cleanQ?: string;
};

// ─── Main parser ──────────────────────────────────────────────────────────────

export function parseSearchQuery(raw: string): ParsedQuery {
  if (!raw || !raw.trim()) return {};

  const result: ParsedQuery = {};

  // Normalise: lowercase, strip accents, collapse whitespace
  const normalised = raw
    .toLowerCase()
    .replace(/[àâä]/g, "a")
    .replace(/[éèêë]/g, "e")
    .replace(/[îï]/g, "i")
    .replace(/[ôö]/g, "o")
    .replace(/[ùûü]/g, "u")
    .replace(/ç/g, "c")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // ── 1. Listing type ──────────────────────────────────────────────────────
  if (RENT_PATTERNS.some((re) => re.test(normalised))) {
    result.listingType = "rent";
  } else if (SALE_PATTERNS.some((re) => re.test(normalised))) {
    result.listingType = "sale";
  }

  // ── 2. Bedrooms ──────────────────────────────────────────────────────────
  const bedsMatch = normalised.match(/(\d+)\s*(?:chambres?|ch\.?|pieces?)/);
  if (bedsMatch) {
    const n = parseInt(bedsMatch[1], 10);
    if (n >= 1 && n <= 20) result.beds = n;
  }

  // ── 3. Category ──────────────────────────────────────────────────────────
  for (const { patterns, category } of CATEGORY_KEYWORDS) {
    if (patterns.some((p) => new RegExp(`\\b${p}\\b`).test(normalised))) {
      result.category = category;
      break;
    }
  }

  // ── 4. Commune ───────────────────────────────────────────────────────────
  const compacted = normalised.replace(/[-\s]+/g, "");
  for (const { key, display } of COMMUNES) {
    if (compacted.includes(key)) {
      result.suburb = display;
      break;
    }
  }

  // ── 5. Clean remaining query ─────────────────────────────────────────────
  const words = normalised.split(/\s+/);
  const skipWords = new Set<string>(STRUCTURAL_WORDS);
  // Also remove category keywords from cleanQ
  if (result.category) {
    CATEGORY_KEYWORDS.find((c) => c.category === result.category)?.patterns.forEach((p) =>
      p.split(/\s+/).forEach((t) => skipWords.add(t)),
    );
  }
  // Remove suburb from cleanQ
  if (result.suburb) {
    skipWords.add(result.suburb.toLowerCase().replace(/[-\s]/g, ""));
  }
  const cleanTokens = words.filter(
    (w) => w.length > 2 && !skipWords.has(w) && !/^\d+$/.test(w),
  );
  result.cleanQ = cleanTokens.length > 0 ? cleanTokens.join(" ") : undefined;

  return result;
}
