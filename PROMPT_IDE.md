# PROMPT — Application web de gestion d'imprimerie « ELISE SERVICES »

> À coller dans ton IDE IA (Cursor, Claude Code, Windsurf, Copilot…). Joins aussi les captures d'écran de référence (Accueil + Gestion des Clients) si ton outil accepte les images.

---

## 1. Rôle et objectif

Tu es un développeur full-stack senior. Génère une **application web complète, fonctionnelle et prête à déployer** pour la gestion d'une imprimerie nommée **ELISE SERVICES** (slogan : *« Votre partenaire pour tous vos projets ! »*, activités : *Imprimerie · Floquage · Communication*, basée à Libreville, Gabon, monnaie **FCFA**).

Toute l'interface, les messages d'erreur et les commentaires sont **en français**.

## 2. Contraintes techniques (obligatoires)

| Élément | Choix |
|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript**, frontend ET backend dans le même projet (routes `app/api/**`) |
| Hébergement | **Vercel (offre gratuite)** — aucun serveur séparé |
| Base de données | **Supabase (PostgreSQL)** + **Supabase Storage** pour les fichiers de maquettes |
| Accès BDD | `@supabase/supabase-js`, **uniquement côté serveur** avec la clé `service_role` (jamais exposée au navigateur, importer `server-only`) |
| Authentification | Propre à l'application : table `utilisateurs`, mots de passe hachés **bcrypt** (`bcryptjs`), session en **JWT HS256** (`jose`) dans un cookie `httpOnly`, `sameSite=lax`, `secure` en production, durée 12 h |
| Style | CSS pur dans `app/globals.css` (pas de Tailwind, pas de librairie UI), icônes SVG maison dans `components/icons.tsx` |
| Dépendances | uniquement : `next`, `react`, `react-dom`, `@supabase/supabase-js`, `bcryptjs`, `jose`, `server-only` |

Variables d'environnement (fournir un `.env.example`) :
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=          # chaîne aléatoire ≥ 32 caractères
```

## 3. Rôles et sécurité

Deux rôles seulement :

- **superadmin** : accès à tout, y compris la rubrique **Utilisateurs** (créer, modifier, désactiver, supprimer des comptes, définir le rôle et le mot de passe).
- **utilisateur** : accès à **tout sauf** la rubrique Utilisateurs (menu masqué, page redirigée vers l'accueil, API `/api/users/**` → **403**).

Il n'y a **pas d'inscription publique** : seul le superadmin crée les comptes.

**Superadmin par défaut** (créé par le script SQL, ET recréé automatiquement par la route de login si la table `utilisateurs` est vide) :
- Email : `superadmin@gmail.com`
- Mot de passe : `password123`

Règles de sécurité à implémenter :
1. `middleware.ts` : vérifie le JWT sur toutes les pages et API (sauf `/login`, `/api/auth/login`, `/api/auth/logout`). Sans session → redirection `/login?suite=<page>` (pages) ou JSON 401 (API). `/utilisateurs` interdit aux non-superadmins.
2. Chaque route API revérifie l'utilisateur **en base** (compte actif + rôle à jour) via `requireUser()` / `requireSuperadmin()`.
3. **RLS activé** sur toutes les tables, **sans aucune policy** → la clé `anon` ne peut rien lire ; seul le backend (service_role) accède aux données.
4. On ne peut pas supprimer son propre compte, ni retirer/désactiver le **dernier superadmin actif**.
5. Chaque utilisateur peut changer **son propre** mot de passe (page « Mon compte », min. 8 caractères, mot de passe actuel requis).
6. Erreurs Postgres traduites en français (doublon 23505, élément utilisé ailleurs 23503, valeur interdite 23514, stock insuffisant) et renvoyées en **400**.

## 4. Base de données — `supabase/schema.sql`

Script **idempotent** (relançable sans erreur) à exécuter dans *Supabase > SQL Editor*. Clés primaires `bigint generated always as identity`, colonnes `created_at`/`updated_at` (trigger `set_updated_at` sur toutes les tables).

- **utilisateurs** : nom, email (unique), password_hash, role (`superadmin` | `utilisateur`), actif (bool).
- **clients** : nom*, prenom, telephone*, email, adresse, observations.
- **commandes** : numero (auto `CMD-AAAA-0001`), client_id → clients, date_commande, date_livraison, type_travail, statut (`En attente`, `En production`, `Terminée`, `Livrée`, `Annulée`), **lignes jsonb** `[{designation, quantite, prix_unitaire}]`, montant_total (calculé serveur), avance, notes.
- **factures** : numero (auto `FAC-AAAA-0001`), client_id, commande_id, date_facture, date_echeance, lignes jsonb, remise, taux_tva, montant_ht, montant_tva, montant_ttc, montant_paye, statut (`Impayée`, `Partiellement payée`, `Payée`, `Annulée`), mode_paiement, notes.
- **articles** (stock) : reference (auto `ART-0001` si vide), designation*, categorie, unite, quantite, seuil_alerte, prix_achat, fournisseur, emplacement.
- **mouvements_stock** : article_id, type (`Entrée`, `Sortie`, `Ajustement`), quantite ≥ 0, motif, commande_id, utilisateur (nom de l'auteur), date_mouvement.
  → **Trigger** : Entrée ajoute, Sortie retire (exception « Stock insuffisant » si négatif), Ajustement fixe le stock ; la suppression d'un mouvement annule son effet. La quantité d'un article ne se modifie **que** par les mouvements.
- **productions** : titre*, commande_id, type_travail, machine, responsable, quantite, priorite (`Basse`, `Normale`, `Haute`, `Urgente`), statut (`À faire`, `En cours`, `En pause`, `Terminée`), date_debut, date_fin, notes.
- **maquettes** : titre*, client_id, commande_id, designer, version, statut (`Brouillon`, `Envoyée au client`, `Validée`, `À corriger`, `Rejetée`), fichier_url, fichier_nom, description.
- Bucket Storage public **`maquettes`** créé par le script.
- Le hash du superadmin par défaut est créé avec `extensions.crypt('password123', extensions.gen_salt('bf', 10))` (pgcrypto, compatible bcryptjs).

## 5. API (routes Next.js)

- **API générique** `app/api/r/[resource]/route.ts` (GET liste, POST) et `[id]/route.ts` (GET, PUT, DELETE), pilotée par une config serveur `lib/resources.ts` (table, select avec jointures Supabase, colonnes de recherche, filtres autorisés, **liste blanche des champs modifiables**, champs obligatoires, tri, hook `prepare()` de calcul). Ressources : `clients`, `commandes`, `factures`, `articles`, `mouvements` (non modifiables, seulement création/suppression), `productions`, `maquettes`.
  - Liste : `?q=` (recherche `ilike` multi-colonnes, caractères `%,()*\` nettoyés), `?page=&size=` (pagination, `count: exact`), filtres exacts (`?statut=`…).
  - Calculs **côté serveur** : total des commandes ; pour les factures HT = lignes − remise, TVA, TTC, et **statut automatique** selon le montant payé (sauf « Annulée »).
- `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/password`.
- `GET/POST /api/users`, `PUT/DELETE /api/users/[id]` — **superadmin uniquement**.
- `POST /api/factures/depuis-commande/[id]` : crée la facture d'une commande (client, lignes, avance → montant payé) ; refuse si déjà facturée.
- `POST /api/upload` : envoi d'un fichier de maquette (≤ 4 Mo, limite Vercel) dans le bucket `maquettes`, renvoie l'URL publique. La suppression d'une maquette supprime aussi son fichier.
- `GET /api/stats` : chiffres de l'accueil. `GET /api/health` : état de la connexion BDD.

## 6. Interface — reproduire fidèlement les captures

**Mise en page commune (`components/Shell.tsx`)** :
- **Bandeau supérieur** blanc vers bleu clair, logo (fleur multicolore SVG) + « ELISE SERVICES » en gras bleu marine + sous-titre « IMPRIMERIE · FLOQUAGE · COMMUNICATION », séparateur vertical puis slogan en italique manuscrit, effet nuancier de couleurs d'imprimerie à droite.
- **Menu latéral** bleu marine dégradé, boutons arrondis avec icône : Accueil, Clients, Commandes, Facturation, Stocks, Production, Maquettes, Utilisateurs (superadmin seulement). Élément actif en bleu vif. En bas : « ELISE SERVICES — Gestion des activités ».
- **Barre d'état** en bas (collante) : pastille verte « Base de données : connectée », « Utilisateur : <nom> » (lien vers Mon compte), date, heure, bouton Déconnexion.
- **Responsive** : sous 820 px, menu en tiroir (bouton burger), formulaires sur une colonne, aucun défilement horizontal de la page.

**Accueil** : carte « Bienvenue sur ELISE SERVICES » + tuiles rondes (icône dans un cercle bleu, titre, description) pour chaque rubrique ; colonne de droite avec « Aujourd'hui » + date complète, citation (« Une bonne impression laisse toujours une trace. »), **Raccourcis** (Nouveau client, Nouvelle commande, Nouvelle facture, Nouveau travail d'atelier, Vérifier les stocks — via `?nouveau=1`). En dessous : statistiques (clients, commandes en cours, travaux en atelier, maquettes en attente, CA facturé, encaissé, reste à encaisser), 5 dernières commandes, articles sous le seuil d'alerte.

**Composant générique `components/ResourcePage.tsx`** (modèle de la capture « Gestion des Clients ») :
- Titre centré avec icône (« Gestion des Clients »).
- À gauche : carte « Liste des … » avec barre de recherche + bouton loupe bleu, filtres déroulants, bouton « + Nouveau », tableau (ligne sélectionnée surlignée en bleu), « N élément(s) trouvé(s) », pagination.
- À droite : carte « Informations du … » avec champs à icônes, astérisque rouge pour les obligatoires, boutons **Supprimer** (confirmation), **Annuler**, **Enregistrer**. Notifications toast vertes/rouges.
- Pour les formulaires larges (commandes, factures) : fenêtre modale à 2 colonnes.
- Types de champs : texte, email, tél, mot de passe, zone de texte, nombre, date, liste, **relation** (liste chargée depuis l'API), **éditeur de lignes** (désignation, qté, prix unitaire, total, ajouter/retirer), case à cocher, **fichier** (upload + aperçu image), bloc personnalisé (totaux).
- Accords en français : « Nouveau client » / « Nouvelle commande », « enregistré » / « enregistrée ».

**Pages** :
- **Clients** : ID, Nom, Prénom, Téléphone, Email ; fiche : nom*, prénom, téléphone*, email, adresse, observations.
- **Commandes** : N°, client, travail, dates, statut (badge couleur), montant, reste ; ligne rouge si livraison dépassée ; bouton **Facturer** par ligne ; totaux en direct (total, avance, reste).
- **Facturation** : N°, client, commande, date, TTC, payé, statut ; totaux en direct (lignes, remise, HT, TVA — 18 % au Gabon, 0 par défaut —, TTC, payé, reste) ; modes de paiement : Espèces, Airtel Money, Moov Money, Virement, Chèque, Carte bancaire ; bouton **Imprimer** → page `/imprimer/facture/[id]` hors menu, mise en page facture (en-tête ELISE SERVICES, émetteur/client, lignes, totaux), bouton Imprimer / PDF, CSS `@media print`.
- **Stocks** : onglets **Articles** (stock en badge rouge si ≤ seuil, champ « Stock initial » à la création qui génère une Entrée) et **Entrées / Sorties** (mouvements en lecture seule une fois créés, suppressibles).
- **Production** : travail + commande/client, type, responsable, priorité, statut, échéance (rouge si dépassée), filtres statut/priorité.
- **Maquettes** : miniature, titre, client, version, statut, date ; upload du fichier.
- **Utilisateurs** (superadmin) : nom, email, rôle, état actif, date ; mot de passe vide en modification = inchangé.
- **Mon compte** : infos + changement de mot de passe.
- **Login** : carte centrée sur fond bleu marine, logo, email + mot de passe, message d'erreur.

Palette : bleu marine `#1b3563` / `#14284d`, bleu `#2b5aa6`, fond `#e9eef6`, cartes blanches arrondies (10 px) avec ombre douce. Montants formatés `25 000 FCFA`, dates `jj/mm/aaaa`.

## 7. Livrables attendus

1. Le projet complet, qui passe `npm run build` **sans erreur**.
2. `supabase/schema.sql` (idempotent, testé).
3. `README.md` en français : création du projet Supabase, exécution du script, récupération des clés, test en local (`npm install`, `.env.local`, `npm run dev`), mise sur GitHub, import dans Vercel, ajout des 3 variables d'environnement, déploiement, première connexion et changement du mot de passe par défaut.
4. Aucune clé secrète dans le code ni dans le dépôt (`.gitignore` avec `.env*.local`).

Avant de terminer, vérifie : connexion superadmin, création d'un utilisateur, refus 403 de l'utilisateur sur `/api/users`, CRUD de chaque rubrique, numérotation automatique, facture depuis commande, mouvements de stock et refus d'une sortie supérieure au stock.
