-- INVINTORY — Migrazione: sub-venditori (capo / fee_capo)
-- Esegui questo SQL nell'editor SQL di Supabase:
-- https://supabase.com/dashboard/project/vfzyudofffqdlzuqmhpq/sql

-- 1) chi è capo di chi (null = venditore normale, senza capo)
alter table config_venditori add column if not exists capo text;

-- 2) sulla vendita: quota che spetta al capo del sub-venditore + nome del capo
alter table vendite add column if not exists fee_capo numeric not null default 0;
alter table vendite add column if not exists capo text not null default '';
