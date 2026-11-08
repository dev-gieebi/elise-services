'use client';

import ResourcePage, { ResourceConfig } from '@/components/ResourcePage';
import PageTitle from '@/components/PageTitle';
import { IconClients, IconImage, IconNote, IconOrders, IconUser } from '@/components/icons';
import { badgeClass, dateFr, nomClient } from '@/lib/client';
import { STATUTS_MAQUETTE } from '@/lib/listes';

const config: ResourceConfig = {
  resource: 'maquettes',
  title: 'Liste des maquettes',
  feminin: true,
  singular: 'maquette',
  formTitle: 'Détails de la maquette',
  formIcon: IconImage,
  searchPlaceholder: 'Rechercher une maquette (titre, designer…)',
  filters: [{ name: 'statut', label: 'Statut', options: STATUTS_MAQUETTE }],
  columns: [
    { key: 'apercu', label: '', render: (m) =>
      m.fichier_url && /\.(png|jpe?g|gif|webp|svg)$/i.test(m.fichier_url)
        ? <img src={m.fichier_url} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, display: 'block' }} />
        : <span className="muted">{m.fichier_url ? '📎' : '—'}</span> },
    { key: 'titre', label: 'Titre' },
    { key: 'client', label: 'Client', render: (m) => nomClient(m.client) },
    { key: 'version', label: 'Version', render: (m) => `V${m.version}` },
    { key: 'statut', label: 'Statut', render: (m) => <span className={badgeClass(m.statut)}>{m.statut}</span> },
    { key: 'updated_at', label: 'Modifiée', className: 'nowrap', render: (m) => dateFr(m.updated_at) },
  ],
  fields: [
    { name: 'titre', label: 'Titre', required: true, placeholder: 'Ex : Logo + carte de visite' },
    { name: 'client_id', label: 'Client', type: 'relation', icon: IconClients, placeholder: '— Aucun —',
      relation: { resource: 'clients', label: (c) => nomClient(c) } },
    { name: 'commande_id', label: 'Commande', type: 'relation', icon: IconOrders, placeholder: '— Aucune —',
      relation: { resource: 'commandes', label: (c) => `${c.numero} — ${nomClient(c.client)}` } },
    { name: 'designer', label: 'Infographiste', icon: IconUser },
    { name: 'version', label: 'Version', type: 'number', step: '1' },
    { name: 'statut', label: 'Statut', type: 'select', options: STATUTS_MAQUETTE, required: true },
    { name: 'fichier', label: 'Fichier (image, PDF… 4 Mo max)', type: 'file', icon: IconImage },
    { name: 'description', label: 'Description / retours du client', type: 'textarea', icon: IconNote },
  ],
  defaults: () => ({
    titre: '', client_id: null, commande_id: null, designer: '', version: 1, statut: 'Brouillon',
    fichier_url: null, fichier_nom: null, description: '',
  }),
};

export default function MaquettesPage() {
  return (
    <>
      <PageTitle icon={IconImage}>Gestion des Maquettes</PageTitle>
      <ResourcePage config={config} />
    </>
  );
}
