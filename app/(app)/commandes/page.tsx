'use client';

import ResourcePage, { ResourceConfig } from '@/components/ResourcePage';
import PageTitle from '@/components/PageTitle';
import { totalLignes } from '@/components/LignesEditor';
import { IconCalendar, IconClients, IconInvoice, IconNote, IconOrders } from '@/components/icons';
import { api, badgeClass, dateFr, fcfa, nomClient, today } from '@/lib/client';
import { STATUTS_COMMANDE, TYPES_TRAVAIL } from '@/lib/listes';

const config: ResourceConfig = {
  resource: 'commandes',
  title: 'Liste des commandes',
  feminin: true,
  singular: 'commande',
  formTitle: 'Détails de la commande',
  formIcon: IconOrders,
  searchPlaceholder: 'Rechercher une commande (numéro, type de travail…)',
  wide: true,
  filters: [{ name: 'statut', label: 'Statut', options: STATUTS_COMMANDE }],
  columns: [
    { key: 'numero', label: 'N°', className: 'nowrap' },
    { key: 'client', label: 'Client', render: (r) => nomClient(r.client) },
    { key: 'type_travail', label: 'Travail' },
    { key: 'date_commande', label: 'Date', render: (r) => dateFr(r.date_commande) },
    { key: 'date_livraison', label: 'Livraison', render: (r) => dateFr(r.date_livraison) },
    { key: 'statut', label: 'Statut', render: (r) => <span className={badgeClass(r.statut)}>{r.statut}</span> },
    { key: 'montant_total', label: 'Montant', className: 'right nowrap', render: (r) => fcfa(r.montant_total) },
    { key: 'reste', label: 'Reste', className: 'right nowrap', render: (r) => fcfa(Number(r.montant_total) - Number(r.avance)) },
  ],
  rowClass: (r) =>
    r.date_livraison && r.date_livraison < today() && !['Livrée', 'Annulée'].includes(r.statut) ? 'warn' : '',
  rowActions: (row, { notify }) =>
    row.statut !== 'Annulée' && (
      <button className="btn sm" title="Créer la facture de cette commande" onClick={async () => {
        if (!confirm(`Créer la facture de la commande ${row.numero} ?`)) return;
        try {
          const r = await api(`/api/factures/depuis-commande/${row.id}`, { method: 'POST' });
          notify(`Facture ${r.data.numero} créée. Retrouvez-la dans Facturation.`);
        } catch (e: any) {
          notify(e.message, false);
        }
      }}><IconInvoice /> Facturer</button>
    ),
  fields: [
    { name: 'client_id', label: 'Client', type: 'relation', icon: IconClients, required: true,
      relation: { resource: 'clients', label: (c) => `${nomClient(c)} — ${c.telephone}` } },
    { name: 'type_travail', label: 'Type de travail', type: 'select', options: TYPES_TRAVAIL },
    { name: 'date_commande', label: 'Date de commande', type: 'date', icon: IconCalendar, required: true },
    { name: 'date_livraison', label: 'Date de livraison prévue', type: 'date', icon: IconCalendar },
    { name: 'statut', label: 'Statut', type: 'select', options: STATUTS_COMMANDE, required: true },
    { name: 'avance', label: 'Avance versée (FCFA)', type: 'number', step: 'any' },
    { name: 'lignes', label: 'Articles / prestations', type: 'lignes' },
    {
      name: 'resume', label: 'Totaux', type: 'custom',
      render: (f) => {
        const total = totalLignes(f.lignes);
        return (
          <div className="totaux">
            <div><span>Montant total</span><b>{fcfa(total)}</b></div>
            <div><span>Avance</span><span>{fcfa(f.avance)}</span></div>
            <div className="big"><span>Reste à payer</span><span>{fcfa(total - (Number(f.avance) || 0))}</span></div>
          </div>
        );
      },
    },
    { name: 'notes', label: 'Notes / instructions', type: 'textarea', icon: IconNote, full: true },
  ],
  defaults: () => ({
    client_id: null, type_travail: '', date_commande: today(), date_livraison: '', statut: 'En attente',
    avance: 0, lignes: [{ designation: '', quantite: 1, prix_unitaire: 0 }], notes: '',
  }),
};

export default function CommandesPage() {
  return (
    <>
      <PageTitle icon={IconOrders}>Gestion des Commandes</PageTitle>
      <ResourcePage config={config} />
    </>
  );
}
