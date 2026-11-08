import { NextRequest, NextResponse } from 'next/server';
import { handle, HttpError, requireUser } from '@/lib/auth';
import { db } from '@/lib/supabase';
import { pick, RESOURCES, verifierRequis } from '@/lib/resources';

type Ctx = { params: Promise<{ resource: string }> };

function getDef(name: string) {
  const def = RESOURCES[name];
  if (!def) throw new HttpError(404, 'Ressource inconnue.');
  return def;
}

const clean = (s: string) => s.replace(/[%,()*\\]/g, ' ').trim();

// Liste avec recherche, filtres et pagination
export const GET = handle(async (req: NextRequest, { params }: Ctx) => {
  await requireUser();
  const { resource } = await params;
  const def = getDef(resource);
  const sp = req.nextUrl.searchParams;

  const page = Math.max(1, Number(sp.get('page')) || 1);
  const size = Math.min(500, Math.max(1, Number(sp.get('size')) || 10));
  const q = clean(sp.get('q') || '');

  let query = db().from(def.table).select(def.select, { count: 'exact' });

  if (q && def.search.length) {
    query = query.or(def.search.map((c) => `${c}.ilike.%${q}%`).join(','));
  }
  for (const f of def.filters || []) {
    const v = sp.get(f);
    if (v) query = query.eq(f, v);
  }
  if (def.order) query = query.order(def.order.column, { ascending: def.order.ascending });
  if (def.order?.column !== 'id') query = query.order('id', { ascending: false });

  const from = (page - 1) * size;
  const { data, error, count } = await query.range(from, from + size - 1);
  if (error) throw error;
  return NextResponse.json({ data, count: count ?? 0, page, size });
});

// Création
export const POST = handle(async (req: NextRequest, { params }: Ctx) => {
  const user = await requireUser();
  const { resource } = await params;
  const def = getDef(resource);
  const body = await req.json().catch(() => ({}));

  let data = pick(def, body);
  const manque = verifierRequis(def, data, true);
  if (manque) throw new HttpError(400, manque);
  if (def.prepare) data = def.prepare(data);
  if (resource === 'mouvements') data.utilisateur = user.nom;

  const { data: row, error } = await db().from(def.table).insert(data).select(def.select).single();
  if (error) throw error;
  return NextResponse.json({ data: row }, { status: 201 });
});
