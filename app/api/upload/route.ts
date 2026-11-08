import { NextRequest, NextResponse } from 'next/server';
import { handle, HttpError, requireUser } from '@/lib/auth';
import { db } from '@/lib/supabase';

export const runtime = 'nodejs';

const MAX = 4 * 1024 * 1024; // limite Vercel gratuite : ~4,5 Mo par requête

// Envoi d'un fichier de maquette vers Supabase Storage (bucket "maquettes")
export const POST = handle(async (req: NextRequest) => {
  await requireUser();
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) throw new HttpError(400, 'Aucun fichier reçu.');
  if (file.size > MAX) throw new HttpError(400, 'Fichier trop lourd (4 Mo maximum).');

  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const base = file.name.replace(/\.[^.]+$/, '').normalize('NFD').replace(/[^\w-]+/g, '_').slice(0, 60);
  const chemin = `${new Date().getFullYear()}/${Date.now()}_${base}.${ext}`;

  const { error } = await db().storage.from('maquettes').upload(chemin, Buffer.from(await file.arrayBuffer()), {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });
  if (error) throw error;

  const { data } = db().storage.from('maquettes').getPublicUrl(chemin);
  return NextResponse.json({ url: data.publicUrl, nom: file.name });
});
