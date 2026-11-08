// Définition des ressources accessibles via l'API générique /api/r/[resource]
// (les utilisateurs ont leurs propres routes, réservées au superadmin)
import 'server-only';

type Ligne = { designation: string; quantite: number; prix_unitaire: number };

export type ResourceDef = {
  table: string;
  select: string;                 // colonnes + jointures Supabase
  search: string[];               // colonnes texte pour la recherche
  filters?: string[];             // filtres exacts autorisés en query (?statut=...)
  fields: string[];               // champs modifiables
  required?: Record<string, string>;
  order?: { column: string; ascending: boolean };
  noUpdate?: boolean;
  prepare?: (data: any) => any;   // calculs avant enregistrement
};

const num = (v: any) => {
  const n = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};
const r2 = (n: number) => Math.round(n * 100) / 100;

export function nettoyerLignes(lignes: any): Ligne[] {
  if (!Array.isArray(lignes)) return [];
  return lignes
    .map((l) => ({
      designation: String(l?.designation ?? '').trim(),
      quantite: num(l?.quantite),
      prix_unitaire: num(l?.prix_unitaire),
    }))
    .filter((l) => l.designation !== '');
}

export const totalLignes = (lignes: Ligne[]) =>
  r2(lignes.reduce((s, l) => s + l.quantite * l.prix_unitaire, 0));

export function calculerFacture(data: any) {
  const lignes = nettoyerLignes(data.lignes);
  const brut = totalLignes(lignes);
  const remise = Math.min(num(data.remise), brut);
  const ht = r2(brut - remise);
  const tva = r2((ht * num(data.taux_tva)) / 100);
  const ttc = r2(ht + tva);
  const paye = r2(num(data.montant_paye));
  let statut = data.statut;
  if (statut !== 'Annulée') {
    statut = paye <= 0 ? 'Impayée' : paye >= ttc ? 'Payée' : 'Partiellement payée';
  }
  return {
    ...data,
    lignes,
    remise,
    taux_tva: num(data.taux_tva),
    montant_ht: ht,
    montant_tva: tva,
    montant_ttc: ttc,
    montant_paye: paye,
    statut,
  };
}

export const RESOURCES: Record<string, ResourceDef> = {
  clients: {
    table: 'clients',
    select: '*',
    search: ['nom', 'prenom', 'telephone', 'email', 'adresse'],
    fields: ['nom', 'prenom', 'telephone', 'email', 'adresse', 'observations'],
    required: { nom: 'Le nom est obligatoire.', telephone: 'Le téléphone est obligatoire.' },
    order: { column: 'id', ascending: true },
  },

  commandes: {
    table: 'commandes',
    select: '*, client:clients(id, nom, prenom, telephone)',
    search: ['numero', 'type_travail', 'notes'],
    filters: ['statut', 'client_id'],
    fields: ['client_id', 'date_commande', 'date_livraison', 'type_travail', 'statut', 'lignes', 'avance', 'notes'],
    required: { client_id: 'Choisissez un client.' },
    order: { column: 'id', ascending: false },
    prepare: (d) => {
      const lignes = nettoyerLignes(d.lignes);
      return { ...d, lignes, montant_total: totalLignes(lignes), avance: r2(num(d.avance)) };
    },
  },

  factures: {
    table: 'factures',
    select: '*, client:clients(id, nom, prenom, telephone, email, adresse), commande:commandes(id, numero)',
    search: ['numero', 'notes', 'mode_paiement'],
    filters: ['statut', 'client_id'],
    fields: ['client_id', 'commande_id', 'date_facture', 'date_echeance', 'lignes', 'remise', 'taux_tva',
      'montant_paye', 'statut', 'mode_paiement', 'notes'],
    required: { client_id: 'Choisissez un client.' },
    order: { column: 'id', ascending: false },
    prepare: calculerFacture,
  },

  articles: {
    table: 'articles',
    select: '*',
    search: ['reference', 'designation', 'categorie', 'fournisseur', 'emplacement'],
    filters: ['categorie'],
    fields: ['reference', 'designation', 'categorie', 'unite', 'seuil_alerte', 'prix_achat', 'fournisseur', 'emplacement'],
    required: { designation: 'La désignation est obligatoire.' },
    order: { column: 'designation', ascending: true },
    prepare: (d) => ({ ...d, seuil_alerte: num(d.seuil_alerte), prix_achat: num(d.prix_achat) }),
  },

  mouvements: {
    table: 'mouvements_stock',
    select: '*, article:articles(id, reference, designation, unite), commande:commandes(id, numero)',
    search: ['motif', 'utilisateur'],
    filters: ['article_id', 'type'],
    fields: ['article_id', 'type', 'quantite', 'motif', 'commande_id', 'date_mouvement'],
    required: { article_id: 'Choisissez un article.', type: 'Choisissez le type de mouvement.' },
    order: { column: 'date_mouvement', ascending: false },
    noUpdate: true,
    prepare: (d) => ({ ...d, quantite: Math.abs(num(d.quantite)) }),
  },

  productions: {
    table: 'productions',
    select: '*, commande:commandes(id, numero, client:clients(nom, prenom))',
    search: ['titre', 'type_travail', 'machine', 'responsable', 'notes'],
    filters: ['statut', 'priorite', 'commande_id'],
    fields: ['titre', 'commande_id', 'type_travail', 'machine', 'responsable', 'quantite', 'priorite',
      'statut', 'date_debut', 'date_fin', 'notes'],
    required: { titre: 'Le titre est obligatoire.' },
    order: { column: 'id', ascending: false },
  },

  maquettes: {
    table: 'maquettes',
    select: '*, client:clients(id, nom, prenom), commande:commandes(id, numero)',
    search: ['titre', 'designer', 'description', 'fichier_nom'],
    filters: ['statut', 'client_id'],
    fields: ['titre', 'client_id', 'commande_id', 'designer', 'version', 'statut', 'fichier_url', 'fichier_nom', 'description'],
    required: { titre: 'Le titre est obligatoire.' },
    order: { column: 'id', ascending: false },
  },
};

/** Ne garde que les champs autorisés ; les chaînes vides deviennent null. */
export function pick(def: ResourceDef, body: any) {
  const out: any = {};
  for (const f of def.fields) {
    if (body && f in body) {
      const v = body[f];
      out[f] = typeof v === 'string' && v.trim() === '' ? null : v;
    }
  }
  return out;
}

export function verifierRequis(def: ResourceDef, data: any, creation: boolean) {
  for (const [f, msg] of Object.entries(def.required || {})) {
    if (creation || f in data) {
      if (data[f] === null || data[f] === undefined || data[f] === '') return msg;
    }
  }
  return null;
}
