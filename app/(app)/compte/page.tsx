'use client';

import { useState } from 'react';
import PageTitle from '@/components/PageTitle';
import { useUser } from '@/components/Shell';
import { IconKey, IconSave, IconUser } from '@/components/icons';
import { api } from '@/lib/client';

export default function ComptePage() {
  const user = useUser();
  const [f, setF] = useState({ actuel: '', nouveau: '', confirmation: '' });
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (f.nouveau !== f.confirmation) return setMsg({ t: 'La confirmation ne correspond pas au nouveau mot de passe.', ok: false });
    setSaving(true);
    try {
      await api('/api/auth/password', { method: 'POST', body: JSON.stringify(f) });
      setMsg({ t: 'Mot de passe modifié avec succès.', ok: true });
      setF({ actuel: '', nouveau: '', confirmation: '' });
    } catch (err: any) {
      setMsg({ t: err.message, ok: false });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageTitle icon={IconUser}>Mon compte</PageTitle>
      <div className="grid2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="card-h"><IconUser /> Mes informations</div>
          <div className="card-b form">
            <div><span className="muted">Nom</span><div><b>{user.nom}</b></div></div>
            <div><span className="muted">Email</span><div><b>{user.email}</b></div></div>
            <div><span className="muted">Rôle</span><div><b>{user.role === 'superadmin' ? 'Super administrateur' : 'Utilisateur'}</b></div></div>
          </div>
        </div>
        <form className="card" onSubmit={submit}>
          <div className="card-h"><IconKey /> Changer mon mot de passe</div>
          <div className="card-b form">
            {msg && <div className={msg.ok ? 'badge green' : 'alert'} style={msg.ok ? { padding: 10, borderRadius: 8 } : undefined}>{msg.t}</div>}
            <div className="field"><label>Mot de passe actuel</label>
              <input type="password" required value={f.actuel} onChange={(e) => setF({ ...f, actuel: e.target.value })} autoComplete="current-password" /></div>
            <div className="field"><label>Nouveau mot de passe</label>
              <input type="password" required minLength={8} value={f.nouveau} onChange={(e) => setF({ ...f, nouveau: e.target.value })} autoComplete="new-password" />
              <div className="hint">Au moins 8 caractères.</div></div>
            <div className="field"><label>Confirmer le nouveau mot de passe</label>
              <input type="password" required value={f.confirmation} onChange={(e) => setF({ ...f, confirmation: e.target.value })} autoComplete="new-password" /></div>
            <div className="form-actions"><span />
              <button className="btn primary" disabled={saving}><IconSave /> {saving ? 'Enregistrement…' : 'Enregistrer'}</button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
