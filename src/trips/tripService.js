import { supabase } from '../lib/supabaseClient.js'

const TAULU = 'reissut'

export async function haeReissut() {
  const { data, error } = await supabase
    .from(TAULU)
    .select('*')
    .order('aloitusaika', { ascending: false })

  if (error) throw error
  return data
}

export async function haeAktiivinenReissu() {
  const { data, error } = await supabase
    .from(TAULU)
    .select('*')
    .is('lopetusaika', null)
    .order('aloitusaika', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function aloitaReissu(paikka) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Et ole kirjautunut sisään.')
  }

  const { data, error } = await supabase
    .from(TAULU)
    .insert({
      user_id: user.id,
      paikka: paikka || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function lopetaReissu(id, muistiinpanot) {
  const paivitys = { lopetusaika: new Date().toISOString() }

  if (muistiinpanot !== undefined) {
    paivitys.muistiinpanot = muistiinpanot || null
  }

  const { data, error } = await supabase
    .from(TAULU)
    .update(paivitys)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
