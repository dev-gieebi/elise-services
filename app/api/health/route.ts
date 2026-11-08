import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';

// Indicateur "Base de données : connectée" du pied de page
export async function GET() {
  try {
    const { error } = await db().from('clients').select('id', { count: 'exact', head: true });
    return NextResponse.json({ ok: !error });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
