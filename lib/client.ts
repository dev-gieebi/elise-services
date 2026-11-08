// Outils côté navigateur : appels API et mise en forme
export async function api<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const isForm = options.body instanceof FormData;
  const res = await fetch(url, {
    ...options,
    headers: isForm ? options.headers : { 'Content-Type': 'application/json', ...(options.headers || {}) },
    cache: 'no-store',
  });
  if (res.status === 401 && typeof window !== 'undefined' && !url.includes('/api/auth/')) {
    window.location.href = '/login';
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);
  return json as T;
}

export const fcfa = (n: any) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(n) || 0).replace(/ | /g, ' ') + ' FCFA';

export const dateFr = (d: any) => {
  if (!d) return '';
  const x = new Date(String(d).length === 10 ? d + 'T00:00:00' : d);
  return isNaN(x.getTime()) ? '' : x.toLocaleDateString('fr-FR');
};

export const dateHeureFr = (d: any) => {
  if (!d) return '';
  const x = new Date(d);
  return isNaN(x.getTime()) ? '' : x.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
};

export const today = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export const nomClient = (c: any) => (c ? [c.nom, c.prenom].filter(Boolean).join(' ') : '');

const COULEURS: Record<string, string> = {
  'En attente': 'orange', 'En production': 'blue', 'Terminée': 'green', 'Livrée': 'green', 'Annulée': 'red',
  'Impayée': 'red', 'Partiellement payée': 'orange', 'Payée': 'green',
  'À faire': '', 'En cours': 'blue', 'En pause': 'orange',
  'Basse': '', 'Normale': 'blue', 'Haute': 'orange', 'Urgente': 'red',
  'Brouillon': '', 'Envoyée au client': 'blue', 'Validée': 'green', 'À corriger': 'orange', 'Rejetée': 'red',
  'Entrée': 'green', 'Sortie': 'red', 'Ajustement': 'blue',
  superadmin: 'blue', utilisateur: '',
};
export const badgeClass = (v: string) => `badge ${COULEURS[v] ?? ''}`;
