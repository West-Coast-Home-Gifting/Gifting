import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { color, float, floor, fract, hash, length, mix, mx_noise_float, screenUV, smoothstep, time, uniform, vec2, vec3, dot } from 'three/tsl'
import { S, damp } from '../state'
import { ringCurve } from './paths'
import { TOKENS } from './tokens'

/** One full-screen TSL node: noise gradient + faint stars + the waitlist accent glow. Used as scene.backgroundNode. */
export function Sky() {
  const scene = useThree((s) => s.scene)
  const size = useThree((s) => s.size)
  const u = useMemo(() => ({ asp: uniform(1), glow: uniform(0), shift: uniform(0) }), [])

  useEffect(() => {
    const uv = screenUV
    const asp = u.asp
    const n = mx_noise_float(vec3(uv.mul(vec2(asp.mul(1.7), 1.7)), time.mul(0.025)))
    const vertical = float(1).sub(uv.y).pow(1.6).mul(0.85).add(n.mul(0.12)).add(u.shift.mul(0.12))
    let bg: any = mix(color(TOKENS.ink), color(TOKENS.deep), vertical.clamp(0, 1))

    // faint stars on a jittered grid, round and twinkling
    const grid = uv.mul(vec2(asp, 1)).mul(190)
    const cell = floor(grid)
    const seed = dot(cell, vec2(1, 157.31))
    const present = hash(seed).step(0.9955)
    const round = smoothstep(0.34, 0.0, length(fract(grid).sub(0.5)))
    const twinkle = float(0.55).add(float(0.45).mul(time.mul(hash(seed.add(3)).mul(1.6).add(0.4)).add(seed).sin()))
    bg = bg.add(color(TOKENS.mist).mul(present.mul(round).mul(twinkle).mul(0.2)))

    // waitlist glow, centred a little above the middle
    const d = length(uv.sub(vec2(0.5, 0.58)).mul(vec2(asp, 1)))
    const glow = smoothstep(0.75, 0.0, d).pow(2.2).mul(u.glow)
    bg = bg.add(color(TOKENS.accent).mul(glow.mul(0.5)))

    scene.backgroundNode = bg
    return () => { scene.backgroundNode = null }
  }, [scene, u])

  useFrame((_, dt) => {
    u.asp.value = size.width / size.height
    const g = ringCurve.getPoint(S.u).z
    u.glow.value = damp(u.glow.value, g, 3, dt)
    u.shift.value = S.u
  })
  return null
}
