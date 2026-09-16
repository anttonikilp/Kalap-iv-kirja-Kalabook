const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse'

/**
 * Muuntaa GPS-koordinaatit ihmisen luettavaksi paikannimeksi kaanteisella
 * geokoodauksella (OpenStreetMap Nominatim - ilmainen, ei vaadi API-avainta).
 * Palauttaa null jos jarkevaa nimea ei loydy, jolloin kutsuja paattaa
 * varakeinosta (esim. nayttaa koordinaatit).
 */
export async function haePaikannimi(lat, lon) {
  const url = `${NOMINATIM_URL}?format=jsonv2&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1&accept-language=fi`

  const vastaus = await fetch(url, {
    headers: { Accept: 'application/json' },
  })

  if (!vastaus.ok) {
    throw new Error('Paikannimen haku epäonnistui')
  }

  const data = await vastaus.json()
  return poimiNimi(data)
}

function poimiNimi(data) {
  const osoite = data?.address

  if (!osoite) {
    return ensimmainenOsa(data?.display_name)
  }

  const vesisto = osoite.water || osoite.bay || osoite.strait
  const asuinpaikka =
    osoite.village || osoite.town || osoite.city || osoite.municipality || osoite.county

  if (vesisto && asuinpaikka && vesisto !== asuinpaikka) {
    return `${vesisto}, ${asuinpaikka}`
  }

  return vesisto || asuinpaikka || ensimmainenOsa(data.display_name)
}

function ensimmainenOsa(displayName) {
  return displayName?.split(',')[0]?.trim() || null
}
