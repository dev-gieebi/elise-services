-- =====================================================================
--  ELISE SERVICES — Imprimerie · Floquage · Communication
--  Schéma complet de la base de données Supabase (PostgreSQL)
--
--  À exécuter UNE FOIS dans Supabase : SQL Editor > New query > coller > Run
--  Le script peut être relancé sans danger (idempotent).
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
--  UTILISATEURS (authentification propre à l'application)
-- ---------------------------------------------------------------------
create table if not exists public.utilisateurs (
  id            bigint generated always as identity primary key,
  nom           text not null,
  email         text not null unique,
  password_hash text not null,
  role          text not null default 'utilisateur'
                check (role in ('superadmin', 'utilisateur')),
  actif         boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
--  CLIENTS
-- ---------------------------------------------------------------------
create table if not exists public.clients (
  id           bigint generated always as identity primary key,
  nom          text not null,
  prenom       text,
  telephone    text not null,
  email        text,
  adresse      text,
  observations text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
--  COMMANDES (les lignes sont stockées en JSON : designation, quantite, prix_unitaire)
-- ---------------------------------------------------------------------
create table if not exists public.commandes (
  id              bigint generated always as identity primary key,
  numero          text unique,
  client_id       bigint references public.clients(id) on delete restrict,
  date_commande   date not null default current_date,
  date_livraison  date,
  type_travail    text,
  statut          text not null default 'En attente'
                  check (statut in ('En attente','En production','Terminée','Livrée','Annulée')),
  lignes          jsonb not null default '[]'::jsonb,
  montant_total   numeric(14,2) not null default 0,
  avance          numeric(14,2) not null default 0,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------
--  FACTURES
-- ---------------------------------------------------------------------
create table if not exists public.factures (
  id              bigint generated always as identity primary key,
  numero          text unique,
  client_id       bigint references public.clients(id) on delete restrict,
  commande_id     bigint references public.commandes(id) on delete set null,
  date_facture    date not null default current_date,
  date_echeance   date,
  lignes          jsonb not null default '[]'::jsonb,
  remise          numeric(14,2) not null default 0,
  taux_tva        numeric(5,2) not null default 0,
  montant_ht      numeric(14,2) not null default 0,
  montant_tva     numeric(14,2) not null default 0,
  montant_ttc     numeric(14,2) not null default 0,
  montant_paye    numeric(14,2) not null default 0,
  statut          text not null default 'Impayée'
                  check (statut in ('Impayée','Partiellement payée','Payée','Annulée')),
  mode_paiement   text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------
--  STOCKS : articles + mouvements
-- ---------------------------------------------------------------------
create table if not exists public.articles (
  id             bigint generated always as identity primary key,
  reference      text unique,
  designation    text not null,
  categorie      text,
  unite          text not null default 'unité',
  quantite       numeric(14,2) not null default 0,
  seuil_alerte   numeric(14,2) not null default 0,
  prix_achat     numeric(14,2) not null default 0,
  fournisseur    text,
  emplacement    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.mouvements_stock (
  id             bigint generated always as identity primary key,
  article_id     bigint not null references public.articles(id) on delete cascade,
  type           text not null check (type in ('Entrée','Sortie','Ajustement')),
  quantite       numeric(14,2) not null check (quantite >= 0),
  motif          text,
  commande_id    bigint references public.commandes(id) on delete set null,
  utilisateur    text,
  date_mouvement timestamptz not null default now(),
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------
--  PRODUCTION (activités d'atelier)
-- ---------------------------------------------------------------------
create table if not exists public.productions (
  id            bigint generated always as identity primary key,
  titre         text not null,
  commande_id   bigint references public.commandes(id) on delete set null,
  type_travail  text not null default 'Impression',
  machine       text,
  responsable   text,
  quantite      numeric(14,2),
  priorite      text not null default 'Normale'
                check (priorite in ('Basse','Normale','Haute','Urgente')),
  statut        text not null default 'À faire'
                check (statut in ('À faire','En cours','En pause','Terminée')),
  date_debut    date,
  date_fin      date,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
--  MAQUETTES
-- ---------------------------------------------------------------------
create table if not exists public.maquettes (
  id            bigint generated always as identity primary key,
  titre         text not null,
  client_id     bigint references public.clients(id) on delete set null,
  commande_id   bigint references public.commandes(id) on delete set null,
  designer      text,
  version       integer not null default 1,
  statut        text not null default 'Brouillon'
                check (statut in ('Brouillon','Envoyée au client','Validée','À corriger','Rejetée')),
  fichier_url   text,
  fichier_nom   text,
  description   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
--  INDEX
-- ---------------------------------------------------------------------
create index if not exists idx_commandes_client   on public.commandes(client_id);
create index if not exists idx_factures_client    on public.factures(client_id);
create index if not exists idx_factures_commande  on public.factures(commande_id);
create index if not exists idx_mvt_article        on public.mouvements_stock(article_id);
create index if not exists idx_prod_commande      on public.productions(commande_id);
create index if not exists idx_maquettes_client   on public.maquettes(client_id);

-- ---------------------------------------------------------------------
--  FONCTIONS & TRIGGERS
-- ---------------------------------------------------------------------

-- updated_at automatique
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['utilisateurs','clients','commandes','factures','articles','productions','maquettes']
  loop
    execute format('drop trigger if exists trg_%1$s_updated on public.%1$s', t);
    execute format('create trigger trg_%1$s_updated before update on public.%1$s
                    for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- Numérotation automatique : CMD-2026-0001, FAC-2026-0001, ART-0001
create or replace function public.numeroter() returns trigger
language plpgsql as $$
declare
  prefixe text := tg_argv[0];
  annee   text := to_char(current_date, 'YYYY');
  n       integer;
begin
  if new.numero is not null and new.numero <> '' then
    return new;
  end if;
  execute format(
    'select coalesce(max(split_part(numero, ''-'', 3)::int), 0) + 1 from public.%I where numero like $1',
    tg_table_name)
  into n using prefixe || '-' || annee || '-%';
  new.numero := prefixe || '-' || annee || '-' || lpad(n::text, 4, '0');
  return new;
end $$;

drop trigger if exists trg_commandes_numero on public.commandes;
create trigger trg_commandes_numero before insert on public.commandes
  for each row execute function public.numeroter('CMD');

drop trigger if exists trg_factures_numero on public.factures;
create trigger trg_factures_numero before insert on public.factures
  for each row execute function public.numeroter('FAC');

create or replace function public.reference_article() returns trigger
language plpgsql as $$
begin
  if new.reference is null or new.reference = '' then
    new.reference := 'ART-' || lpad((coalesce((select max(id) from public.articles), 0) + 1)::text, 4, '0');
  end if;
  return new;
end $$;

drop trigger if exists trg_articles_ref on public.articles;
create trigger trg_articles_ref before insert on public.articles
  for each row execute function public.reference_article();

-- Mise à jour de la quantité en stock à chaque mouvement
create or replace function public.appliquer_mouvement() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if new.type = 'Entrée' then
      update public.articles set quantite = quantite + new.quantite where id = new.article_id;
    elsif new.type = 'Sortie' then
      if (select quantite from public.articles where id = new.article_id) < new.quantite then
        raise exception 'Stock insuffisant pour cette sortie';
      end if;
      update public.articles set quantite = quantite - new.quantite where id = new.article_id;
    else -- Ajustement : la quantité saisie devient le nouveau stock
      update public.articles set quantite = new.quantite where id = new.article_id;
    end if;
  elsif tg_op = 'DELETE' then
    if old.type = 'Entrée' then
      update public.articles set quantite = quantite - old.quantite where id = old.article_id;
    elsif old.type = 'Sortie' then
      update public.articles set quantite = quantite + old.quantite where id = old.article_id;
    end if;
  end if;
  return null;
end $$;

drop trigger if exists trg_mouvements_stock on public.mouvements_stock;
create trigger trg_mouvements_stock after insert or delete on public.mouvements_stock
  for each row execute function public.appliquer_mouvement();

-- ---------------------------------------------------------------------
--  SÉCURITÉ : RLS activé sans aucune règle publique.
--  => Personne ne peut lire/écrire avec la clé "anon".
--  Seul le backend (Vercel) y accède avec la clé service_role.
-- ---------------------------------------------------------------------
alter table public.utilisateurs     enable row level security;
alter table public.clients          enable row level security;
alter table public.commandes        enable row level security;
alter table public.factures         enable row level security;
alter table public.articles         enable row level security;
alter table public.mouvements_stock enable row level security;
alter table public.productions      enable row level security;
alter table public.maquettes        enable row level security;

-- ---------------------------------------------------------------------
--  STOCKAGE DES FICHIERS DE MAQUETTES (bucket public en lecture)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('maquettes', 'maquettes', true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
--  SUPERADMIN PAR DÉFAUT
--  Email : superadmin@gmail.com   Mot de passe : password123
--  >>> Changez ce mot de passe après la première connexion. <<<
-- ---------------------------------------------------------------------
insert into public.utilisateurs (nom, email, password_hash, role)
values ('Super Admin', 'superadmin@gmail.com',
        extensions.crypt('password123', extensions.gen_salt('bf', 10)), 'superadmin')
on conflict (email) do nothing;
