# ELISE SERVICES — Gestion d'imprimerie

Application web : Clients, Commandes, Facturation, Stocks, Production, Maquettes, Utilisateurs.
Next.js 15 (frontend + backend) hébergé sur **Vercel**, base de données **Supabase**.

Compte par défaut : **superadmin@gmail.com / password123**. Changez ce mot de passe dès la première connexion (lien « Utilisateur » en bas de l'écran > Mon compte).

---

## 1. Créer la base Supabase
1. Allez sur https://supabase.com, créez un compte puis **New project** (notez le mot de passe de la base, région la plus proche).
2. Menu **SQL Editor** > **New query** : collez tout le contenu de `supabase/schema.sql` puis cliquez **Run**. Le script crée les tables, les automatismes (numéros, stock), le stockage des maquettes et le superadmin.
3. Menu **Project Settings > API** : copiez la **Project URL** et la clé **service_role** (secrète).

## 2. Tester en local (facultatif)
```bash
npm install
cp .env.example .env.local   # puis remplissez les 3 valeurs
npm run dev                  # http://localhost:3000
```

## 3. Déployer sur Vercel (gratuit)
1. Mettez le dossier sur GitHub (dépôt privé conseillé). Le fichier `.env.local` n'est jamais envoyé.
2. Sur https://vercel.com : **Add New > Project**, importez le dépôt (framework détecté : Next.js).
3. Dans **Environment Variables**, ajoutez :
   - `SUPABASE_URL` : la Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` : la clé service_role
   - `JWT_SECRET` : une longue phrase aléatoire (32 caractères ou plus)
4. **Deploy**. Ouvrez l'adresse fournie et connectez-vous avec le superadmin.

Si vous modifiez une variable plus tard, faites **Redeploy** dans Vercel.

## Rôles
- **Superadmin** : accès complet, seul à gérer les utilisateurs.
- **Utilisateur** : accès à tout sauf la rubrique Utilisateurs (bloqué aussi côté serveur).

## Sécurité
- La clé service_role reste côté serveur (routes API), jamais dans le navigateur.
- RLS activé sans règle publique : la base est inaccessible avec la clé publique.
- Mots de passe hachés (bcrypt), session en cookie httpOnly de 12 h.

## Limites de l'offre gratuite
- Fichiers de maquettes : 4 Mo maximum par envoi (limite Vercel).
- Un projet Supabase gratuit se met en pause après 7 jours sans activité ; il se relance depuis le tableau de bord Supabase.

## Structure
```
app/(app)/        pages avec menu (accueil, clients, commandes…)
app/api/          backend (auth, API générique, utilisateurs, stats, upload)
app/imprimer/     facture imprimable / PDF
components/       Shell (menu), ResourcePage (liste + fiche), icônes
lib/              auth, session, Supabase, ressources, listes
supabase/         schema.sql
PROMPT_IDE.md     prompt pour régénérer le projet dans un IDE IA
```
