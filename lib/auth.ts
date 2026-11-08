// Contrôle d'accès côté serveur (routes API et pages)
import 'server-only';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from './supabase';
import { SESSION_COOKIE, SessionUser, verifySession } from './session';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Utilisateur connecté, revérifié en base (compte actif + rôle à jour). */
export async function currentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const { data } = await db()
    .from('utilisateurs')
    .select('id, nom, email, role, actif')
    .eq('id', session.id)
    .maybeSingle();
  if (!data || !data.actif) return null;
  return { id: data.id, nom: data.nom, email: data.email, role: data.role };
}

export async function requireUser(): Promise<SessionUser> {
  const u = await currentUser();
  if (!u) throw new HttpError(401, 'Session expirée, veuillez vous reconnecter.');
  return u;
}

export async function requireSuperadmin(): Promise<SessionUser> {
  const u = await requireUser();
  if (u.role !== 'superadmin') {
    throw new HttpError(403, 'Accès réservé au super administrateur.');
  }
  return u;
}

/** Enveloppe commune des routes API : erreurs propres en JSON. */
export function handle<T extends any[]>(fn: (...args: T) => Promise<Response>) {
  return async (...args: T): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e: any) {
      if (e instanceof HttpError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
      }
      const metier = ['23505', '23503', '23514', '22P02', 'P0001'].includes(e?.code) ||
        String(e?.message || '').includes('Stock insuffisant');
      if (!metier) console.error(e);
      return NextResponse.json({ error: traduireErreur(e) }, { status: metier ? 400 : 500 });
    }
  };
}

export function traduireErreur(e: any): string {
  const msg: string = e?.message || String(e);
  const code: string = e?.code || '';
  if (code === '23505') return 'Cette valeur existe déjà (doublon).';
  if (code === '23503') return 'Impossible : cet élément est utilisé ailleurs (commande, facture…).';
  if (code === '23514') return 'Une valeur saisie n’est pas autorisée.';
  if (msg.includes('Stock insuffisant')) return 'Stock insuffisant pour cette sortie.';
  return msg;
}
