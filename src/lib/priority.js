export const PRIORITIES = [
  {
    value: 'immediate',
    label: 'Immediate death – need the drink within minutes',
    shortLabel: 'Immediate death',
    rank: 0,
  },
  {
    value: 'casual',
    label: 'Casual – 5 min wait depending on bartender schedule',
    shortLabel: 'Casual',
    rank: 1,
  },
  {
    value: 'spanish_way',
    label: 'Spanish way – when the barman feels like it',
    shortLabel: 'Spanish way',
    rank: 2,
  },
]

export const DEFAULT_PRIORITY = 'spanish_way'

export function priorityRank(value) {
  return PRIORITIES.find((p) => p.value === value)?.rank ?? 99
}

export function priorityLabel(value) {
  return PRIORITIES.find((p) => p.value === value)?.shortLabel ?? value
}
