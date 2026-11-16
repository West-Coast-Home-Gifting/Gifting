// Shared, non-React state. The 3D scene reads this every frame; nothing here triggers a re-render.
export type Tier = 'high' | 'mid' | 'low'

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const damp = (cur: number, target: number, lambda: number, dt: number) =>
  lerp(cur, target, 1 - Math.exp(-lambda * dt))
export const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}

export interface LabelPos { x: number; y: number; o: number }

export const S = {
  /** THE shared scroll progress, 0..1 over the whole page. Written by scroll/setup.ts only. */
  p: 0,
  /** damped camera-path parameter derived from p (0..1) */
  u: 0,
  pointer: { x: 0, y: 0 },
  pointerPx: { x: -999, y: -999 },
  finish: 0,
  overRing: false,
  ringScreen: { x: 0, y: 0, r: 0 },
  labels: [
    { x: 0, y: 0, o: 0 },
    { x: 0, y: 0, o: 0 },
    { x: 0, y: 0, o: 0 },
  ] as LabelPos[],
  /** per-section [p0, p1] where the section's own scrub range starts/ends (as fractions of p) */
  ranges: {} as Record<string, [number, number]>,
  /** p value of each camera keyframe (monotonic). length === KEY_COUNT */
  anchors: [] as number[],
  tier: 'high' as Tier,
  mobile: false,
  poster: false,
  active: true,
  stageReady: false,
}

/** local 0..1 progress inside a section's scrub range, derived from the ONE shared p */
export function sectionT(id: string): number {
  const r = S.ranges[id]
  if (!r) return 0
  return clamp((S.p - r[0]) / Math.max(1e-6, r[1] - r[0]))
}

/** map shared p to camera-path parameter u using per-keyframe anchors */
export function pToU(p: number): number {
  const a = S.anchors
  const n = a.length
  if (n < 2) return p
  if (p <= a[0]) return 0
  if (p >= a[n - 1]) return 1
  for (let i = 0; i < n - 1; i++) {
    if (p <= a[i + 1]) {
      const t = (p - a[i]) / Math.max(1e-6, a[i + 1] - a[i])
      return (i + t) / (n - 1)
    }
  }
  return 1
}

type Listener = () => void
const listeners = new Set<Listener>()
export const onActiveChange = (fn: Listener) => { listeners.add(fn); return () => { listeners.delete(fn) } }
export const setActive = (v: boolean) => { if (S.active !== v) { S.active = v; listeners.forEach((l) => l()) } }
