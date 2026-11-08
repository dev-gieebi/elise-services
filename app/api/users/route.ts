import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { handle, HttpError, requireSuperadmin } from '@/lib/auth';
import { db } from '@/lib/supabase';

export const runtime = 'nodejs';

const COLS = 'id, nom, email, role, actif, created_at';

// Liste des utilisateurs — SUPERADMIN uniquement
export const GET = handle(async (req: NextRequest) => {
  await requireSuperadmin();
  const q = (req.nextUrl.searchParams.get('q') || '').replace(/[%,()*\\]/g, ' ').trim();
  let query = db().from('utilisateurs').select(COLS, { count: 'exact' }).order('id');
  if (q) query = query.or(`nom.ilike.%${q}%,email.ilike.%${q}%`);
  const { data, error, count } = await query;
  if (error) throw error;
  return NextResponse.json({ data, count: count ?? 0, page: 1, size: count ?? 0 });
});

// Création d'un utilisateur — SUPERADMIN uniquement
export const POST = handle(async (req: NextRequest) => {
  await requireSuperadmin();
  const b = await req.json().catch(() => ({}));
  const nom = String(b.nom || '').trim();
  const email = String(b.email || '').trim().toLowerCase();
  const password = String(b.password || '');
  const role = b.role === 'superadmin' ? 'superadmin' : 'utilisateur';

  if (!nom) throw new HttpError(400, 'Le nom est obligatoire.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Email invalide.');
  if (password.length < 8) throw new HttpError(400, 'Le mot de passe doit contenir au moins 8 caractères.');

  const { data, error } = await db()
    .from('utilisateurs')
    .insert({ nom, email, role, actif: b.actif !== false, password_hash: await bcrypt.hash(password, 10) })
    .select(COLS)
    .single();
  if (error) throw error;
  return NextResponse.json({ data }, { status: 201 });
});
