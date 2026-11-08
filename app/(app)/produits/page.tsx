'use client';

import ResourcePage, { ResourceConfig } from '@/components/ResourcePage';
import PageTitle from '@/components/PageTitle';
import { IconNote, IconTag } from '@/components/icons';
import { fcfa } from '@/lib/client';
import { TYPES_TRAVAIL, UNITES } from '@/lib/listes';

const config: ResourceConfig = {
  resource: 'produits',
  title: 'Catalogue des produits et services',
  singular: 'produit',
  formTitle: 'Fiche du produit',
  formIcon: IconTag,
  searchPlaceholder: 'Rechercher un produit (référence, désignation…)',
  filters: [{ name: 'categorie', label: 'Catégorie', options: TYPES_TRAVAIL }],
  columns: [
    { key: 'reference', label: 'Réf.', className: 'nowrap' },
    { key: 'designation', label: 'Désignation' },
    { key: 'categorie', label: 'Catégorie' },
    { key: 'prix_unitaire', label: 'Prix unitaire', className: 'right nowrap', render: (p) => fcfa(p.prix_unitaire) },
    { key: 'unite', label: 'Unité' },
    {
      key: 'actif', label: 'Statut',
      render: (p) => <span className={`badge ${p.actif ? 'green' : 'red'}`}>{p.actif ? 'Actif' : 'Inactif'}</span>,
    },
  ],
  fields: [
    { name: 'designation', label: 'Désignation', icon: IconTag, required: true, placeholder: 'Ex : Flyers A5 quadri 135 g' },
    { name: 'reference', label: 'Référence', hint: 'Laissez vide pour une référence automatique (PRD-0001…).' },
    { name: 'categorie', label: 'Catégorie', type: 'select', options: TYPES_TRAVAIL },
    { name: 'unite', label: 'Unité de vente', type: 'select', options: UNITES, required: true },
    { name: 'prix_unitaire', label: 'Prix unitaire (FCFA)', type: 'number', step: 'any', required: true },
    { name: 'actif', label: 'Produit actif (proposé dans les commandes et factures)', type: 'checkbox' },
    { name: 'description', label: 'Description', type: 'textarea', icon: IconNote, full: true,
      placeholder: 'Détails du produit ou du service (format, finitions…)' },
  ],
  defaults: () => ({
    designation: '', reference: '', categorie: '', unite: 'unité', prix_unitaire: '', description: '', actif: true,
  }),
};

export default function ProduitsPage() {
  return (
    <>
      <PageTitle icon={IconTag}>Gestion des Produits</PageTitle>
      <ResourcePage config={config} />
      <p className="muted" style={{ margin: 0, fontSize: 12.5 }}>
        Les produits actifs sont proposés automatiquement dans les lignes des commandes et des factures :
        choisir un produit remplit la désignation et le prix unitaire.
      </p>
    </>
  );
}
