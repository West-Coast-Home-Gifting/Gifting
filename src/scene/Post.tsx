import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RenderPipeline } from 'three/webgpu'
import { float, length, pass, screenUV, smoothstep } from 'three/tsl'
import { bloom } from 'three/addons/tsl/display/BloomNode.js'
import { film } from 'three/addons/tsl/display/FilmNode.js'
import { S } from '../state'

/**
 * Post-processing: three's built-in TSL RenderPipeline only (no postprocessing/@react-three/postprocessing).
 * One scene pass -> bloom (emissive only, via threshold) -> vignette + grain merged in the single output pass.
 */
export default function Post() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const pipe = useRef<RenderPipeline | null>(null)

  useEffect(() => {
    const rp = new RenderPipeline(gl as never)
    const scenePass = pass(scene, camera)
    const col = scenePass.getTextureNode('output')
    const bl = bloom(col, 0.5, 0.5, 0.85)
    bl.setResolutionScale(S.tier === 'high' ? 0.5 : 0.25) // mid tier: half-resolution bloom
    let out: any = col.add(bl)
    const d = length(screenUV.sub(0.5)).mul(1.3)
    out = out.mul(float(1).sub(smoothstep(0.38, 1.05, d).mul(0.5)))
    rp.outputNode = film(out, float(0.14)) as never
    pipe.current = rp
    return () => { pipe.current = null; rp.dispose?.() }
  }, [gl, scene, camera])

  // positive priority => R3F stops auto-rendering; we render through the pipeline instead
  useFrame(() => { pipe.current?.render() }, 1)
  return null
}
