'use client';

import { fcfa } from '@/lib/client';

export type Ligne = { designation: string; quantite: number | string; prix_unitaire: number | string };

export const totalLignes = (l: Ligne[]) =>
  (l || []).reduce((s, x) => s + (Number(x.quantite) || 0) * (Number(x.prix_unitaire) || 0), 0);

// Saisie des lignes d'une commande ou d'une facture
export default function LignesEditor({ value, onChange, disabled }: {
  value: Ligne[]; onChange: (l: Ligne[]) => void; disabled?: boolean;
}) {
  const lignes = value || [];
  const maj = (i: number, patch: Partial<Ligne>) => onChange(lignes.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  return (
    <div className="lignes">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ minWidth: 220 }}>Désignation (travail, support, format…)</th>
              <th style={{ width: 90 }}>Qté</th>
              <th style={{ width: 130 }}>Prix unitaire</th>
              <th style={{ width: 130 }} className="right">Total</th>
              <th style={{ width: 34 }} />
            </tr>
          </thead>
          <tbody>
            {lignes.length === 0 && (
              <tr><td colSpan={5} className="empty">Aucune ligne. Cliquez sur « Ajouter une ligne ».</td></tr>
            )}
            {lignes.map((l, i) => (
              <tr key={i}>
                <td><input value={l.designation} disabled={disabled} placeholder="Ex : Flyers A5 quadri 135 g"
                  onChange={(e) => maj(i, { designation: e.target.value })} /></td>
                <td><input type="number" min="0" step="any" value={l.quantite} disabled={disabled}
                  onChange={(e) => maj(i, { quantite: e.target.value })} /></td>
                <td><input type="number" min="0" step="any" value={l.prix_unitaire} disabled={disabled}
                  onChange={(e) => maj(i, { prix_unitaire: e.target.value })} /></td>
                <td className="right nowrap">{fcfa((Number(l.quantite) || 0) * (Number(l.prix_unitaire) || 0))}</td>
                <td>{!disabled && <button type="button" className="x" title="Retirer" onClick={() => onChange(lignes.filter((_, j) => j !== i))}>×</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!disabled && (
        <button type="button" className="add" onClick={() => onChange([...lignes, { designation: '', quantite: 1, prix_unitaire: 0 }])}>
          + Ajouter une ligne
        </button>
      )}
    </div>
  );
}
