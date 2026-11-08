import { NextRequest, NextResponse } from 'next/server';
import { handle, HttpError, requireUser } from '@/lib/auth';
import { db } from '@/lib/supabase';
import { pick, RESOURCES, verifierRequis } from '@/lib/resources';

type Ctx = { params: Promise<{ resource: string; id: string }> };

async function resolve(params: Ctx['params']) {
  const { resource, id } = await params;
  const def = RESOURCES[resource];
  if (!def) throw new HttpError(404, 'Ressource inconnue.');
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(400, 'Identifiant invalide.');
  return { def, id: n, resource };
}

export const GET = handle(async (_req: NextRequest, { params }: Ctx) => {
  await requireUser();
  const { def, id } = await resolve(params);
  const { data, error } = await db().from(def.table).select(def.select).eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, 'Élément introuvable.');
  return NextResponse.json({ data });
});

export const PUT = handle(async (req: NextRequest, { params }: Ctx) => {
  await requireUser();
  const { def, id } = await resolve(params);
  if (def.noUpdate) {
    throw new HttpError(400, 'Un mouvement ne se modifie pas : supprimez-le puis recréez-le.');
  }
  const body = await req.json().catch(() => ({}));
  let data = pick(def, body);
  const manque = verifierRequis(def, data, false);
  if (manque) throw new HttpError(400, manque);
  if (def.prepare) data = def.prepare(data);

  const { data: row, error } = await db().from(def.table).update(data).eq('id', id).select(def.select).single();
  if (error) throw error;
  return NextResponse.json({ data: row });
});

export const DELETE = handle(async (_req: NextRequest, { params }: Ctx) => {
  await requireUser();
  const { def, id, resource } = await resolve(params);

  // Supprimer le fichier d'une maquette dans le stockage
  if (resource === 'maquettes') {
    const { data } = await db().from('maquettes').select('fichier_url').eq('id', id).maybeSingle();
    const chemin = data?.fichier_url?.split('/storage/v1/object/public/maquettes/')[1];
    if (chemin) await db().storage.from('maquettes').remove([decodeURIComponent(chemin)]);
  }

  const { error } = await db().from(def.table).delete().eq('id', id);
  if (error) throw error;
  return NextResponse.json({ ok: true });
});
