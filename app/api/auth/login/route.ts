import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { handle, HttpError } from '@/lib/auth';
import { db } from '@/lib/supabase';
import { SESSION_COOKIE, SESSION_DURATION_H, signSession } from '@/lib/session';

export const runtime = 'nodejs';

const DEFAULT_ADMIN = { nom: 'Super Admin', email: 'superadmin@gmail.com', password: 'password123' };

/** Si la table est vide (script SQL lancé sans le seed), on recrée le superadmin par défaut. */
async function assurerSuperadmin() {
  const { count } = await db().from('utilisateurs').select('id', { count: 'exact', head: true });
  if (count === 0) {
    await db().from('utilisateurs').insert({
      nom: DEFAULT_ADMIN.nom,
      email: DEFAULT_ADMIN.email,
      password_hash: await bcrypt.hash(DEFAULT_ADMIN.password, 10),
      role: 'superadmin',
    });
  }
}

export const POST = handle(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!email || !password) throw new HttpError(400, 'Email et mot de passe requis.');

  await assurerSuperadmin();

  const { data: user, error } = await db()
    .from('utilisateurs')
    .select('id, nom, email, role, actif, password_hash')
    .eq('email', email)
    .maybeSingle();
  if (error) throw error;

  const ok = user && (await bcrypt.compare(password, user.password_hash));
  if (!ok) throw new HttpError(401, 'Email ou mot de passe incorrect.');
  if (!user.actif) throw new HttpError(403, 'Ce compte est désactivé. Contactez le super administrateur.');

  const token = await signSession({ id: user.id, nom: user.nom, email: user.email, role: user.role });
  const res = NextResponse.json({ ok: true, user: { nom: user.nom, role: user.role } });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DURATION_H * 3600,
  });
  return res;
});
