-- Kalapaivakirja: tietokantarakenne ja tietoturva
-- Aja tama kokonaisuudessaan Supabasen SQL Editorissa:
-- Supabase-projekti -> SQL Editor -> New query -> liita koko sisalto -> Run.

-- 1) Saaliit-taulu
create table if not exists public.saaliit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  laji text not null check (laji in ('kuha', 'ahven', 'hauki', 'taimen', 'muu')),
  paino_kg numeric(6, 2) check (paino_kg is null or paino_kg > 0),
  pituus_cm numeric(6, 1) check (pituus_cm is null or pituus_cm > 0),
  ajankohta timestamptz not null default now(),
  sijainti_teksti text,
  latitude double precision,
  longitude double precision,
  viehe text,
  kalastustapa text check (
    kalastustapa is null or kalastustapa in (
      'heitto', 'vetouistelu', 'jigaus', 'pilkinta', 'perhokalastus'
    )
  ),
  kuva_url text,
  muistiinpanot text,
  created_at timestamptz not null default now()
);

create index if not exists saaliit_user_id_idx on public.saaliit (user_id);
create index if not exists saaliit_ajankohta_idx on public.saaliit (ajankohta desc);

-- 2) Row Level Security: jokainen kayttaja nakee ja muokkaa vain omia saaliitaan
alter table public.saaliit enable row level security;

drop policy if exists "Kayttaja nakee omat saaliit" on public.saaliit;
create policy "Kayttaja nakee omat saaliit"
  on public.saaliit for select
  using (auth.uid() = user_id);

drop policy if exists "Kayttaja lisaa omia saaliita" on public.saaliit;
create policy "Kayttaja lisaa omia saaliita"
  on public.saaliit for insert
  with check (auth.uid() = user_id);

drop policy if exists "Kayttaja muokkaa omia saaliita" on public.saaliit;
create policy "Kayttaja muokkaa omia saaliita"
  on public.saaliit for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Kayttaja poistaa omia saaliita" on public.saaliit;
create policy "Kayttaja poistaa omia saaliita"
  on public.saaliit for delete
  using (auth.uid() = user_id);

-- 3) Kuvien tallennustila (storage bucket)
insert into storage.buckets (id, name, public)
values ('saalis-kuvat', 'saalis-kuvat', true)
on conflict (id) do nothing;

-- Kuvat tallennetaan polkuun {kayttajan_id}/tiedostonimi, joten RLS voi
-- tarkistaa polun ensimmaisesta osasta, etta kuva kuuluu kirjautuneelle kayttajalle.

drop policy if exists "Kuka tahansa voi katsoa saaliskuvia" on storage.objects;
create policy "Kuka tahansa voi katsoa saaliskuvia"
  on storage.objects for select
  using (bucket_id = 'saalis-kuvat');

drop policy if exists "Kayttaja lataa omia kuvia" on storage.objects;
create policy "Kayttaja lataa omia kuvia"
  on storage.objects for insert
  with check (
    bucket_id = 'saalis-kuvat'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Kayttaja muokkaa omia kuvia" on storage.objects;
create policy "Kayttaja muokkaa omia kuvia"
  on storage.objects for update
  using (
    bucket_id = 'saalis-kuvat'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Kayttaja poistaa omia kuvia" on storage.objects;
create policy "Kayttaja poistaa omia kuvia"
  on storage.objects for delete
  using (
    bucket_id = 'saalis-kuvat'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
