'use client';

import ResourcePage, { ResourceConfig } from '@/components/ResourcePage';
import PageTitle from '@/components/PageTitle';
import { IconClients, IconMail, IconNote, IconPhone, IconPin, IconUser } from '@/components/icons';

const config: ResourceConfig = {
  resource: 'clients',
  title: 'Liste des clients',
  singular: 'client',
  formTitle: 'Informations du client',
  formIcon: IconUser,
  searchPlaceholder: 'Rechercher un client (nom, téléphone, email…)',
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'nom', label: 'Nom' },
    { key: 'prenom', label: 'Prénom' },
    { key: 'telephone', label: 'Téléphone', className: 'nowrap' },
    { key: 'email', label: 'Email' },
  ],
  fields: [
    { name: 'nom', label: 'Nom', icon: IconUser, required: true, placeholder: 'Nom ou raison sociale' },
    { name: 'prenom', label: 'Prénom', icon: IconUser },
    { name: 'telephone', label: 'Téléphone', type: 'tel', icon: IconPhone, required: true, placeholder: '+241 0X XX XX XX' },
    { name: 'email', label: 'Email', type: 'email', icon: IconMail },
    { name: 'adresse', label: 'Adresse', icon: IconPin, placeholder: 'Adresse complète du client' },
    { name: 'observations', label: 'Observations', type: 'textarea', icon: IconNote, placeholder: 'Informations complémentaires…' },
  ],
  defaults: () => ({ nom: '', prenom: '', telephone: '', email: '', adresse: '', observations: '' }),
};

export default function ClientsPage() {
  return (
    <>
      <PageTitle icon={IconClients}>Gestion des Clients</PageTitle>
      <ResourcePage config={config} />
    </>
  );
}
