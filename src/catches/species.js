export const LAJIT = [
  { id: 'kuha', nimi: 'Kuha' },
  { id: 'ahven', nimi: 'Ahven' },
  { id: 'hauki', nimi: 'Hauki' },
  { id: 'taimen', nimi: 'Taimen' },
  { id: 'muu', nimi: 'Muu' },
]

export const KALASTUSTAVAT = [
  { id: 'heitto', nimi: 'Heittokalastus' },
  { id: 'vetouistelu', nimi: 'Vetouistelu' },
  { id: 'jigaus', nimi: 'Jigaus' },
  { id: 'pilkinta', nimi: 'Pilkintä' },
  { id: 'perhokalastus', nimi: 'Perhokalastus' },
]

export function lajinNimi(id) {
  return LAJIT.find((laji) => laji.id === id)?.nimi ?? id
}

export function kalastustavanNimi(id) {
  return KALASTUSTAVAT.find((tapa) => tapa.id === id)?.nimi ?? id
}
