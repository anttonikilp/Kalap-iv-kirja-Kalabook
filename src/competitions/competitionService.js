import { supabase } from '../lib/supabaseClient.js'

const KISAT = 'kisat'
const OSALLISTUJAT = 'kisa_osallistujat'
const KISA_SAALIIT = 'kisa_saaliit'
const JOUKKUEET = 'kisa_joukkueet'

async function nykyinenKayttaja() {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Et ole kirjautunut sisään.')
  }

  return user
}

export async function omaKayttajaId() {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user?.id ?? null
}

export async function haeOmatKisat() {
  const user = await nykyinenKayttaja()

  const { data, error } = await supabase
    .from(OSALLISTUJAT)
    .select(
      `kisa:${KISAT}(id, nimi, laji, mittari, laskentatapa, alkupaiva, loppupaiva, luoja_id, tyyppi, joukkuelaskentatapa)`
    )
    .eq('kayttaja_id', user.id)
    .eq('tila', 'accepted')

  if (error) throw error
  return data.map((rivi) => rivi.kisa).filter(Boolean)
}

export async function haeSaapuneetKutsut() {
  const user = await nykyinenKayttaja()

  const { data, error } = await supabase
    .from(OSALLISTUJAT)
    .select(
      `id, created_at, joukkue:${JOUKKUEET}(id, nimi), ` +
        `kisa:${KISAT}(id, nimi, laji, mittari, laskentatapa, alkupaiva, loppupaiva, tyyppi, joukkuelaskentatapa, luoja:profiilit(kayttajanimi, nayttonimi))`
    )
    .eq('kayttaja_id', user.id)
    .eq('tila', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function vastaaKutsuun(osallistujaId, hyvaksy) {
  const { error } = await supabase
    .from(OSALLISTUJAT)
    .update({ tila: hyvaksy ? 'accepted' : 'declined', paivitetty_at: new Date().toISOString() })
    .eq('id', osallistujaId)

  if (error) throw error
}

export async function luoKisa(tiedot) {
  const user = await nykyinenKayttaja()

  const { data, error } = await supabase
    .from(KISAT)
    .insert({
      luoja_id: user.id,
      nimi: tiedot.nimi,
      laji: tiedot.laji || null,
      mittari: tiedot.mittari,
      laskentatapa: tiedot.laskentatapa,
      alkupaiva: tiedot.alkupaiva,
      loppupaiva: tiedot.loppupaiva,
      tyyppi: tiedot.tyyppi || 'yksilo',
      joukkuelaskentatapa: tiedot.tyyppi === 'joukkue' ? tiedot.joukkuelaskentatapa : null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function haeKisanOsallistujat(kisaId) {
  const { data, error } = await supabase
    .from(OSALLISTUJAT)
    .select(
      `id, kayttaja_id, tila, joukkue_id, profiili:profiilit(kayttajanimi, nayttonimi), joukkue:${JOUKKUEET}(id, nimi)`
    )
    .eq('kisa_id', kisaId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function kutsuKaveri(kisaId, kaverinProfiiliId, joukkueId) {
  const { error } = await supabase.from(OSALLISTUJAT).insert({
    kisa_id: kisaId,
    kayttaja_id: kaverinProfiiliId,
    tila: 'pending',
    joukkue_id: joukkueId || null,
  })

  if (error) {
    if (error.code === '23505') {
      throw new Error('Kaveri on jo kutsuttu tai mukana kisassa.')
    }
    throw error
  }
}

export async function haeTulostaulukko(kisaId) {
  const { data, error } = await supabase.rpc('kisan_tulostaulukko', { p_kisa_id: kisaId })
  if (error) throw error
  return data
}

export async function haeKisanJoukkueet(kisaId) {
  const { data, error } = await supabase
    .from(JOUKKUEET)
    .select('id, nimi')
    .eq('kisa_id', kisaId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function luoJoukkue(kisaId, nimi) {
  const { data, error } = await supabase
    .from(JOUKKUEET)
    .insert({ kisa_id: kisaId, nimi })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('Kisassa on jo tämänniminen joukkue.')
    }
    throw error
  }

  return data
}

export async function asetaJoukkue(osallistujaId, joukkueId) {
  const { error } = await supabase
    .from(OSALLISTUJAT)
    .update({ joukkue_id: joukkueId || null })
    .eq('id', osallistujaId)

  if (error) throw error
}

export async function haeJoukkuetulokset(kisaId) {
  const { data, error } = await supabase.rpc('kisan_joukkuetulokset', { p_kisa_id: kisaId })
  if (error) throw error
  return data
}

function seuraavaPaiva(paivamaara) {
  const pvm = new Date(paivamaara + 'T00:00:00Z')
  pvm.setUTCDate(pvm.getUTCDate() + 1)
  return pvm.toISOString().slice(0, 10)
}

export async function haeOmatKelpoisetSaaliit(kisa) {
  const user = await nykyinenKayttaja()

  let kysely = supabase
    .from('saaliit')
    .select('id, laji, paino_kg, pituus_cm, ajankohta')
    .eq('user_id', user.id)
    .gte('ajankohta', kisa.alkupaiva)
    .lt('ajankohta', seuraavaPaiva(kisa.loppupaiva))
    .order('ajankohta', { ascending: false })

  if (kisa.laji) {
    kysely = kysely.eq('laji', kisa.laji)
  }

  const { data, error } = await kysely
  if (error) throw error
  return data
}

export async function haeLinkitetytSaalisIdt(kisaId) {
  const user = await nykyinenKayttaja()

  const { data, error } = await supabase
    .from(KISA_SAALIIT)
    .select('saalis_id')
    .eq('kisa_id', kisaId)
    .eq('kayttaja_id', user.id)

  if (error) throw error
  return new Set(data.map((rivi) => rivi.saalis_id))
}

export async function liitaSaalisKisaan(kisaId, saalisId) {
  const user = await nykyinenKayttaja()

  const { error } = await supabase
    .from(KISA_SAALIIT)
    .insert({ kisa_id: kisaId, saalis_id: saalisId, kayttaja_id: user.id })

  if (error && error.code !== '23505') {
    throw error
  }
}

export async function irrotaSaalisKisasta(kisaId, saalisId) {
  const user = await nykyinenKayttaja()

  const { error } = await supabase
    .from(KISA_SAALIIT)
    .delete()
    .eq('kisa_id', kisaId)
    .eq('saalis_id', saalisId)
    .eq('kayttaja_id', user.id)

  if (error) throw error
}
