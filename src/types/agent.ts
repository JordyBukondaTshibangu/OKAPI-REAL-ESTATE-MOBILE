export type AgentType = "COMMISSIONNAIRE" | "AGENT" | "AGENCY_OWNER" | "OTHER";
export type RentalFocus = "LONG_TERM" | "SHORT_TERM" | "BOTH";
export type AgentVerificationTier = "NON_VERIFIE" | "VERIFIE";

// Legacy title type kept for backward-compatibility with old API responses
export type AgentTitle = "SUPERAGENT" | "AGENT EXCLUSIF" | "AGENT";

export type AreaOfExpertise = {
  name: string;
  description: string;
  rating: number;
  ratings: number;
  forSale: number;
  forRent: number;
  closedDeals: number;
};

export type TrackRecordRow = {
  location: string;
  building: string;
  dealType: "Vente" | "Location";
  date: string;
  propertyType: string;
  bedrooms: string;
};

export type Agent = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  whatsappNumber?: string;
  // New profile fields
  agentType?: AgentType;
  communes?: string[];
  propertyTypes?: string[];
  rentalFocus?: RentalFocus;
  yearsExperienceLabel?: string;
  // Legacy fields (may still come from API)
  title?: AgentTitle;
  specialization?: string;
  nationality?: string;
  languages?: string[];
  yearsExperience?: number;
  experienceSince?: number;
  rating?: number;
  ratingsCount?: number;
  responseMinutes?: number;
  brokerLicense?: string;
  photoGradient?: string;
  agencyMonogram?: string;
  agencyAccent?: string;
  // Relations & counts
  agency?: string;
  forSaleCount?: number;
  forRentCount?: number;
  closedDeals?: number;
  totalDealsValueUsd?: number;
  bio?: string;
  photo?: string;
  areasOfExpertise?: AreaOfExpertise[];
  trackRecord?: TrackRecordRow[];
  // Verification
  verificationTier?: AgentVerificationTier;
  emailVerified?: boolean;
  plan?: string;
  isSuspended?: boolean;
  graceEndsAt?: string;
  createdAt?: string;
};
