'use client';

import { useState } from 'react';
import ResourcePage, { ResourceConfig } from '@/components/ResourcePage';
import PageTitle from '@/components/PageTitle';
import { IconArrows, IconNote, IconOrders, IconStock } from '@/components/icons';
import { api, badgeClass, dateHeureFr } from '@/lib/client';
import { CATEGORIES_ARTICLE, TYPES_MOUVEMENT, UNITES } from '@/lib/listes';

const qte = (v: any) => new Intl.NumberFormat('fr-FR').format(Number(v) || 0);
const bas = (a: any) => Number(a.quantite) <= Number(a.seuil_alerte);

const articles: ResourceConfig = {
  resource: 'articles',
  title: 'Articles en stock',
  singular: 'article',
  formTitle: "Fiche de l'article",
  formIcon: IconStock,
  searchPlaceholder: 'Rechercher un article (référence, désignation, fournisseur…)',
  filters: [{ name: 'categorie', label: 'Catégorie', options: CATEGORIES_ARTICLE }],
  columns: [
    { key: 'reference', label: 'Réf.', className: 'nowrap' },
    { key: 'designation', label: 'Désignation' },
    { key: 'categorie', label: 'Catégorie' },
    {
      key: 'quantite', label: 'Stock', className: 'right nowrap',
      render: (a) => (
        <span className={bas(a) ? 'badge red' : 'badge green'}>{qte(a.quantite)} {a.unite}</span>
      ),
    },
    { key: 'seuil_alerte', label: 'Seuil', className: 'right', render: (a) => qte(a.seuil_alerte) },
  ],
  rowClass: (a) => (bas(a) ? 'warn' : ''),
  fields: [
    { name: 'designation', label: 'Désignation', required: true, placeholder: 'Ex : Papier couché 135 g A3' },
    { name: 'reference', label: 'Référence', hint: 'Laissez vide pour une référence automatique (ART-0001…).' },
    { name: 'categorie', label: 'Catégorie', type: 'select', options: CATEGORIES_ARTICLE },
    { name: 'unite', label: 'Unité', type: 'select', options: UNITES, required: true },
    { name: 'stock_initial', label: 'Stock initial', type: 'number', step: 'any', onlyNew: true,
      hint: 'Ensuite, le stock évolue uniquement par les mouvements (entrées / sorties).' },
    { name: 'quantite_affichee', label: 'Stock actuel', type: 'custom',
      render: (f) => f.id ? (
        <div className="totaux"><div><span>Stock actuel</span><b>{qte(f.quantite)} {f.unite}</b></div></div>
      ) : null },
    { name: 'seuil_alerte', label: "Seuil d'alerte", type: 'number', step: 'any', hint: 'Alerte quand le stock descend à ce niveau.' },
    { name: 'prix_achat', label: "Prix d'achat unitaire (FCFA)", type: 'number', step: 'any' },
    { name: 'fournisseur', label: 'Fournisseur' },
    { name: 'emplacement', label: 'Emplacement', placeholder: 'Ex : Magasin, étagère B' },
  ],
  defaults: () => ({
    designation: '', reference: '', categorie: '', unite: 'unité', stock_initial: '', seuil_alerte: 0,
    prix_achat: 0, fournisseur: '', emplacement: '',
  }),
  afterCreate: async (row, form) => {
    const q = Number(form.stock_initial);
    if (q > 0) {
      await api('/api/r/mouvements', {
        method: 'POST',
        body: JSON.stringify({ article_id: row.id, type: 'Entrée', quantite: q, motif: 'Stock initial' }),
      });
    }
  },
};

const mouvements: ResourceConfig = {
  resource: 'mouvements',
  title: 'Mouvements de stock',
  singular: 'mouvement',
  formTitle: 'Détail du mouvement',
  formIcon: IconArrows,
  searchPlaceholder: 'Rechercher (motif, utilisateur…)',
  readOnlyExisting: true,
  filters: [{ name: 'type', label: 'Type', options: TYPES_MOUVEMENT }],
  columns: [
    { key: 'date_mouvement', label: 'Date', className: 'nowrap', render: (m) => dateHeureFr(m.date_mouvement) },
    { key: 'article', label: 'Article', render: (m) => m.article?.designation },
    { key: 'type', label: 'Type', render: (m) => <span className={badgeClass(m.type)}>{m.type}</span> },
    { key: 'quantite', label: 'Qté', className: 'right nowrap', render: (m) => `${qte(m.quantite)} ${m.article?.unite || ''}` },
    { key: 'motif', label: 'Motif' },
    { key: 'utilisateur', label: 'Par' },
  ],
  fields: [
    { name: 'article_id', label: 'Article', type: 'relation', icon: IconStock, required: true,
      relation: { resource: 'articles', label: (a) => `${a.designation} (stock : ${qte(a.quantite)} ${a.unite})` } },
    { name: 'type', label: 'Type de mouvement', type: 'select', options: TYPES_MOUVEMENT, required: true,
      hint: 'Ajustement : la quantité saisie devient le nouveau stock (après inventaire).' },
    { name: 'quantite', label: 'Quantité', type: 'number', step: 'any', required: true },
    { name: 'commande_id', label: 'Commande concernée', type: 'relation', icon: IconOrders, placeholder: '— Aucune —',
      relation: { resource: 'commandes', label: (c) => c.numero } },
    { name: 'motif', label: 'Motif', type: 'textarea', icon: IconNote, placeholder: 'Ex : Réception fournisseur, consommation atelier…' },
  ],
  defaults: () => ({ article_id: null, type: 'Entrée', quantite: '', commande_id: null, motif: '' }),
  canDelete: () => true,
};

export default function StocksPage() {
  const [onglet, setOnglet] = useState<'articles' | 'mouvements'>('articles');
  const [k, setK] = useState(0);
  return (
    <>
      <PageTitle icon={IconStock}>Gestion des Stocks</PageTitle>
      <div className="tabs">
        <button className={`tab ${onglet === 'articles' ? 'active' : ''}`} onClick={() => { setOnglet('articles'); setK(k + 1); }}>
          <IconStock /> Articles
        </button>
        <button className={`tab ${onglet === 'mouvements' ? 'active' : ''}`} onClick={() => { setOnglet('mouvements'); setK(k + 1); }}>
          <IconArrows /> Entrées / Sorties
        </button>
      </div>
      {onglet === 'articles'
        ? <ResourcePage key="a" config={articles} refreshKey={k} />
        : <ResourcePage key="m" config={mouvements} refreshKey={k} />}
      <p className="muted" style={{ margin: 0, fontSize: 12.5 }}>
        Les articles marqués en rouge sont au seuil d’alerte ou en dessous : pensez à les réapprovisionner.
        Le stock se met à jour automatiquement à chaque entrée ou sortie.
      </p>
    </>
  );
}
