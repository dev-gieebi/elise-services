'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import type { SessionUser } from '@/lib/session';
import { api } from '@/lib/client';
import {
  IconCalendar, IconClients, IconClock, IconGear, IconHome, IconImage, IconInvoice,
  IconKey, IconLogout, IconMenu, IconOrders, IconPrint, IconStock, IconUser,
} from './icons';

export const MENU = [
  { href: '/', label: 'Accueil', icon: IconHome },
  { href: '/clients', label: 'Clients', icon: IconClients },
  { href: '/commandes', label: 'Commandes', icon: IconOrders },
  { href: '/facturation', label: 'Facturation', icon: IconInvoice },
  { href: '/stocks', label: 'Stocks', icon: IconStock },
  { href: '/production', label: 'Production', icon: IconGear },
  { href: '/maquettes', label: 'Maquettes', icon: IconImage },
  { href: '/utilisateurs', label: 'Utilisateurs', icon: IconUser, superadmin: true },
];

const UserCtx = createContext<SessionUser | null>(null);
export const useUser = () => useContext(UserCtx)!;

export default function Shell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [dbOk, setDbOk] = useState<boolean | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30000);
    api('/api/health').then((r) => setDbOk(r.ok)).catch(() => setDbOk(false));
    return () => clearInterval(t);
  }, []);

  useEffect(() => setOpen(false), [path]);

  async function logout() {
    await api('/api/auth/logout', { method: 'POST' }).catch(() => {});
    window.location.href = '/login';
  }

  const items = MENU.filter((m) => !m.superadmin || user.role === 'superadmin');

  return (
    <UserCtx.Provider value={user}>
      <div className="app">
        <header className="topbar">
          <Link href="/" className="brand">
            <img src="/logo.svg" alt="" />
            <div>
              <h1>ELISE SERVICES</h1>
              <small>IMPRIMERIE · FLOQUAGE · COMMUNICATION</small>
            </div>
          </Link>
          <div className="slogan">Votre partenaire<br />pour tous vos projets !</div>
          <button className="burger" onClick={() => setOpen(!open)} aria-label="Menu"><IconMenu width={22} height={22} /></button>
        </header>

        <div className="body">
          <nav className={`sidebar ${open ? 'open' : ''}`}>
            {items.map((m) => {
              const active = m.href === '/' ? path === '/' : path.startsWith(m.href);
              const I = m.icon;
              return (
                <Link key={m.href} href={m.href} className={`nav-item ${active ? 'active' : ''}`}>
                  <I /> {m.label}
                </Link>
              );
            })}
            <div className="sidebar-foot">
              <IconPrint width={30} height={30} />
              <div>
                <b>ELISE SERVICES</b>
                <span>Gestion des activités</span>
              </div>
            </div>
          </nav>
          <main className="main">{children}</main>
        </div>

        <footer className="statusbar">
          <span className="si">
            <i className={`dot ${dbOk === null ? '' : dbOk ? 'ok' : 'ko'}`} />
            <span className="hide-sm">Base de données : </span>
            {dbOk === null ? 'vérification…' : dbOk ? 'connectée' : 'non connectée'}
          </span>
          <span className="sp" />
          <Link href="/compte" className="si" title="Mon compte">
            <IconUser /> <span className="hide-sm">Utilisateur :</span> {user.nom}
            {user.role === 'superadmin' && <span className="hide-sm">(superadmin)</span>}
          </Link>
          <Link href="/compte" className="si hide-sm" title="Changer mon mot de passe"><IconKey /></Link>
          {now && (
            <>
              <span className="si hide-sm"><IconCalendar /> {now.toLocaleDateString('fr-FR')}</span>
              <span className="si"><IconClock /> {now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
            </>
          )}
          <button onClick={logout} className="si"><IconLogout /> <span className="hide-sm">Déconnexion</span></button>
        </footer>
      </div>
    </UserCtx.Provider>
  );
}
