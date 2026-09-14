import { supabase } from '../lib/supabaseClient.js'
import { haeProfiiliKayttajanimella } from './profileService.js'

const TAULU = 'kaverit'
const PROFIILIKENTAT = 'id, kayttajanimi, nayttonimi'

async function nykyinenKayttaja() {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Et ole kirjautunut sisään.')
  }

  return user
}

export async function haeSaapuneetPyynnot() {
  const user = await nykyinenKayttaja()

  const { data, error } = await supabase
    .from(TAULU)
    .select(`id, pyytaja:profiilit!kaverit_pyytaja_id_fkey(${PROFIILIKENTAT})`)
    .eq('vastaanottaja_id', user.id)
    .eq('tila', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data.map((rivi) => ({ id: rivi.id, profiili: rivi.pyytaja }))
}

export async function haeLahetetytPyynnot() {
  const user = await nykyinenKayttaja()

  const { data, error } = await supabase
    .from(TAULU)
    .select(`id, vastaanottaja:profiilit!kaverit_vastaanottaja_id_fkey(${PROFIILIKENTAT})`)
    .eq('pyytaja_id', user.id)
    .eq('tila', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data.map((rivi) => ({ id: rivi.id, profiili: rivi.vastaanottaja }))
}

export async function haeKaverit() {
  const user = await nykyinenKayttaja()

  const { data, error } = await supabase
    .from(TAULU)
    .select(
      `id, pyytaja_id, vastaanottaja_id, ` +
        `pyytaja:profiilit!kaverit_pyytaja_id_fkey(${PROFIILIKENTAT}), ` +
        `vastaanottaja:profiilit!kaverit_vastaanottaja_id_fkey(${PROFIILIKENTAT})`
    )
    .eq('tila', 'accepted')
    .or(`pyytaja_id.eq.${user.id},vastaanottaja_id.eq.${user.id}`)
    .order('paivitetty_at', { ascending: false })

  if (error) throw error

  return data.map((rivi) => ({
    id: rivi.id,
    profiili: rivi.pyytaja_id === user.id ? rivi.vastaanottaja : rivi.pyytaja,
  }))
}

export async function lahetaPyynto(kayttajanimi) {
  const user = await nykyinenKayttaja()
  const kohde = await haeProfiiliKayttajanimella(kayttajanimi)

  if (!kohde) {
    throw new Error('Käyttäjää ei löytynyt. Tarkista käyttäjänimi.')
  }

  if (kohde.id === user.id) {
    throw new Error('Et voi lisätä itseäsi kaveriksi.')
  }

  const { data, error } = await supabase
    .from(TAULU)
    .insert({ pyytaja_id: user.id, vastaanottaja_id: kohde.id })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('Olette jo kavereita tai pyyntö on jo lähetetty.')
    }
    throw error
  }

  return data
}

export async function hyvaksyPyynto(id) {
  const { error } = await supabase
    .from(TAULU)
    .update({ tila: 'accepted', paivitetty_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export async function poistaRivi(id) {
  const { error } = await supabase.from(TAULU).delete().eq('id', id)
  if (error) throw error
}
