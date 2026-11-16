// One camera keyframe per entry. [sectionId, fraction of that section's scrub range].
// Order = camera travel order. u advances evenly between keyframes.
export const KEYS: Array<[string, number]> = [
  ['hero', 0],
  ['problem', 0],
  ['signature', 0],
  ['signature', 1 / 3],
  ['signature', 2 / 3],
  ['science', 0],
  ['science', 0.85], // hold the science pose while the waveform forms
  ['materials', 0],
  ['how', 0],
  ['waitlist', 1],
]

// theta (deg, orbit angle), radius, height, lookX, lookY (composition offsets in camera space),
// tilt (ring x-rotation), ground (contact shadow strength), glow (waitlist accent glow),
// pl (extra lookY applied only in portrait), pr (extra camera distance in portrait, 0.25 = 25% farther)
// last row = page end (footer)
export const POSES: number[][] = [
  //  theta  r     h     lx     ly    tilt  ground glow  pl    pr
  [0, 6.0, 0.35, -1.6, 0.0, 0.18, 1.0, 0.0, -2.4, 0.5], // hero: ring right of headline
  [-14, 8.6, 0.9, -2.7, 0.25, 0.95, 0.3, 0.0, -1.0, 0.25], // problem: tilts and recedes
  [-6, 7.4, 0.5, 0.9, 0.7, 0.35, 0.0, 0.0, -0.95, 0.25], // signature 0
  [62, 6.8, 1.0, 0.9, 0.7, 0.35, 0.0, 0.0, -0.95, 0.25], // signature 1/3
  [142, 6.6, 0.6, 0.9, 0.7, 0.35, 0.0, 0.0, -0.95, 0.25], // signature 2/3
  [232, 10.5, 0.3, 3.2, 0.0, 0.5, 0.0, 0.0, 0.0, 0.25], // science: ring small, off to the side of the field
  [236, 10.5, 0.3, 3.2, 0.0, 0.5, 0.0, 0.0, 0.0, 0.25], // science hold
  [330, 5.8, 0.3, 1.5, 0.0, 0.25, 0.6, 0.0, -1.2, 0.25], // materials: ring left
  [352, 9.0, 1.0, -2.6, 0.0, 0.25, 0.0, 0.0, 0.0, 0.25], // how: ring parked right
  [360, 8.6, 0.2, 0.0, -1.1, 0.12, 1.0, 1.0, -0.4, 0.25], // waitlist: settles above the form, glow
  [360, 9.0, 0.3, 0.0, -1.1, 0.12, 0.6, 0.55, -0.4, 0.25], // footer
]
