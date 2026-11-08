import { NextResponse } from 'next/server';
import { handle, requireUser } from '@/lib/auth';
import { db } from '@/lib/supabase';

// Chiffres du tableau de bord (page d'accueil)
export const GET = handle(async () => {
  await requireUser();
  const s = db();
  const head = { count: 'exact' as const, head: true };

  const [clients, cmdEnCours, prodEnCours, maqAttente, factures, articles] = await Promise.all([
    s.from('clients').select('id', head),
    s.from('commandes').select('id', head).in('statut', ['En attente', 'En production']),
    s.from('productions').select('id', head).in('statut', ['À faire', 'En cours', 'En pause']),
    s.from('maquettes').select('id', head).in('statut', ['Brouillon', 'Envoyée au client', 'À corriger']),
    s.from('factures').select('montant_ttc, montant_paye, statut').neq('statut', 'Annulée'),
    s.from('articles').select('id, designation, quantite, seuil_alerte, unite'),
  ]);

  const f = factures.data || [];
  const chiffre = f.reduce((t, x) => t + Number(x.montant_ttc), 0);
  const encaisse = f.reduce((t, x) => t + Number(x.montant_paye), 0);
  const stockBas = (articles.data || [])
    .filter((a) => Number(a.quantite) <= Number(a.seuil_alerte))
    .slice(0, 8);

  const { data: dernieres } = await s
    .from('commandes')
    .select('id, numero, statut, montant_total, date_livraison, client:clients(nom, prenom)')
    .order('id', { ascending: false })
    .limit(5);

  return NextResponse.json({
    clients: clients.count ?? 0,
    commandesEnCours: cmdEnCours.count ?? 0,
    productionsEnCours: prodEnCours.count ?? 0,
    maquettesEnAttente: maqAttente.count ?? 0,
    chiffreAffaires: chiffre,
    encaisse,
    resteAEncaisser: chiffre - encaisse,
    stockBas,
    dernieresCommandes: dernieres || [],
  });
});
