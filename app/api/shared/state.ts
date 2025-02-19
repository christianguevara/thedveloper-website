// Can be enums too
export const VALID_SYSTEMS = [
  'navigation',
  'communications',
  'life_support',
  'engines',
  'deflector_shield',
] as const

type ValidSystemName = (typeof VALID_SYSTEMS)[number]

const SYSTEM_CODES: Record<ValidSystemName, string> = {
  navigation: 'NAV-01',
  communications: 'COM-02',
  life_support: 'LIFE-03',
  engines: 'ENG-04',
  deflector_shield: 'SHLD-05',
}

export const getSystemCode = (system: ValidSystemName) => {
  return SYSTEM_CODES[system]
}

let currentDamagedSystem: ValidSystemName | null = null

export const setState = (system: ValidSystemName) => {
  currentDamagedSystem = system
}

export const getState = (): ValidSystemName | null => {
  return currentDamagedSystem
}
