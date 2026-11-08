// Listes de choix communes (doivent correspondre aux contraintes du schéma SQL)
export const TYPES_TRAVAIL = [
  'Impression numérique', 'Impression offset', 'Grand format / Bâche', 'Floquage textile',
  'Sérigraphie', 'Broderie', 'Gravure / Découpe', 'Signalétique', 'Infographie / PAO', 'Autre',
];
export const STATUTS_COMMANDE = ['En attente', 'En production', 'Terminée', 'Livrée', 'Annulée'];
export const STATUTS_FACTURE = ['Impayée', 'Partiellement payée', 'Payée', 'Annulée'];
export const MODES_PAIEMENT = ['Espèces', 'Airtel Money', 'Moov Money', 'Virement', 'Chèque', 'Carte bancaire'];
export const STATUTS_PRODUCTION = ['À faire', 'En cours', 'En pause', 'Terminée'];
export const PRIORITES = ['Basse', 'Normale', 'Haute', 'Urgente'];
export const STATUTS_MAQUETTE = ['Brouillon', 'Envoyée au client', 'Validée', 'À corriger', 'Rejetée'];
export const TYPES_MOUVEMENT = ['Entrée', 'Sortie', 'Ajustement'];
export const CATEGORIES_ARTICLE = [
  'Papier', 'Encre / Toner', 'Textile', 'Film / Flex de floquage', 'Bâche / Vinyle', 'Support rigide', 'Consommable', 'Autre',
];
export const UNITES = ['unité', 'rame', 'feuille', 'mètre', 'm²', 'rouleau', 'litre', 'cartouche', 'carton', 'pièce'];
