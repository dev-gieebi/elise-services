import { NextRequest, NextResponse } from 'next/server';
import { handle, HttpError, requireUser } from '@/lib/auth';
import { db } from '@/lib/supabase';
import { calculerFacture } from '@/lib/resources';

type Ctx = { params: Promise<{ id: string }> };

// Génère une facture à partir d'une commande (reprend client, lignes et avance)
export const POST = handle(async (_req: NextRequest, { params }: Ctx) => {
  await requireUser();
  const id = Number((await params).id);

  const { data: cmd } = await db().from('commandes').select('*').eq('id', id).maybeSingle();
  if (!cmd) throw new HttpError(404, 'Commande introuvable.');

  const { data: existante } = await db()
    .from('factures').select('id, numero').eq('commande_id', id).neq('statut', 'Annulée').limit(1).maybeSingle();
  if (existante) throw new HttpError(400, `Cette commande est déjà facturée (${existante.numero}).`);

  const facture = calculerFacture({
    client_id: cmd.client_id,
    commande_id: cmd.id,
    lignes: cmd.lignes,
    remise: 0,
    taux_tva: 0,
    montant_paye: cmd.avance || 0,
    statut: 'Impayée',
    notes: `Facture de la commande ${cmd.numero}`,
  });

  const { data, error } = await db().from('factures').insert(facture).select('id, numero').single();
  if (error) throw error;
  return NextResponse.json({ data }, { status: 201 });
});
