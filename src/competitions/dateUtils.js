export function muotoilePaiva(pvm) {
  return new Date(pvm + 'T00:00:00').toLocaleDateString('fi-FI', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  })
}

export function tanaan() {
  return new Date().toISOString().slice(0, 10)
}

export function kisanTila(kisa) {
  const paiva = tanaan()
  if (paiva < kisa.alkupaiva) return 'tuleva'
  if (paiva > kisa.loppupaiva) return 'paattynyt'
  return 'kaynnissa'
}
