'use client';

// Page générique « liste + fiche » utilisée par toutes les rubriques
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/client';
import { IconList, IconPlus, IconSave, IconSearch, IconTrash, IconUndo } from './icons';
import LignesEditor from './LignesEditor';

export type Column = {
  key: string;
  label: string;
  render?: (row: any) => React.ReactNode;
  className?: string;
};

export type Field = {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'password' | 'textarea' | 'number' | 'date' | 'datetime'
    | 'select' | 'relation' | 'lignes' | 'checkbox' | 'file' | 'custom';
  icon?: React.ComponentType<any>;
  required?: boolean;
  options?: (string | { value: string; label: string })[];
  relation?: { resource: string; label: (r: any) => string; filter?: (r: any) => boolean };
  placeholder?: string;
  hint?: string;
  full?: boolean;
  step?: string;
  onlyNew?: boolean;           // affiché uniquement à la création
  render?: (form: any, set: (patch: any) => void) => React.ReactNode;
};

export type ResourceConfig = {
  resource: string;            // nom pour /api/r/[resource]
  apiBase?: string;            // base d'API différente (ex : /api/users)
  title: string;               // "Liste des clients"
  singular: string;            // "client"
  formTitle: string;           // "Informations du client"
  formIcon?: React.ComponentType<any>;
  feminin?: boolean;           // accords : « Nouvelle commande », « enregistrée »
  searchPlaceholder: string;
  columns: Column[];
  fields: Field[];
  defaults: () => any;
  wide?: boolean;              // formulaire dans une fenêtre large (lignes…)
  pageSize?: number;
  filters?: { name: string; label: string; options: string[] }[];
  readOnlyExisting?: boolean;  // éléments existants non modifiables (mouvements)
  rowClass?: (row: any) => string;
  rowActions?: (row: any, ctx: { reload: () => void; notify: (m: string, ok?: boolean) => void }) => React.ReactNode;
  toForm?: (row: any) => any;  // transforme une ligne en données de formulaire
  afterCreate?: (row: any, form: any) => Promise<void>;
  canDelete?: (row: any) => boolean;
  extraToolbar?: React.ReactNode;
};

export default function ResourcePage({ config, refreshKey = 0 }: { config: ResourceConfig; refreshKey?: number }) {
  const fe = config.feminin ? 'e' : '';
  const base = config.apiBase || `/api/r/${config.resource}`;
  const size = config.pageSize || 10;

  const [rows, setRows] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [qApplied, setQApplied] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<any>(config.defaults());
  const [selected, setSelected] = useState<any>(null);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ m: string; ok: boolean } | null>(null);
  const [options, setOptions] = useState<Record<string, any[]>>({});
  const toastTimer = useRef<any>(null);

  const notify = useCallback((m: string, ok = true) => {
    setToast({ m, ok });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams({ page: String(page), size: String(size) });
      if (qApplied) sp.set('q', qApplied);
      Object.entries(filters).forEach(([k, v]) => v && sp.set(k, v));
      const r = await api(`${base}?${sp}`);
      setRows(r.data || []);
      setCount(r.count || 0);
    } catch (e: any) {
      notify(e.message, false);
    } finally {
      setLoading(false);
    }
  }, [base, page, size, qApplied, filters, notify]);

  useEffect(() => { load(); }, [load, refreshKey]);

  // Listes déroulantes liées (clients, commandes, articles…)
  const relKey = Array.from(new Set(config.fields.filter((f) => f.type === 'relation').map((f) => f.relation!.resource))).join(',');
  const loadOptions = useCallback(async () => {
    if (!relKey) return;
    const res: Record<string, any[]> = {};
    await Promise.all(relKey.split(',').map(async (r) => {
      try { res[r] = (await api(`/api/r/${r}?size=500`)).data || []; } catch { res[r] = []; }
    }));
    setOptions(res);
  }, [relKey]);
  useEffect(() => { loadOptions(); }, [loadOptions]);

  // Ouverture directe d'une fiche vierge via ?nouveau=1 (raccourcis de l'accueil)
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('nouveau')) nouveau();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (patch: any) => setForm((f: any) => ({ ...f, ...patch }));

  function nouveau() {
    setSelected(null);
    setForm(config.defaults());
    if (config.wide) setModal(true);
  }

  function choisir(row: any) {
    setSelected(row);
    const data = config.toForm ? config.toForm(row) : { ...row };
    setForm({ ...config.defaults(), ...data });
    if (config.wide) setModal(true);
  }

  function annuler() {
    if (selected) choisir(selected);
    else setForm(config.defaults());
    if (config.wide) setModal(false);
  }

  const lectureSeule = !!(selected && config.readOnlyExisting);

  async function enregistrer(e?: React.FormEvent) {
    e?.preventDefault();
    if (lectureSeule) return;
    for (const f of config.fields) {
      if (f.onlyNew && selected) continue;
      const v = form[f.name];
      if (f.required && (v === null || v === undefined || String(v).trim() === '')) {
        notify(`Le champ « ${f.label} » est obligatoire.`, false);
        return;
      }
    }
    setSaving(true);
    try {
      if (selected) {
        const r = await api(`${base}/${selected.id}`, { method: 'PUT', body: JSON.stringify(form) });
        notify(`${cap(config.singular)} modifié${fe} avec succès.`);
        setSelected(r.data);
        setForm({ ...config.defaults(), ...(config.toForm ? config.toForm(r.data) : r.data) });
      } else {
        const r = await api(base, { method: 'POST', body: JSON.stringify(form) });
        if (config.afterCreate) await config.afterCreate(r.data, form);
        notify(`${cap(config.singular)} enregistré${fe} avec succès.`);
        setSelected(null);
        setForm(config.defaults());
      }
      if (config.wide) setModal(false);
      await load();
      loadOptions();
    } catch (err: any) {
      notify(err.message, false);
    } finally {
      setSaving(false);
    }
  }

  async function supprimer() {
    if (!selected) return;
    if (!confirm(`Supprimer définitivement ${config.feminin ? 'cette' : 'ce'} ${config.singular} ? Cette action est irréversible.`)) return;
    try {
      await api(`${base}/${selected.id}`, { method: 'DELETE' });
      notify(`${cap(config.singular)} supprimé${fe}.`);
      setSelected(null);
      setForm(config.defaults());
      if (config.wide) setModal(false);
      await load();
      loadOptions();
    } catch (err: any) {
      notify(err.message, false);
    }
  }

  const pages = Math.max(1, Math.ceil(count / size));
  const FormIcon = config.formIcon;

  const formCard = (
    <form className="card" onSubmit={enregistrer}>
      <div className="card-h">
        {FormIcon && <FormIcon />} {selected ? config.formTitle : `${config.feminin ? 'Nouvelle' : 'Nouveau'} ${config.singular}`}
        {config.wide && (
          <button type="button" className="btn sm" style={{ marginLeft: 'auto' }} onClick={() => setModal(false)}>Fermer</button>
        )}
      </div>
      <div className="card-b form">
        <div className={config.wide ? 'form-grid' : 'form'}>
          {config.fields
            .filter((f) => !(f.onlyNew && selected))
            .map((f) => (
              <div key={f.name} className={`field ${f.full || f.type === 'lignes' || f.type === 'custom' ? 'full' : ''}`}>
                {f.type !== 'checkbox' && f.type !== 'custom' && (
                  <label>{f.icon && <f.icon />} {f.label} {f.required && <span className="req">*</span>}</label>
                )}
                <Input field={f} form={form} set={set} options={options} disabled={lectureSeule} notify={notify} />
                {f.hint && <div className="hint">{f.hint}</div>}
              </div>
            ))}
        </div>
        <div className="form-actions">
          {selected && (!config.canDelete || config.canDelete(selected)) ? (
            <button type="button" className="btn danger" onClick={supprimer}><IconTrash /> Supprimer</button>
          ) : <span />}
          {!lectureSeule && (
            <div className="grp">
              <button type="button" className="btn" onClick={annuler}><IconUndo /> Annuler</button>
              <button className="btn primary" disabled={saving}><IconSave /> {saving ? 'Enregistrement…' : 'Enregistrer'}</button>
            </div>
          )}
        </div>
      </div>
    </form>
  );

  return (
    <>
      <div className={config.wide ? '' : 'split'}>
        <div className="card">
          <div className="card-h"><IconList /> {config.title}</div>
          <div className="toolbar">
            <form className="search" onSubmit={(e) => { e.preventDefault(); setPage(1); setQApplied(q); }}>
              <IconSearch />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={config.searchPlaceholder} />
              <button aria-label="Rechercher"><IconSearch /></button>
            </form>
            {config.filters?.map((f) => (
              <select key={f.name} value={filters[f.name] || ''}
                onChange={(e) => { setPage(1); setFilters({ ...filters, [f.name]: e.target.value }); }}>
                <option value="">{f.label} : tous</option>
                {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ))}
            {config.extraToolbar}
            <button className="btn primary" onClick={nouveau}><IconPlus /> Nouveau</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {config.columns.map((c) => <th key={c.key} className={c.className}>{c.label}</th>)}
                  {config.rowActions && <th />}
                </tr>
              </thead>
              <tbody>
                {loading && rows.length === 0 ? (
                  <tr><td className="empty" colSpan={config.columns.length + 1}>Chargement…</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td className="empty" colSpan={config.columns.length + 1}>Aucun résultat.</td></tr>
                ) : rows.map((row) => (
                  <tr key={row.id} onClick={() => choisir(row)}
                    className={`${selected?.id === row.id ? 'sel' : ''} ${config.rowClass ? config.rowClass(row) : ''}`}>
                    {config.columns.map((c) => (
                      <td key={c.key} className={c.className}>{c.render ? c.render(row) : row[c.key] ?? ''}</td>
                    ))}
                    {config.rowActions && (
                      <td className="right nowrap" onClick={(e) => e.stopPropagation()}>
                        {config.rowActions(row, { reload: load, notify })}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-foot">
            <span>{count} {config.singular}{count > 1 ? 's' : ''} trouvé{fe}{count > 1 ? 's' : ''}</span>
            <div className="pager">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Précédent">‹</button>
              <span className="cur">{page}</span>
              <span className="muted">/ {pages}</span>
              <button disabled={page >= pages} onClick={() => setPage(page + 1)} aria-label="Suivant">›</button>
            </div>
          </div>
        </div>

        {!config.wide && formCard}
      </div>

      {config.wide && modal && (
        <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">{formCard}</div>
        </div>
      )}

      {toast && <div className={`toast ${toast.ok ? 'ok' : 'err'}`}>{toast.m}</div>}
    </>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function Input({ field: f, form, set, options, disabled, notify }: {
  field: Field; form: any; set: (p: any) => void; options: Record<string, any[]>; disabled: boolean;
  notify: (m: string, ok?: boolean) => void;
}) {
  const v = form[f.name];
  const [upl, setUpl] = useState(false);

  switch (f.type) {
    case 'custom':
      return <>{f.render!(form, set)}</>;
    case 'textarea':
      return <textarea value={v ?? ''} placeholder={f.placeholder} disabled={disabled} onChange={(e) => set({ [f.name]: e.target.value })} />;
    case 'select':
      return (
        <select value={v ?? ''} disabled={disabled} onChange={(e) => set({ [f.name]: e.target.value })}>
          {!f.required && <option value="">—</option>}
          {f.options!.map((o) => {
            const val = typeof o === 'string' ? o : o.value;
            const lab = typeof o === 'string' ? o : o.label;
            return <option key={val} value={val}>{lab}</option>;
          })}
        </select>
      );
    case 'relation': {
      const list = (options[f.relation!.resource] || []).filter(f.relation!.filter || (() => true));
      return (
        <select value={v ?? ''} disabled={disabled} onChange={(e) => set({ [f.name]: e.target.value ? Number(e.target.value) : null })}>
          <option value="">{f.placeholder || '— Choisir —'}</option>
          {list.map((r) => <option key={r.id} value={r.id}>{f.relation!.label(r)}</option>)}
        </select>
      );
    }
    case 'lignes':
      return <LignesEditor value={v || []} onChange={(l) => set({ [f.name]: l })} disabled={disabled} />;
    case 'checkbox':
      return (
        <label className="check">
          <input type="checkbox" checked={!!v} disabled={disabled} onChange={(e) => set({ [f.name]: e.target.checked })} style={{ width: 'auto' }} />
          {f.label}
        </label>
      );
    case 'file':
      return (
        <div>
          {form.fichier_url && (
            <div style={{ marginBottom: 8 }}>
              {/\.(png|jpe?g|gif|webp|svg)$/i.test(form.fichier_url) && (
                <img src={form.fichier_url} alt="" style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 8, border: '1px solid var(--line)', display: 'block', marginBottom: 6 }} />
              )}
              <a href={form.fichier_url} target="_blank" rel="noreferrer" style={{ color: 'var(--blue-600)', fontWeight: 600 }}>
                📎 {form.fichier_nom || 'Ouvrir le fichier'}
              </a>{' '}
              {!disabled && <button type="button" className="btn sm" onClick={() => set({ fichier_url: null, fichier_nom: null })}>Retirer</button>}
            </div>
          )}
          {!disabled && (
            <input type="file" disabled={upl} accept="image/*,.pdf,.ai,.psd,.cdr,.eps,.svg"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUpl(true);
                try {
                  const fd = new FormData();
                  fd.append('file', file);
                  const r = await api('/api/upload', { method: 'POST', body: fd });
                  set({ fichier_url: r.url, fichier_nom: r.nom });
                  notify('Fichier envoyé.');
                } catch (err: any) {
                  notify(err.message, false);
                } finally {
                  setUpl(false);
                  e.target.value = '';
                }
              }} />
          )}
          {upl && <div className="hint">Envoi en cours…</div>}
        </div>
      );
    default:
      return (
        <input
          type={f.type === 'datetime' ? 'datetime-local' : f.type || 'text'}
          step={f.step}
          value={v ?? ''}
          placeholder={f.placeholder}
          disabled={disabled}
          autoComplete={f.type === 'password' ? 'new-password' : undefined}
          onChange={(e) => set({ [f.name]: e.target.value })}
        />
      );
  }
}
