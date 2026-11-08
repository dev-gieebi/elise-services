'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useUser } from '@/components/Shell';
import {
  IconBolt, IconCalendar, IconChevron, IconClients, IconGear, IconHome, IconImage,
  IconInvoice, IconOrders, IconStock, IconUser,
} from '@/components/icons';
import { api, badgeClass, fcfa, nomClient } from '@/lib/client';

const TUILES = [
  { href: '/clients', titre: 'Clients', texte: 'Gérez vos clients et leurs informations.', icon: IconClients },
  { href: '/commandes', titre: 'Commandes', texte: 'Enregistrez et suivez vos commandes.', icon: IconOrders },
  { href: '/facturation', titre: 'Facturation', texte: 'Éditez et gérez vos factures.', icon: IconInvoice },
  { href: '/stocks', titre: 'Stocks', texte: 'Suivez vos stocks et mouvements.', icon: IconStock },
  { href: '/production', titre: 'Production', texte: "Gérez vos productions et activités d'atelier.", icon: IconGear },
  { href: '/maquettes', titre: 'Maquettes', texte: 'Créez et suivez vos maquettes.', icon: IconImage },
  { href: '/utilisateurs', titre: 'Utilisateurs', texte: 'Gérez les utilisateurs et leurs accès.', icon: IconUser, superadmin: true },
];

const CITATIONS = [
  'Une bonne impression laisse toujours une trace.',
  'Vos idées, notre impression !',
  'La qualité se voit, la satisfaction se ressent.',
  'Chaque détail imprimé raconte votre marque.',
];

export default function Accueil() {
  const user = useUser();
  const [stats, setStats] = useState<any>(null);
  const [date, setDate] = useState('');
  const [citation, setCitation] = useState(CITATIONS[0]);

  useEffect(() => {
    const d = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    setDate(d.charAt(0).toUpperCase() + d.slice(1));
    setCitation(CITATIONS[new Date().getDate() % CITATIONS.length]);
    api('/api/stats').then(setStats).catch(() => setStats(false));
  }, []);

  const tuiles = TUILES.filter((t) => !t.superadmin || user.role === 'superadmin');

  return (
    <div className="home">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card">
          <div className="welcome">
            <div className="ic"><IconHome /></div>
            <div>
              <h2>Bienvenue sur ELISE SERVICES</h2>
              <p>Bonjour {user.nom}. Sélectionnez une rubrique pour accéder aux différentes fonctionnalités.</p>
            </div>
          </div>
          <div className="tiles">
            {tuiles.map((t) => (
              <Link key={t.href} href={t.href} className="tile">
                <div className="ic"><t.icon /></div>
                <b>{t.titre}</b>
                <span>{t.texte}</span>
              </Link>
            ))}
          </div>
        </div>

        {stats && (
          <>
            <div className="stats">
              <div className="card stat"><span>Clients</span><b>{stats.clients}</b></div>
              <div className="card stat"><span>Commandes en cours</span><b>{stats.commandesEnCours}</b></div>
              <div className="card stat"><span>Travaux en atelier</span><b>{stats.productionsEnCours}</b></div>
              <div className="card stat"><span>Maquettes en attente</span><b>{stats.maquettesEnAttente}</b></div>
            </div>
            <div className="stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <div className="card stat"><span>Chiffre d’affaires facturé</span><b>{fcfa(stats.chiffreAffaires)}</b></div>
              <div className="card stat"><span>Encaissé</span><b style={{ color: 'var(--green)' }}>{fcfa(stats.encaisse)}</b></div>
              <div className="card stat"><span>Reste à encaisser</span><b style={{ color: 'var(--red)' }}>{fcfa(stats.resteAEncaisser)}</b></div>
            </div>
            <div className="grid2">
              <div className="card">
                <div className="card-h"><IconOrders /> Dernières commandes</div>
                <div className="table-wrap">
                  <table>
                    <tbody>
                      {stats.dernieresCommandes.length === 0 && <tr><td className="empty">Aucune commande pour le moment.</td></tr>}
                      {stats.dernieresCommandes.map((c: any) => (
                        <tr key={c.id} onClick={() => (window.location.href = '/commandes')}>
                          <td className="nowrap"><b>{c.numero}</b><div className="muted" style={{ fontSize: 12 }}>{nomClient(c.client)}</div></td>
                          <td><span className={badgeClass(c.statut)}>{c.statut}</span></td>
                          <td className="right nowrap">{fcfa(c.montant_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="card">
                <div className="card-h"><IconStock /> Stocks à surveiller</div>
                <div className="table-wrap">
                  <table>
                    <tbody>
                      {stats.stockBas.length === 0 && <tr><td className="empty">Tous les stocks sont au-dessus du seuil. 👍</td></tr>}
                      {stats.stockBas.map((a: any) => (
                        <tr key={a.id} onClick={() => (window.location.href = '/stocks')}>
                          <td>{a.designation}</td>
                          <td className="right nowrap"><span className="badge red">{Number(a.quantite)} {a.unite}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
        {stats === false && <div className="alert">Impossible de charger les statistiques. Vérifiez la connexion à la base de données.</div>}
      </div>

      <aside className="card side-box">
        <div className="today">
          <IconCalendar />
          <div><span className="muted">Aujourd’hui</span><b>{date}</b></div>
        </div>
        <div className="quote">« {citation} »</div>
        <div className="shortcuts">
          <h3><IconBolt /> Raccourcis</h3>
          <Link href="/clients?nouveau=1">Nouveau client <IconChevron /></Link>
          <Link href="/commandes?nouveau=1">Nouvelle commande <IconChevron /></Link>
          <Link href="/facturation?nouveau=1">Nouvelle facture <IconChevron /></Link>
          <Link href="/production?nouveau=1">Nouveau travail d’atelier <IconChevron /></Link>
          <Link href="/stocks">Vérifier les stocks <IconChevron /></Link>
        </div>
      </aside>
    </div>
  );
}
