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
  title: AgentTitle;
  specialization: string;
  nationality: string;
  languages: string[];
  yearsExperience: number;
  experienceSince: number;
  rating: number;
  ratingsCount: number;
  responseMinutes: number;
  agency: string;
  agencyMonogram: string;
  agencyAccent: string;
  brokerLicense: string;
  forSaleCount: number;
  forRentCount: number;
  closedDeals: number;
  totalDealsValueUsd: number;
  phone?: string;
  bio: string;
  photo: string;
  photoGradient: string;
  areasOfExpertise: AreaOfExpertise[];
  trackRecord: TrackRecordRow[];
};
