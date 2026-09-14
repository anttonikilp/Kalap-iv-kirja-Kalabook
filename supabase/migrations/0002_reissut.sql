-- Kalapaivakirja: reissu-kasite (migraatio 2)
-- Aja tama Supabasen SQL Editorissa. Turvallista ajaa uudelleen.

-- 1) Reissut-taulu
create table if not exists public.reissut (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  paikka text,
  aloitusaika timestamptz not null default now(),
  lopetusaika timestamptz,
  muistiinpanot text,
  created_at timestamptz not null default now(),
  constraint reissut_lopetus_aloituksen_jalkeen check (
    lopetusaika is null or lopetusaika >= aloitusaika
  )
);

create index if not exists reissut_user_id_idx on public.reissut (user_id);
create index if not exists reissut_aloitusaika_idx on public.reissut (aloitusaika desc);

-- Vain yksi kaynnissa oleva reissu kayttajaa kohden kerrallaan
create unique index if not exists reissut_yksi_aktiivinen_idx
  on public.reissut (user_id)
  where (lopetusaika is null);

alter table public.reissut enable row level security;

drop policy if exists "Kayttaja nakee omat reissut" on public.reissut;
create policy "Kayttaja nakee omat reissut"
  on public.reissut for select
  using (auth.uid() = user_id);

drop policy if exists "Kayttaja lisaa omia reissuja" on public.reissut;
create policy "Kayttaja lisaa omia reissuja"
  on public.reissut for insert
  with check (auth.uid() = user_id);

drop policy if exists "Kayttaja muokkaa omia reissuja" on public.reissut;
create policy "Kayttaja muokkaa omia reissuja"
  on public.reissut for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Kayttaja poistaa omia reissuja" on public.reissut;
create policy "Kayttaja poistaa omia reissuja"
  on public.reissut for delete
  using (auth.uid() = user_id);

-- 2) Yhdista saaliit reissuihin (valinnainen kentta)
alter table public.saaliit
  add column if not exists reissu_id uuid references public.reissut (id) on delete set null;

create index if not exists saaliit_reissu_id_idx on public.saaliit (reissu_id);

-- Paivitetaan saaliiden lisays/muokkaus-kaytannot niin etta saalis voidaan
-- liittaa vain kayttajan omaan reissuun (tai jattaa kokonaan liittamatta)
drop policy if exists "Kayttaja lisaa omia saaliita" on public.saaliit;
create policy "Kayttaja lisaa omia saaliita"
  on public.saaliit for insert
  with check (
    auth.uid() = user_id
    and (
      reissu_id is null
      or exists (
        select 1 from public.reissut r
        where r.id = reissu_id and r.user_id = auth.uid()
      )
    )
  );

drop policy if exists "Kayttaja muokkaa omia saaliita" on public.saaliit;
create policy "Kayttaja muokkaa omia saaliita"
  on public.saaliit for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      reissu_id is null
      or exists (
        select 1 from public.reissut r
        where r.id = reissu_id and r.user_id = auth.uid()
      )
    )
  );
