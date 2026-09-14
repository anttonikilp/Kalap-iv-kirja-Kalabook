import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabase-asetukset puuttuvat. Aseta ymparistomuuttujat VITE_SUPABASE_URL ja ' +
      'VITE_SUPABASE_ANON_KEY (esim. .env-tiedostoon, katso .env.example).'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
