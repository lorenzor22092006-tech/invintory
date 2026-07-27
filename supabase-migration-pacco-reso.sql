-- Numero pacco reso: progressivo globale, condiviso tra CEO e venditori.
-- Gli SKU confermati in uno stesso reso ricevono lo stesso numero di pacco.
alter table resi add column if not exists pacco integer;
create index if not exists resi_pacco_idx on resi (pacco);
