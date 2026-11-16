import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { Color, DoubleSide, Mesh, MeshBasicNodeMaterial, PMREMGenerator, PlaneGeometry, Scene } from 'three/webgpu'
import { color } from 'three/tsl'
import { TOKENS } from './tokens'

/**
 * Studio reflections without a downloaded HDRI: a tiny offscreen scene of soft emissive strip lights,
 * baked once through PMREM into scene.environment. (drei's Environment/Lightformer build their cube
 * target through WebGL-only paths, so this is the WebGPU-safe equivalent.)
 */
export function Env() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)

  useEffect(() => {
    const envScene = new Scene()
    envScene.background = new Color(TOKENS.mist).multiplyScalar(0.07)
    const geos: PlaneGeometry[] = []
    const mats: MeshBasicNodeModuleMat[] = []
    const strip = (w: number, h: number, pos: [number, number, number], hex: string, k: number) => {
      const g = new PlaneGeometry(w, h)
      const m = new MeshBasicNodeMaterial({ side: DoubleSide })
      m.colorNode = color(hex).mul(k)
      const mesh = new Mesh(g, m)
      mesh.position.set(...pos)
      mesh.lookAt(0, 0, 0)
      envScene.add(mesh)
      geos.push(g)
      mats.push(m)
    }
    strip(10, 3.6, [0, 6.5, 1.5], TOKENS.bone, 3.6) // top softbox
    strip(1.6, 10, [-6.5, 0.5, 2], TOKENS.accent, 2.4) // cool left strip
    strip(1.6, 10, [6.5, 0.2, 1], TOKENS.warm, 1.5) // warm right strip
    strip(12, 2.4, [0, -1.5, -7], TOKENS.mist, 2.0) // low rear rim
    strip(9, 9, [0, -6.5, 0], TOKENS.mist, 0.7) // floor bounce
    strip(9, 5, [0, 1.5, 7], TOKENS.bone, 1.7) // soft front fill

    const pmrem = new PMREMGenerator(gl as never)
    const rt = pmrem.fromScene(envScene, 0.035)
    scene.environment = rt.texture
    scene.environmentIntensity = 1

    return () => {
      scene.environment = null
      rt.dispose()
      pmrem.dispose()
      geos.forEach((g) => g.dispose())
      mats.forEach((m) => m.dispose())
    }
  }, [gl, scene])
  return null
}
type MeshBasicNodeModuleMat = MeshBasicNodeMaterial
