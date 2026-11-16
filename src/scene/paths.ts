import { CatmullRomCurve3, Vector3 } from 'three'
import { POSES } from '../scroll/keys'

const rad = Math.PI / 180
const pos = POSES.map(([th, r, h]) => new Vector3(Math.sin(th * rad) * r, h, Math.cos(th * rad) * r))
/** camera position path */
export const camCurve = new CatmullRomCurve3(pos, false, 'catmullrom', 0.5)
/** look-at composition offsets: x = lookX, y = lookY (camera space), z = portrait-only extra lookY */
export const lookCurve = new CatmullRomCurve3(POSES.map(([, , , lx, ly, , , , pl]) => new Vector3(lx, ly, pl)), false, 'catmullrom', 0.5)
/** portrait-only extra camera distance factor in x */
export const prCurve = new CatmullRomCurve3(POSES.map((p) => new Vector3(p[9], 0, 0)), false, 'catmullrom', 0.5)
/** ring params: x = tilt, y = contact-shadow strength, z = accent glow */
export const ringCurve = new CatmullRomCurve3(POSES.map(([, , , , , tilt, ground, glow]) => new Vector3(tilt, ground, glow)), false, 'catmullrom', 0.5)
