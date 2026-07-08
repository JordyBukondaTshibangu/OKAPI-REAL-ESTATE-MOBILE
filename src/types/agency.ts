export type RentalFocus = "LONG_TERM" | "SHORT_TERM" | "BOTH";

export type Agency = {
  id: string;
  name: string;
  monogram?: string | null;
  accentClass?: string | null;
  tagline?: string | null;
  description?: string | null;
  address?: string | null;
  phone: string;
  email: string;
  website?: string | null;
  whatsapp?: string | null;
  logoUrl?: string | null;
  founded?: number | null;
  agentCount?: number;
  listingCount?: number;
  closedDeals?: number;
  // DRC fields
  communes?: string[];
  propertyTypes?: string[];
  rentalFocus?: RentalFocus | null;
  rccmNumber?: string | null;
  languages?: string[];
  specializations?: string[];
  areasServed?: string[];
  certifications?: string[];
  verificationStatus?: string | null;
  approvedAt?: string | null;
  createdAt?: string;
};
