import { supabase } from '../lib/supabaseClient.js'

const TAULU = 'saaliit'
const BUCKET = 'saalis-kuvat'

export async function haeSaaliit() {
  const { data, error } = await supabase
    .from(TAULU)
    .select('*')
    .order('ajankohta', { ascending: false })

  if (error) throw error
  return data
}

export async function lisaaSaalis(saalisTiedot, kuvaTiedosto) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Et ole kirjautunut sisään.')
  }

  let kuvaUrl = null

  if (kuvaTiedosto) {
    kuvaUrl = await lataaKuva(user.id, kuvaTiedosto)
  }

  const { data, error } = await supabase
    .from(TAULU)
    .insert({
      ...saalisTiedot,
      user_id: user.id,
      kuva_url: kuvaUrl,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function poistaSaalis(id) {
  const { error } = await supabase.from(TAULU).delete().eq('id', id)
  if (error) throw error
}

async function lataaKuva(userId, tiedosto) {
  const paate = (tiedosto.name.split('.').pop() || 'jpg').toLowerCase()
  const satunnaisTunniste =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
  const polku = `${userId}/${Date.now()}-${satunnaisTunniste}.${paate}`

  const { error } = await supabase.storage.from(BUCKET).upload(polku, tiedosto, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(polku)
  return data.publicUrl
}
