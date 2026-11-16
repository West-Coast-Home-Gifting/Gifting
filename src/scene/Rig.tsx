import { useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera, Vector3 } from 'three'
import { S, clamp, damp, pToU } from '../state'
import { camCurve, lookCurve, prCurve } from './paths'

const p = new Vector3()
const look = new Vector3()
const lc = new Vector3()
const right = new Vector3()
const up = new Vector3(0, 1, 0)
const target = new Vector3()

/** Camera travels along the CatmullRom path; position and look-at both sampled from the shared progress (damped). */
export function Rig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const gl = useThree((s) => s.gl)
  const size = useThree((s) => s.size)

  useFrame((_, dtRaw) => {
    // reset per-frame render stats so draw calls can be read per frame (the post pipeline renders several targets)
    ;(gl as unknown as { info: { reset(): void } }).info.reset()
    const dt = Math.min(dtRaw, 0.05)
    S.u = damp(S.u, pToU(S.p), 5.5, dt)
    const u = clamp(S.u)
    camCurve.getPoint(u, p)
    lookCurve.getPoint(u, lc)

    const asp = size.width / size.height
    const comp = clamp((asp - 0.62) / (1.35 - 0.62)) // 0 = portrait, 1 = landscape
    // keep the ring inside narrow viewports by widening the vertical fov, not by moving the path
    const fov = 2 * Math.atan(Math.tan((35 * Math.PI) / 360) * Math.max(1, 0.98 / asp)) * (180 / Math.PI)
    if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix() }

    // narrow screens: pull the camera back so the ring stays small enough to sit above the copy
    p.multiplyScalar(1 + (1 - comp) * prCurve.getPoint(u).x)
    camera.position.copy(p)
    const th = Math.atan2(p.x, p.z)
    right.set(Math.cos(th), 0, -Math.sin(th))
    // portrait: stack ring above text instead of beside it
    const lx = lc.x * comp
    const ly = lc.y + (1 - comp) * lc.z
    look.set(0, 0, 0)
    target.copy(look).addScaledVector(right, lx).addScaledVector(up, ly)
    camera.lookAt(target)
  })
  return null
}
