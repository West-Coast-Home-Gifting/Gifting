import { Suspense, lazy, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { WebGPURenderer } from 'three/webgpu'
import { Env } from './Env'
import { Sky } from './Sky'
import { Ring } from './Ring'
import { Rig } from './Rig'
import { S, onActiveChange } from '../state'

// below-the-fold scene work is code-split and mounted only once the user scrolls towards it
const Particles = lazy(() => import('./Particles'))
const Post = lazy(() => import('./Post'))

/** WebGPU only when a real (non-software) GPU adapter exists; otherwise three's WebGL 2 backend. */
async function wantWebGL(): Promise<boolean> {
  const q = new URLSearchParams(location.search).get('renderer')
  if (q === 'webgl') return true
  if (q === 'webgpu') return false
  const gpu = (navigator as unknown as { gpu?: { requestAdapter(o?: object): Promise<{ isFallbackAdapter?: boolean; info?: Record<string, string> } | null> } }).gpu
  if (!gpu) return true
  try {
    const a = await gpu.requestAdapter({ powerPreference: 'high-performance' })
    if (!a || a.isFallbackAdapter) return true
    const i = a.info ?? {}
    return /swiftshader|llvmpipe|software|microsoft basic/i.test(`${i.vendor} ${i.architecture} ${i.description}`)
  } catch { return true }
}

async function createRenderer(props: Record<string, unknown>) {
  const forceWebGL = await wantWebGL()
  // WebGPURenderer falls back to its WebGL 2 backend by itself when WebGPU is unavailable
  const r = new WebGPURenderer({ ...(props as object), antialias: !S.mobile, powerPreference: 'high-performance', forceWebGL } as never)
  await r.init()
  ;(r as unknown as { info: { autoReset: boolean } }).info.autoReset = false // Rig resets once per frame so we count the whole post pipeline
  ;(window as unknown as { __backend?: string }).__backend = (r as unknown as { backend?: { isWebGPUBackend?: boolean } }).backend?.isWebGPUBackend ? 'webgpu' : 'webgl2'
  return r as never
}

export default function Stage() {
  const [active, setActive] = useState(S.active)
  const [near, setNear] = useState(false)
  useEffect(() => onActiveChange(() => setActive(S.active)), [])
  useEffect(() => {
    const id = window.setInterval(() => { if (S.p > 0.06) { setNear(true); window.clearInterval(id) } }, 250)
    return () => window.clearInterval(id)
  }, [])
  const dprMax = S.mobile ? 1.5 : 2
  const count = S.tier === 'high' ? 9000 : 4500

  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, dprMax]}
      gl={createRenderer as never}
      camera={{ fov: 35, near: 0.1, far: 80, position: [0, 0.35, 5] }}
      onCreated={({ gl }) => { (window as unknown as { __gl?: unknown }).__gl = gl; S.stageReady = true; document.documentElement.classList.add('stage-ready') }}
      aria-hidden="true"
    >
      <Sky />
      <Env />
      <Rig />
      <Ring />
      <Suspense fallback={null}>
        {near && <Particles count={count} />}
        {!S.mobile && S.tier !== 'low' && <Post />}
      </Suspense>
    </Canvas>
  )
}
