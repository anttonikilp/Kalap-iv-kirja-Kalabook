import { supabase } from '../lib/supabaseClient.js'

const TAULU = 'ilmoitukset'

async function nykyinenKayttaja() {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Et ole kirjautunut sisään.')
  }

  return user
}

export async function haeIlmoitukset(maara = 30) {
  const { data, error } = await supabase
    .from(TAULU)
    .select('id, tyyppi, teksti, viittaus_tyyppi, viittaus_id, luettu, created_at')
    .order('created_at', { ascending: false })
    .limit(maara)

  if (error) throw error
  return data
}

export async function haeLukemattomienMaara() {
  const { count, error } = await supabase
    .from(TAULU)
    .select('id', { count: 'exact', head: true })
    .eq('luettu', false)

  if (error) throw error
  return count ?? 0
}

export async function merkitseLuetuksi(id) {
  const { error } = await supabase.from(TAULU).update({ luettu: true }).eq('id', id)
  if (error) throw error
}

export async function merkitseKaikkiLuetuiksi() {
  const user = await nykyinenKayttaja()

  const { error } = await supabase
    .from(TAULU)
    .update({ luettu: true })
    .eq('vastaanottaja_id', user.id)
    .eq('luettu', false)

  if (error) throw error
}

/**
 * Palauttaa valilehden johon ilmoitusta painamalla siirrytaan, tai null jos
 * ilmoitukselle ei (viela) ole omaa nakymaa. "kaverin_saalis"-tyyppisille
 * ilmoituksille ei ole viela kohdetta, koska kaverien saaliita ei nayteta
 * missaan omana listanaan (friends-ominaisuus rajattiin tietoisesti vain
 * yhteyksien luontiin).
 */
export function kohdeValilehti(ilmoitus) {
  if (ilmoitus.viittaus_tyyppi === 'kaveri') return 'kaverit'
  if (ilmoitus.viittaus_tyyppi === 'kisa') return 'kisat'
  return null
}
