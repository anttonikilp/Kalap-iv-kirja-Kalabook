import { supabase } from '../lib/supabaseClient.js'

const TAULU = 'profiilit'

async function nykyinenKayttaja() {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Et ole kirjautunut sisään.')
  }

  return user
}

export async function haeOmaProfiili() {
  const user = await nykyinenKayttaja()

  const { data, error } = await supabase
    .from(TAULU)
    .select('id, kayttajanimi, nayttonimi')
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function haeProfiiliKayttajanimella(kayttajanimi) {
  const siistitty = kayttajanimi.trim().toLowerCase()

  const { data, error } = await supabase
    .from(TAULU)
    .select('id, kayttajanimi, nayttonimi')
    .eq('kayttajanimi', siistitty)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function asetaKayttajanimi(kayttajanimi, nayttonimi) {
  const user = await nykyinenKayttaja()
  const siistitty = kayttajanimi.trim().toLowerCase()

  const { data, error } = await supabase
    .from(TAULU)
    .update({
      kayttajanimi: siistitty,
      nayttonimi: nayttonimi?.trim() || null,
    })
    .eq('id', user.id)
    .select('id, kayttajanimi, nayttonimi')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('Käyttäjänimi on jo varattu. Valitse toinen.')
    }
    throw error
  }

  return data
}
