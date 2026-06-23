-- INVINTORY — Schema Supabase
-- Esegui questo SQL nell'editor SQL di Supabase: https://supabase.com/dashboard/project/vfzyudofffqdlzuqmhpq/sql

create table if not exists stock (
  sku text primary key,
  numero_ordine text not null default '',
  data_ordine text not null default '',
  prezzo_acquisto text not null default '',
  scadenza_reso text not null default '',
  esito text not null default 'In stock',
  id_modello text not null default '',
  taglia text not null default '',
  created_at timestamptz default now()
);

create table if not exists vendite (
  id bigserial primary key,
  sku text not null,
  id_modello text not null default '',
  taglia text not null default '',
  data_vendita text not null default '',
  prezzo_acquisto numeric not null default 0,
  prezzo_vendita numeric not null default 0,
  guadagno_lordo numeric not null default 0,
  venditore text not null default '',
  fee numeric not null default 0,
  guadagno_netto numeric not null default 0,
  nota text not null default '',
  created_at timestamptz default now()
);

create table if not exists config_venditori (
  nome text primary key,
  fee_percentuale numeric not null default 0
);

create table if not exists config_categorie (
  nome text primary key
);

create table if not exists taglie_stock (
  id_modello text primary key,
  categoria text not null default '',
  foto_url text not null default ''
);

create table if not exists pagamenti_venditori (
  id bigserial primary key,
  venditore text not null,
  importo numeric not null,
  data text not null default '',
  nota text not null default '',
  created_at timestamptz default now()
);

-- Disabilita RLS su tutte le tabelle (usiamo service role key lato server)
alter table stock disable row level security;
alter table vendite disable row level security;
alter table config_venditori disable row level security;
alter table config_categorie disable row level security;
alter table taglie_stock disable row level security;
alter table pagamenti_venditori disable row level security;
