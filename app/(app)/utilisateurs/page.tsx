import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import UtilisateursClient from './UtilisateursClient';

// Double protection : le middleware ET cette vérification serveur (les API le vérifient aussi)
export default async function UtilisateursPage() {
  const me = await currentUser();
  if (!me || me.role !== 'superadmin') redirect('/');
  return <UtilisateursClient />;
}
