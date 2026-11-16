import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { InstancedMesh, Matrix4, PerspectiveCamera, PlaneGeometry, SpriteNodeMaterial, Vector3 } from 'three/webgpu'
import { color, cos, float, floor, fract, hash, instanceIndex, length, mix, sin, smoothstep, time, uniform, uv, vec2, vec3 } from 'three/tsl'
import { S, damp, sectionT, smooth } from '../state'
import { TOKENS } from './tokens'

const HALF = 6 // half-width of the wave in local units
const fwd = new Vector3()

/**
 * GPU instanced sprites. Positions are computed in a TSL position node from instanceIndex:
 * a scattered dust layout morphs into a smoothed sleep-stage staircase waveform, driven by the shared progress.
 */
export default function Particles({ count }: { count: number }) {
  const mesh = useRef<InstancedMesh>(null!)
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const size = useThree((s) => s.size)
  const u = useMemo(() => ({ morph: uniform(0), opacity: uniform(0) }), [])

  const { geo, mat } = useMemo(() => {
    const geo = new PlaneGeometry(1, 1)
    const mat = new SpriteNodeMaterial({ transparent: true, depthWrite: false })
    const i = float(instanceIndex)
    const r1 = hash(i), r2 = hash(i.add(17.13)), r3 = hash(i.add(41.7)), r4 = hash(i.add(73.9))

    const drift = vec3(sin(time.mul(0.15).add(r4.mul(6.283))), cos(time.mul(0.12).add(r1.mul(6.283))), 0).mul(0.2)
    const dust = vec3(r1.sub(0.5).mul(HALF * 2.6), r2.sub(0.5).mul(9), r3.sub(0.5).mul(6)).add(drift)

    const x = r1.sub(0.5).mul(HALF * 2)
    // smoothed staircase of sleep stages
    const v = sin(x.mul(0.5).add(0.6)).add(sin(x.mul(1.25).add(2.0)).mul(0.5)).mul(1.5)
    const stairs = floor(v).add(smoothstep(0.35, 0.65, fract(v)))
    const y = stairs.mul(0.5).add(r2.sub(0.5).mul(0.16).mul(r3.add(0.4)))
    const wave = vec3(x, y, r3.sub(0.5).mul(0.9))

    const m = smoothstep(r4.mul(0.5), r4.mul(0.5).add(0.5), u.morph)
    mat.positionNode = mix(dust, wave, m)
    mat.scaleNode = mix(float(0.05), float(0.034), m).mul(r3.mul(0.8).add(0.6))
    const round = smoothstep(0.5, 0.12, length(uv().sub(0.5)))
    mat.colorNode = mix(
      mix(color(TOKENS.mist), color(TOKENS.accent), m),
      color(TOKENS.warm),
      smoothstep(1.0, 1.7, y).mul(m),
    )
    mat.opacityNode = round.mul(mix(r3.mul(0.22).add(0.1), r3.mul(0.4).add(0.5), m)).mul(u.opacity)
    return { geo, mat }
  }, [u])

  useEffect(() => {
    const m = new Matrix4()
    for (let k = 0; k < count; k++) mesh.current.setMatrixAt(k, m)
    mesh.current.instanceMatrix.needsUpdate = true
    return () => { geo.dispose(); mat.dispose() }
  }, [count, geo, mat])

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    const sigT = sectionT('signature')
    const sciT = sectionT('science')
    const matT = sectionT('materials')
    // fade in as the signature section ends, out as the materials section starts
    const vis = smooth(0.82, 1.0, sigT) * (1 - smooth(0.02, 0.2, matT)) * (sciT >= 1 ? 1 : 1)
    u.opacity.value = damp(u.opacity.value, vis, 4, dt)
    u.morph.value = damp(u.morph.value, smooth(0.12, 0.85, sciT), 6, dt)
    const g = mesh.current
    g.visible = u.opacity.value > 0.01
    // keep the field a fixed distance in front of the camera and fit it to the viewport
    const d = 9
    camera.getWorldDirection(fwd)
    g.position.copy(camera.position).addScaledVector(fwd, d)
    g.quaternion.copy(camera.quaternion)
    const h = 2 * d * Math.tan((camera.fov * Math.PI) / 360)
    const w = h * (size.width / size.height)
    g.scale.set((w * 0.47) / HALF, h / d, 1)
  })

  return <instancedMesh ref={mesh} args={[geo, mat, count]} frustumCulled={false} />
}
