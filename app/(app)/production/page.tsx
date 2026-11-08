'use client';

import ResourcePage, { ResourceConfig } from '@/components/ResourcePage';
import PageTitle from '@/components/PageTitle';
import { IconCalendar, IconGear, IconNote, IconOrders, IconUser } from '@/components/icons';
import { badgeClass, dateFr, nomClient, today } from '@/lib/client';
import { PRIORITES, STATUTS_PRODUCTION, TYPES_TRAVAIL } from '@/lib/listes';

const config: ResourceConfig = {
  resource: 'productions',
  title: "Activités d'atelier",
  feminin: true,
  singular: 'production',
  formTitle: 'Détails de la production',
  formIcon: IconGear,
  searchPlaceholder: 'Rechercher (titre, machine, responsable…)',
  filters: [
    { name: 'statut', label: 'Statut', options: STATUTS_PRODUCTION },
    { name: 'priorite', label: 'Priorité', options: PRIORITES },
  ],
  columns: [
    { key: 'titre', label: 'Travail', render: (r) => (
      <>
        <b>{r.titre}</b>
        {r.commande && <div className="muted" style={{ fontSize: 12 }}>{r.commande.numero} · {nomClient(r.commande.client)}</div>}
      </>
    ) },
    { key: 'type_travail', label: 'Type' },
    { key: 'responsable', label: 'Responsable' },
    { key: 'priorite', label: 'Priorité', render: (r) => <span className={badgeClass(r.priorite)}>{r.priorite}</span> },
    { key: 'statut', label: 'Statut', render: (r) => <span className={badgeClass(r.statut)}>{r.statut}</span> },
    { key: 'date_fin', label: 'Échéance', className: 'nowrap', render: (r) => dateFr(r.date_fin) },
  ],
  rowClass: (r) => (r.date_fin && r.date_fin < today() && r.statut !== 'Terminée' ? 'warn' : ''),
  fields: [
    { name: 'titre', label: 'Titre du travail', required: true, placeholder: 'Ex : 500 flyers A5 recto-verso' },
    { name: 'commande_id', label: 'Commande', type: 'relation', icon: IconOrders, placeholder: '— Aucune —',
      relation: { resource: 'commandes', label: (c) => `${c.numero} — ${nomClient(c.client)}`,
        filter: (c) => !['Livrée', 'Annulée'].includes(c.statut) } },
    { name: 'type_travail', label: 'Type de travail', type: 'select', options: TYPES_TRAVAIL, required: true },
    { name: 'machine', label: 'Machine / poste', placeholder: 'Ex : Traceur, presse à chaud…' },
    { name: 'responsable', label: 'Responsable', icon: IconUser },
    { name: 'quantite', label: 'Quantité', type: 'number', step: 'any' },
    { name: 'priorite', label: 'Priorité', type: 'select', options: PRIORITES, required: true },
    { name: 'statut', label: 'Statut', type: 'select', options: STATUTS_PRODUCTION, required: true },
    { name: 'date_debut', label: 'Date de début', type: 'date', icon: IconCalendar },
    { name: 'date_fin', label: 'Date de fin prévue', type: 'date', icon: IconCalendar },
    { name: 'notes', label: 'Notes', type: 'textarea', icon: IconNote },
  ],
  defaults: () => ({
    titre: '', commande_id: null, type_travail: 'Impression numérique', machine: '', responsable: '',
    quantite: '', priorite: 'Normale', statut: 'À faire', date_debut: today(), date_fin: '', notes: '',
  }),
};

export default function ProductionPage() {
  return (
    <>
      <PageTitle icon={IconGear}>Gestion de la Production</PageTitle>
      <ResourcePage config={config} />
    </>
  );
}
