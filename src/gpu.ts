import { S, type Tier } from './state'

/** Decide render mode before any 3D code is downloaded. */
export async function decideMode(): Promise<void> {
  const q = new URLSearchParams(location.search)
  S.mobile = matchMedia('(pointer: coarse)').matches || innerWidth < 768
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const forced = q.get('tier') as Tier | 'poster' | null
  if (forced === 'poster' || (reduced && forced == null)) { S.poster = true; S.tier = 'low'; return }
  if (forced === 'high' || forced === 'mid' || forced === 'low') {
    S.tier = forced; S.poster = forced === 'low'; return
  }

  // software renderers (SwiftShader / llvmpipe) cannot run this scene, go to the poster
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2', { failIfMajorPerformanceCaveat: true })
    if (!gl) { S.poster = true; S.tier = 'low'; return }
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    const name = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : ''
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    if (/swiftshader|llvmpipe|software|basic render/i.test(name)) { S.poster = true; S.tier = 'low'; return }
  } catch { S.poster = true; S.tier = 'low'; return }

  // detect-gpu (the engine behind drei's useDetectGPU) with self-hosted benchmark data
  let tier: Tier = 'mid'
  try {
    const { getGPUTier } = await import('detect-gpu')
    const r = await Promise.race([
      getGPUTier({ benchmarksURL: '/gpu-benchmarks' }),
      new Promise<null>((res) => setTimeout(() => res(null), 2500)),
    ])
    if (r) tier = r.tier >= 3 ? 'high' : r.tier === 2 ? 'mid' : 'low'
    else tier = (navigator.hardwareConcurrency ?? 4) >= 8 && !S.mobile ? 'high' : 'mid'
  } catch { tier = 'mid' }
  if (S.mobile && tier === 'high') tier = 'mid'
  S.tier = tier
  S.poster = tier === 'low'
}
