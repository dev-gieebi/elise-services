'use client';

import { use, useEffect, useState } from 'react';
import { api, dateFr, fcfa, nomClient } from '@/lib/client';
import { IconPrint } from '@/components/icons';

// Facture imprimable / exportable en PDF (Imprimer > Enregistrer en PDF)
export default function FactureImprimable({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [f, setF] = useState<any>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api(`/api/r/factures/${id}`).then((r) => setF(r.data)).catch((e) => setErr(e.message));
  }, [id]);

  if (err) return <div className="print-page"><div className="alert">{err}</div></div>;
  if (!f) return <div className="print-page muted">Chargement de la facture…</div>;

  const c = f.client || {};
  const brut = (f.lignes || []).reduce((s: number, l: any) => s + l.quantite * l.prix_unitaire, 0);
  const reste = Math.max(0, Number(f.montant_ttc) - Number(f.montant_paye));

  return (
    <>
      <div className="print-bar">
        <button className="btn" onClick={() => window.close()}>Fermer</button>
        <button className="btn primary" onClick={() => window.print()}><IconPrint /> Imprimer / PDF</button>
      </div>
      <div className="print-page">
        <div className="print-head">
          <div className="brand">
            <img src="/logo.svg" alt="" />
            <div>
              <h1 style={{ fontSize: 24 }}>ELISE SERVICES</h1>
              <small>IMPRIMERIE · FLOQUAGE · COMMUNICATION</small>
            </div>
          </div>
          <div className="print-meta">
            <h2>FACTURE</h2>
            <div><b>N° {f.numero}</b></div>
            <div>Date : {dateFr(f.date_facture)}</div>
            {f.date_echeance && <div>Échéance : {dateFr(f.date_echeance)}</div>}
            {f.commande?.numero && <div>Commande : {f.commande.numero}</div>}
          </div>
        </div>

        <div className="print-parties">
          <div className="box">
            <h4>Émetteur</h4>
            <b>ELISE SERVICES</b>
            <div>Imprimerie · Floquage · Communication</div>
            <div className="muted">Libreville, Gabon</div>
          </div>
          <div className="box">
            <h4>Facturé à</h4>
            <b>{nomClient(c)}</b>
            {c.adresse && <div>{c.adresse}</div>}
            {c.telephone && <div>Tél : {c.telephone}</div>}
            {c.email && <div>{c.email}</div>}
          </div>
        </div>

        <table>
          <thead>
            <tr><th>Désignation</th><th className="right">Qté</th><th className="right">Prix unitaire</th><th className="right">Total</th></tr>
          </thead>
          <tbody>
            {(f.lignes || []).map((l: any, i: number) => (
              <tr key={i}>
                <td>{l.designation}</td>
                <td className="right">{l.quantite}</td>
                <td className="right nowrap">{fcfa(l.prix_unitaire)}</td>
                <td className="right nowrap">{fcfa(l.quantite * l.prix_unitaire)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="totaux print-tot">
          <div><span>Total des lignes</span><span>{fcfa(brut)}</span></div>
          {Number(f.remise) > 0 && <div><span>Remise</span><span>- {fcfa(f.remise)}</span></div>}
          <div><span>Total HT</span><span>{fcfa(f.montant_ht)}</span></div>
          {Number(f.taux_tva) > 0 && <div><span>TVA ({Number(f.taux_tva)} %)</span><span>{fcfa(f.montant_tva)}</span></div>}
          <div className="big"><span>Total TTC</span><span>{fcfa(f.montant_ttc)}</span></div>
          <div><span>Payé{f.mode_paiement ? ` (${f.mode_paiement})` : ''}</span><span>{fcfa(f.montant_paye)}</span></div>
          <div><b>Reste à payer</b><b>{fcfa(reste)}</b></div>
        </div>

        {f.notes && <p style={{ marginTop: 20 }}><b>Notes :</b> {f.notes}</p>}
        <div style={{ marginTop: 14 }}>Statut : <b>{f.statut}</b></div>

        <div className="print-foot">ELISE SERVICES — Votre partenaire pour tous vos projets ! · Merci de votre confiance.</div>
      </div>
    </>
  );
}
