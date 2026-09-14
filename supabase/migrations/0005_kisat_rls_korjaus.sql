-- Korjaus kisojen RLS-keharekursioon.
-- Aja tama Supabasen SQL Editorissa, jos kisojen luonti antaa virheen
-- "infinite recursion detected in policy for relation kisat".

create or replace function public.onko_kisan_luoja(p_kisa_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.kisat
    where id = p_kisa_id and luoja_id = auth.uid()
  );
$$;

create or replace function public.onko_kisan_osallistuja(p_kisa_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.kisa_osallistujat
    where kisa_id = p_kisa_id
      and kayttaja_id = auth.uid()
      and tila in ('pending', 'accepted')
  );
$$;

create or replace function public.onko_hyvaksytty_kisaosallistuja(p_kisa_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.kisa_osallistujat
    where kisa_id = p_kisa_id
      and kayttaja_id = auth.uid()
      and tila = 'accepted'
  );
$$;

revoke all on function public.onko_kisan_luoja(uuid) from public;
revoke all on function public.onko_kisan_osallistuja(uuid) from public;
revoke all on function public.onko_hyvaksytty_kisaosallistuja(uuid) from public;
grant execute on function public.onko_kisan_luoja(uuid) to authenticated;
grant execute on function public.onko_kisan_osallistuja(uuid) to authenticated;
grant execute on function public.onko_hyvaksytty_kisaosallistuja(uuid) to authenticated;

drop policy if exists "Osallistujat nakevat kisan" on public.kisat;
create policy "Osallistujat nakevat kisan"
  on public.kisat for select
  using (
    auth.uid() = luoja_id
    or public.onko_kisan_osallistuja(id)
  );

drop policy if exists "Nakee oman rivin tai oman kisan osallistujat" on public.kisa_osallistujat;
create policy "Nakee oman rivin tai oman kisan osallistujat"
  on public.kisa_osallistujat for select
  using (
    auth.uid() = kayttaja_id
    or public.onko_kisan_luoja(kisa_id)
  );

drop policy if exists "Luoja kutsuu hyvaksytyn kaverin" on public.kisa_osallistujat;
create policy "Luoja kutsuu hyvaksytyn kaverin"
  on public.kisa_osallistujat for insert
  with check (
    tila = 'pending'
    and public.onko_kisan_luoja(kisa_id)
    and exists (
      select 1 from public.kaverit c
      where c.tila = 'accepted'
        and (
          (c.pyytaja_id = auth.uid() and c.vastaanottaja_id = kisa_osallistujat.kayttaja_id)
          or (c.vastaanottaja_id = auth.uid() and c.pyytaja_id = kisa_osallistujat.kayttaja_id)
        )
    )
  );

drop policy if exists "Osallistuja liittaa oman saaliin ilmoitettavaan kisaan" on public.kisa_saaliit;
create policy "Osallistuja liittaa oman saaliin ilmoitettavaan kisaan"
  on public.kisa_saaliit for insert
  with check (
    auth.uid() = kayttaja_id
    and exists (
      select 1 from public.saaliit s
      where s.id = kisa_saaliit.saalis_id and s.user_id = auth.uid()
    )
    and public.onko_hyvaksytty_kisaosallistuja(kisa_id)
    and exists (
      select 1 from public.kisat k
      where k.id = kisa_saaliit.kisa_id and k.laskentatapa = 'ilmoitettava'
    )
  );
