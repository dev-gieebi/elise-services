'use client';

import { useState } from 'react';
import { api } from '@/lib/client';
import { IconKey, IconMail } from '@/components/icons';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErreur('');
    setChargement(true);
    try {
      await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      const suite = new URLSearchParams(window.location.search).get('suite');
      window.location.href = suite && suite.startsWith('/') && !suite.startsWith('//') ? suite : '/';
    } catch (err: any) {
      setErreur(err.message);
      setChargement(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card form" onSubmit={submit}>
        <div className="brand">
          <img src="/logo.svg" alt="" />
          <div>
            <h1>ELISE SERVICES</h1>
            <small>IMPRIMERIE · FLOQUAGE · COMMUNICATION</small>
          </div>
        </div>
        <p className="sub">Connectez-vous pour accéder à la gestion des activités.</p>
        {erreur && <div className="alert">{erreur}</div>}
        <div className="field">
          <label><IconMail /> Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus autoComplete="username" />
        </div>
        <div className="field">
          <label><IconKey /> Mot de passe</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </div>
        <button className="btn primary" disabled={chargement} style={{ padding: '11px' }}>
          {chargement ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}
