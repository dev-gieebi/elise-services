import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { handle, HttpError, requireSuperadmin } from '@/lib/auth';
import { db } from '@/lib/supabase';

export const runtime = 'nodejs';

const COLS = 'id, nom, email, role, actif, created_at';
type Ctx = { params: Promise<{ id: string }> };

async function nbSuperadminsActifs() {
  const { count } = await db()
    .from('utilisateurs')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'superadmin')
    .eq('actif', true);
  return count ?? 0;
}

// Modification — SUPERADMIN uniquement
export const PUT = handle(async (req: NextRequest, { params }: Ctx) => {
  const me = await requireSuperadmin();
  const id = Number((await params).id);
  const b = await req.json().catch(() => ({}));

  const { data: cible } = await db().from('utilisateurs').select('role, actif').eq('id', id).maybeSingle();
  if (!cible) throw new HttpError(404, 'Utilisateur introuvable.');

  const maj: any = {};
  if (b.nom !== undefined) {
    if (!String(b.nom).trim()) throw new HttpError(400, 'Le nom est obligatoire.');
    maj.nom = String(b.nom).trim();
  }
  if (b.email !== undefined) {
    const email = String(b.email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Email invalide.');
    maj.email = email;
  }
  if (b.role !== undefined) maj.role = b.role === 'superadmin' ? 'superadmin' : 'utilisateur';
  if (b.actif !== undefined) maj.actif = !!b.actif;
  if (b.password) {
    if (String(b.password).length < 8) throw new HttpError(400, 'Le mot de passe doit contenir au moins 8 caractères.');
    maj.password_hash = await bcrypt.hash(String(b.password), 10);
  }

  // On ne peut pas retirer le dernier superadmin actif (ni se bloquer soi-même)
  const perdAdmin = cible.role === 'superadmin' && cible.actif &&
    ((maj.role && maj.role !== 'superadmin') || maj.actif === false);
  if (perdAdmin && (id === me.id || (await nbSuperadminsActifs()) <= 1)) {
    throw new HttpError(400, 'Impossible : il doit rester au moins un super administrateur actif (et vous ne pouvez pas vous retirer vos propres droits).');
  }

  const { data, error } = await db().from('utilisateurs').update(maj).eq('id', id).select(COLS).single();
  if (error) throw error;
  return NextResponse.json({ data });
});

// Suppression — SUPERADMIN uniquement
export const DELETE = handle(async (_req: NextRequest, { params }: Ctx) => {
  const me = await requireSuperadmin();
  const id = Number((await params).id);
  if (id === me.id) throw new HttpError(400, 'Vous ne pouvez pas supprimer votre propre compte.');

  const { data: cible } = await db().from('utilisateurs').select('role, actif').eq('id', id).maybeSingle();
  if (!cible) throw new HttpError(404, 'Utilisateur introuvable.');
  if (cible.role === 'superadmin' && cible.actif && (await nbSuperadminsActifs()) <= 1) {
    throw new HttpError(400, 'Impossible de supprimer le dernier super administrateur.');
  }
  const { error } = await db().from('utilisateurs').delete().eq('id', id);
  if (error) throw error;
  return NextResponse.json({ ok: true });
});
