import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { handle, HttpError, requireUser } from '@/lib/auth';
import { db } from '@/lib/supabase';

export const runtime = 'nodejs';

// Chaque utilisateur (superadmin compris) peut changer SON mot de passe
export const POST = handle(async (req: NextRequest) => {
  const me = await requireUser();
  const body = await req.json().catch(() => ({}));
  const actuel = String(body.actuel || '');
  const nouveau = String(body.nouveau || '');
  if (nouveau.length < 8) throw new HttpError(400, 'Le nouveau mot de passe doit contenir au moins 8 caractères.');

  const { data } = await db().from('utilisateurs').select('password_hash').eq('id', me.id).single();
  if (!data || !(await bcrypt.compare(actuel, data.password_hash))) {
    throw new HttpError(400, 'Mot de passe actuel incorrect.');
  }
  const { error } = await db()
    .from('utilisateurs')
    .update({ password_hash: await bcrypt.hash(nouveau, 10) })
    .eq('id', me.id);
  if (error) throw error;
  return NextResponse.json({ ok: true });
});
