export const LAJIT = [
  { id: 'kuha', nimi: 'Kuha', emoji: '🐟' },
  { id: 'ahven', nimi: 'Ahven', emoji: '🐠' },
  { id: 'hauki', nimi: 'Hauki', emoji: '🐍' },
  { id: 'taimen', nimi: 'Taimen', emoji: '🐡' },
  { id: 'muu', nimi: 'Muu', emoji: '🎣' },
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
