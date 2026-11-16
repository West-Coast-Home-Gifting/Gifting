import { Color } from 'three/webgpu'

export const TOKENS = {
  ink: '#07080C',
  deep: '#0E1220',
  mist: '#AAB4D4',
  bone: '#F2EFE9',
  accent: '#8FA8FF',
  warm: '#FFC48A',
} as const

// Finishes are derived from the six tokens (no extra palette entries)
export const FINISHES = [
  { name: 'Silver', color: new Color(TOKENS.bone).lerp(new Color(TOKENS.mist), 0.38), rough: 0.2 },
  { name: 'Graphite', color: new Color(TOKENS.ink).lerp(new Color(TOKENS.mist), 0.3), rough: 0.34 },
  { name: 'Gold', color: new Color(TOKENS.warm), rough: 0.22 },
] as const
