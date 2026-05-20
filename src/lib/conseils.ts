export type ConseilPost = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  readTime: string;
  content: string;
};

export const conseilsPosts: ConseilPost[] = [
  {
    slug: "guide-acheteur",
    category: "Achat",
    title: "Guide de l'acheteur immobilier à Kinshasa",
    excerpt: "Tout ce que vous devez savoir pour acheter un bien immobilier en toute sécurité à Kinshasa.",
    readTime: "10 min",
    content: `
<h2>Étape 1 : Définir votre budget</h2>
<p>Avant de commencer vos recherches, établissez un budget réaliste en tenant compte du prix d'achat, des frais de notaire (5-8%), des frais d'agence (2-5%) et des éventuels travaux.</p>

<h2>Étape 2 : Choisir le bon quartier</h2>
<p>Gombe pour les affaires, Ngaliema pour le résidentiel de standing, Limete pour les budgets intermédiaires. Chaque commune a ses avantages selon vos besoins.</p>

<h2>Étape 3 : Vérifier le titre foncier</h2>
<p>Ne signez jamais sans vérifier l'authenticité du titre foncier auprès du cadastre. Mandatez un notaire pour cette vérification essentielle.</p>

<h2>Étape 4 : Négocier et finaliser</h2>
<p>Les vendeurs incluent souvent une marge de 10-15%. L'acte de vente doit être notarié et enregistré. Passez par un agent Okapi certifié pour un accompagnement complet.</p>
    `.trim(),
  },
  {
    slug: "guide-vendeur",
    category: "Vente",
    title: "Guide du vendeur : comment vendre au meilleur prix",
    excerpt: "Stratégies et conseils pratiques pour vendre votre bien immobilier rapidement et au meilleur prix à Kinshasa.",
    readTime: "8 min",
    content: `
<h2>Estimer la valeur de votre bien</h2>
<p>Une estimation réaliste est la clé d'une vente rapide. Faites appel à un agent Okapi pour une estimation gratuite basée sur les transactions récentes dans votre commune.</p>

<h2>Préparer votre bien</h2>
<p>Un bien propre, rangé et bien éclairé se vend plus vite et plus cher. Investissez dans de petites rénovations à fort impact : peinture fraîche, jardinage, petites réparations visibles.</p>

<h2>Choisir le bon prix</h2>
<p>Un bien surévalué reste sur le marché et finit par se vendre moins cher. Partez du prix du marché et ajoutez une marge de négociation de 5-8% maximum.</p>

<h2>Constituer un dossier complet</h2>
<p>Réunissez le titre foncier original, les quittances de loyer si applicable, et les attestations de paiement des taxes foncières. Un dossier complet rassure les acheteurs et accélère la transaction.</p>
    `.trim(),
  },
  {
    slug: "guide-locataire",
    category: "Location",
    title: "Guide du locataire : louer en toute sécurité",
    excerpt: "Comment trouver et sécuriser la location de votre logement à Kinshasa sans mauvaises surprises.",
    readTime: "7 min",
    content: `
<h2>Définir vos critères</h2>
<p>Surface, localisation, budget, proximité des écoles et du lieu de travail — listez vos priorités avant de commencer vos recherches pour ne pas perdre de temps.</p>

<h2>Vérifier le bailleur et le bien</h2>
<p>Assurez-vous que le bailleur est bien le propriétaire légal du bien. Demandez à voir le titre foncier ou un mandat de gestion signé par le propriétaire si vous passez par une agence.</p>

<h2>Lire attentivement le bail</h2>
<p>Vérifiez la durée, le loyer, les charges incluses, les conditions de résiliation et le dépôt de garantie. Un bail standard dure 1 an renouvelable. Le dépôt de garantie ne peut excéder 2 mois de loyer.</p>

<h2>Documenter l'état des lieux</h2>
<p>Faites un état des lieux écrit et photographié à l'entrée et à la sortie. Ce document vous protège en cas de litige sur le dépôt de garantie.</p>
    `.trim(),
  },
  {
    slug: "investissement-immobilier",
    category: "Investissement",
    title: "Investir dans l'immobilier à Kinshasa : le guide complet",
    excerpt: "Stratégies d'investissement, rendements attendus et communes les plus attractives pour les investisseurs.",
    readTime: "12 min",
    content: `
<h2>Pourquoi investir à Kinshasa ?</h2>
<p>Avec des rendements locatifs de 7 à 14% selon le type de bien et la commune, Kinshasa offre des opportunités rares sur le continent africain. La dollarisation du marché protège votre capital contre la dévaluation.</p>

<h2>Les types d'investissement</h2>
<p>Résidentiel locatif, commercial, bureaux, entrepôts logistiques — chaque segment a ses caractéristiques. Les studios et appartements pour jeunes professionnels offrent les meilleurs rendements bruts (10-14%).</p>

<h2>Financer votre investissement</h2>
<p>Rawbank, Equity Bank et TMB proposent des crédits immobiliers à 12-18% sur 10-15 ans avec 20-30% d'apport. Les tontines immobilières sont une alternative pour ceux qui n'ont pas accès au crédit bancaire.</p>

<h2>Gérer votre bien</h2>
<p>Déléguer la gestion locative à une agence professionnelle (8-10% des loyers) vous évite les impayés et les litiges. Okapi Real Estate propose des services de gestion locative complets.</p>
    `.trim(),
  },
];

export function getConseilBySlug(slug: string): ConseilPost | undefined {
  return conseilsPosts.find(c => c.slug === slug);
}
