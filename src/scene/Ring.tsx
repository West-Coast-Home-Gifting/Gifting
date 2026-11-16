import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import { Color, Group, Mesh, MeshBasicNodeMaterial, MeshPhysicalNodeMaterial, Object3D, PerspectiveCamera, Vector3 } from 'three/webgpu'
import { color, float, length, smoothstep, time, uniform, uv, vec3 } from 'three/tsl'
import { FINISHES, TOKENS } from './tokens'
import { S, clamp, damp, sectionT, smooth } from '../state'
import { ringCurve } from './paths'

const v = new Vector3()

/** Ring made of three procedural torus layers: outer shell, sensor band, battery arc. */
export function Ring() {
  const root = useRef<Group>(null!)
  const shell = useRef<Mesh>(null!)
  const sensor = useRef<Mesh>(null!)
  const battery = useRef<Mesh>(null!)
  const shadow = useRef<Mesh>(null!)
  const anchors = useRef<Object3D[]>([])
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const size = useThree((s) => s.size)

  const mats = useMemo(() => {
    const uColor = uniform(FINISHES[0].color.clone())
    const uRough = uniform(FINISHES[0].rough)
    const shellMat = new MeshPhysicalNodeMaterial({
      metalness: 1, clearcoat: 1, clearcoatRoughness: 0.06,
    })
    shellMat.colorNode = uColor
    shellMat.roughnessNode = uRough

    const sensorMat = new MeshPhysicalNodeMaterial({ metalness: 0.2, roughness: 0.35, clearcoat: 0.6 })
    sensorMat.colorNode = color(TOKENS.deep)
    const pulse = float(0.85).add(time.mul(1.3).sin().mul(0.18))
    sensorMat.emissiveNode = color(TOKENS.accent).mul(pulse.mul(1.7))

    const batteryMat = new MeshPhysicalNodeMaterial({ metalness: 0.85, roughness: 0.3, clearcoat: 0.5 })
    batteryMat.colorNode = color(TOKENS.warm)
    batteryMat.emissiveNode = color(TOKENS.warm).mul(0.45)

    const uShadow = uniform(1)
    const shadowMat = new MeshBasicNodeMaterial({ transparent: true, depthWrite: false })
    shadowMat.colorNode = vec3(0, 0, 0)
    shadowMat.opacityNode = smoothstep(0.5, 0.0, length(uv().sub(0.5))).pow(1.6).mul(0.55).mul(uShadow)
    return { uColor, uRough, uShadow, shellMat, sensorMat, batteryMat, shadowMat }
  }, [])

  useEffect(() => () => {
    mats.shellMat.dispose(); mats.sensorMat.dispose(); mats.batteryMat.dispose(); mats.shadowMat.dispose()
  }, [mats])

  const state = useRef({ spin: 0.6, px: 0, py: 0, tilt: 0.18, explode: 0, target: new Color() })

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    const st = state.current

    // damped cursor parallax
    st.px = damp(st.px, S.pointer.x, 3.2, dt)
    st.py = damp(st.py, S.pointer.y, 3.2, dt)

    const rp = ringCurve.getPoint(Math.min(1, S.u))
    st.tilt = damp(st.tilt, rp.x, 4, dt)

    const sigT = sectionT('signature')
    const sigActive = smooth(0, 0.06, sigT) * (1 - smooth(0.94, 1, sigT))
    // slow turn; near the end the ring settles face-on for the waitlist
    const settle = smooth(0.72, 0.82, S.u)
    st.spin += dt * 0.16 * (1 - sigActive * 0.85) * (1 - settle)
    const rest = Math.round(st.spin / (Math.PI * 2)) * Math.PI * 2 + 0.3
    st.spin += (rest - st.spin) * (1 - Math.exp(-3 * settle * dt))

    // explode: up 0.14->0.42, hold, back together 0.64->0.92
    const e = smooth(0.14, 0.42, sigT) * (1 - smooth(0.64, 0.92, sigT))
    st.explode = damp(st.explode, e, 8, dt)

    root.current.rotation.set(st.tilt + st.py * 0.22, st.spin + st.px * 0.4, st.px * -0.05)
    sensor.current.position.z = -st.explode * 0.95
    battery.current.position.z = 0.17 + st.explode * 1.05
    sensor.current.rotation.z = st.explode * 0.5
    battery.current.rotation.z = st.explode * -0.35 + 0.1

    // live finish swap: lerp colour and roughness
    const f = FINISHES[S.finish] ?? FINISHES[0]
    const k = 1 - Math.exp(-5 * dt)
    mats.uColor.value.lerp(f.color, k)
    mats.uRough.value += (f.rough - mats.uRough.value) * k

    // contact shadow
    mats.uShadow.value = damp(mats.uShadow.value, rp.y, 4, dt)
    shadow.current.visible = mats.uShadow.value > 0.01

    // project ring centre for cursor state + label anchors for DOM
    const W = size.width, H = size.height
    root.current.getWorldPosition(v)
    const dist = camera.position.distanceTo(v)
    const ndc = v.clone().project(camera)
    const ppu = H / (2 * dist * Math.tan((camera.fov * Math.PI) / 360))
    S.ringScreen.x = (ndc.x * 0.5 + 0.5) * W
    S.ringScreen.y = (-ndc.y * 0.5 + 0.5) * H
    S.ringScreen.r = ppu * 1.25
    const dx = S.pointerPx.x - S.ringScreen.x, dy = S.pointerPx.y - S.ringScreen.y
    S.overRing = ndc.z < 1 && dx * dx + dy * dy < S.ringScreen.r * S.ringScreen.r

    anchors.current.forEach((a, i) => {
      if (!a) return
      a.getWorldPosition(v)
      v.project(camera)
      const L = S.labels[i]
      L.x = (v.x * 0.5 + 0.5) * W
      L.y = (-v.y * 0.5 + 0.5) * H
      L.o = clamp(st.explode * 1.6 - 0.35) * (v.z < 1 ? 1 : 0)
    })
  })

  return (
    <>
      <Float speed={1.1} rotationIntensity={0.12} floatIntensity={0.35} floatingRange={[-0.05, 0.05]}>
        <group ref={root}>
          <mesh ref={shell} material={mats.shellMat}>
            <torusGeometry args={[1, 0.17, 64, 180]} />
            <object3D ref={(o) => { if (o) { o.position.set(0, -1.17, 0); anchors.current[0] = o } }} />
          </mesh>
          <mesh ref={sensor} material={mats.sensorMat}>
            <torusGeometry args={[0.835, 0.045, 24, 160]} />
            <object3D ref={(o) => { if (o) { o.position.set(-0.835, 0, 0); anchors.current[1] = o } }} />
          </mesh>
          <mesh ref={battery} material={mats.batteryMat} position={[0, 0, 0.17]} rotation={[0, 0, 0.1]}>
            <torusGeometry args={[1, 0.05, 24, 120, 3.4]} />
            <object3D ref={(o) => { if (o) { o.position.set(0, 1.0, 0); anchors.current[2] = o } }} />
          </mesh>
        </group>
      </Float>
      <mesh ref={shadow} material={mats.shadowMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.75, 0]}>
        <planeGeometry args={[4.2, 4.2]} />
      </mesh>
    </>
  )
}
