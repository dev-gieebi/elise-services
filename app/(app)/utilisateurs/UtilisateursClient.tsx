'use client';

import ResourcePage, { ResourceConfig } from '@/components/ResourcePage';
import PageTitle from '@/components/PageTitle';
import { useUser } from '@/components/Shell';
import { IconKey, IconMail, IconUser } from '@/components/icons';
import { badgeClass, dateFr } from '@/lib/client';

export default function UtilisateursClient() {
  const me = useUser();

  const config: ResourceConfig = {
    resource: 'utilisateurs',
    apiBase: '/api/users',
    title: 'Liste des utilisateurs',
    singular: 'utilisateur',
    formTitle: "Informations de l'utilisateur",
    formIcon: IconUser,
    searchPlaceholder: 'Rechercher un utilisateur (nom, email…)',
    pageSize: 1000,
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'nom', label: 'Nom', render: (u) => <>{u.nom}{u.id === me.id && <span className="muted"> (vous)</span>}</> },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Rôle', render: (u) => <span className={badgeClass(u.role)}>{u.role === 'superadmin' ? 'Super admin' : 'Utilisateur'}</span> },
      { key: 'actif', label: 'État', render: (u) => <span className={u.actif ? 'badge green' : 'badge red'}>{u.actif ? 'Actif' : 'Désactivé'}</span> },
      { key: 'created_at', label: 'Créé le', render: (u) => dateFr(u.created_at) },
    ],
    fields: [
      { name: 'nom', label: 'Nom complet', icon: IconUser, required: true },
      { name: 'email', label: 'Email (identifiant)', type: 'email', icon: IconMail, required: true },
      { name: 'password', label: 'Mot de passe', type: 'password', icon: IconKey,
        hint: 'Au moins 8 caractères. En modification, laissez vide pour garder le mot de passe actuel.' },
      { name: 'role', label: 'Rôle', type: 'select', required: true, options: [
        { value: 'utilisateur', label: 'Utilisateur — accès à tout sauf la gestion des utilisateurs' },
        { value: 'superadmin', label: 'Super admin — accès complet' },
      ] },
      { name: 'actif', label: 'Compte actif (peut se connecter)', type: 'checkbox' },
    ],
    toForm: (u) => ({ ...u, password: '' }),
    defaults: () => ({ nom: '', email: '', password: '', role: 'utilisateur', actif: true }),
    canDelete: (u) => u.id !== me.id,
  };

  return (
    <>
      <PageTitle icon={IconUser}>Gestion des Utilisateurs</PageTitle>
      <ResourcePage config={config} />
    </>
  );
}
