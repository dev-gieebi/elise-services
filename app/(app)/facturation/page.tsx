'use client';

import ResourcePage, { ResourceConfig } from '@/components/ResourcePage';
import PageTitle from '@/components/PageTitle';
import { totalLignes } from '@/components/LignesEditor';
import { IconCalendar, IconClients, IconInvoice, IconNote, IconOrders, IconPrint } from '@/components/icons';
import { badgeClass, dateFr, fcfa, nomClient, today } from '@/lib/client';
import { MODES_PAIEMENT, STATUTS_FACTURE } from '@/lib/listes';

const n = (v: any) => Number(v) || 0;

const config: ResourceConfig = {
  resource: 'factures',
  title: 'Liste des factures',
  feminin: true,
  singular: 'facture',
  formTitle: 'Détails de la facture',
  formIcon: IconInvoice,
  searchPlaceholder: 'Rechercher une facture (numéro, mode de paiement…)',
  wide: true,
  filters: [{ name: 'statut', label: 'Statut', options: STATUTS_FACTURE }],
  columns: [
    { key: 'numero', label: 'N°', className: 'nowrap' },
    { key: 'client', label: 'Client', render: (r) => nomClient(r.client) },
    { key: 'commande', label: 'Commande', render: (r) => r.commande?.numero || '' },
    { key: 'date_facture', label: 'Date', render: (r) => dateFr(r.date_facture) },
    { key: 'montant_ttc', label: 'Montant TTC', className: 'right nowrap', render: (r) => fcfa(r.montant_ttc) },
    { key: 'montant_paye', label: 'Payé', className: 'right nowrap', render: (r) => fcfa(r.montant_paye) },
    { key: 'statut', label: 'Statut', render: (r) => <span className={badgeClass(r.statut)}>{r.statut}</span> },
  ],
  rowActions: (row) => (
    <a className="btn sm" href={`/imprimer/facture/${row.id}`} target="_blank" rel="noreferrer"><IconPrint /> Imprimer</a>
  ),
  fields: [
    { name: 'client_id', label: 'Client', type: 'relation', icon: IconClients, required: true,
      relation: { resource: 'clients', label: (c) => `${nomClient(c)} — ${c.telephone}` } },
    { name: 'commande_id', label: 'Commande liée', type: 'relation', icon: IconOrders, placeholder: '— Aucune —',
      relation: { resource: 'commandes', label: (c) => `${c.numero} — ${nomClient(c.client)}` } },
    { name: 'date_facture', label: 'Date de facture', type: 'date', icon: IconCalendar, required: true },
    { name: 'date_echeance', label: "Date d'échéance", type: 'date', icon: IconCalendar },
    { name: 'lignes', label: 'Lignes de facture', type: 'lignes' },
    { name: 'remise', label: 'Remise (FCFA)', type: 'number', step: 'any' },
    { name: 'taux_tva', label: 'TVA (%)', type: 'number', step: 'any', hint: 'Mettez 0 si vous ne facturez pas la TVA (18 % au Gabon).' },
    { name: 'montant_paye', label: 'Montant payé (FCFA)', type: 'number', step: 'any' },
    { name: 'mode_paiement', label: 'Mode de paiement', type: 'select', options: MODES_PAIEMENT },
    { name: 'statut', label: 'Statut', type: 'select', options: STATUTS_FACTURE, required: true,
      hint: 'Calculé automatiquement selon le montant payé (sauf « Annulée »).' },
    {
      name: 'resume', label: 'Totaux', type: 'custom',
      render: (f) => {
        const brut = totalLignes(f.lignes);
        const ht = Math.max(0, brut - n(f.remise));
        const tva = (ht * n(f.taux_tva)) / 100;
        const ttc = ht + tva;
        return (
          <div className="totaux">
            <div><span>Total des lignes</span><span>{fcfa(brut)}</span></div>
            <div><span>Remise</span><span>- {fcfa(f.remise)}</span></div>
            <div><span>Total HT</span><span>{fcfa(ht)}</span></div>
            <div><span>TVA ({n(f.taux_tva)} %)</span><span>{fcfa(tva)}</span></div>
            <div className="big"><span>Total TTC</span><span>{fcfa(ttc)}</span></div>
            <div><span>Déjà payé</span><span>{fcfa(f.montant_paye)}</span></div>
            <div><b>Reste à payer</b><b>{fcfa(Math.max(0, ttc - n(f.montant_paye)))}</b></div>
          </div>
        );
      },
    },
    { name: 'notes', label: 'Notes', type: 'textarea', icon: IconNote, full: true },
  ],
  defaults: () => ({
    client_id: null, commande_id: null, date_facture: today(), date_echeance: '',
    lignes: [{ designation: '', quantite: 1, prix_unitaire: 0 }], remise: 0, taux_tva: 0,
    montant_paye: 0, mode_paiement: '', statut: 'Impayée', notes: '',
  }),
};

export default function FacturationPage() {
  return (
    <>
      <PageTitle icon={IconInvoice}>Facturation</PageTitle>
      <ResourcePage config={config} />
    </>
  );
}
