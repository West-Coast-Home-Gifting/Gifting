import { useState } from 'react'
import { S } from '../state'
import { FINISHES } from '../scene/tokens'
import { MagneticLink } from '../ui/Magnetic'

const COPY = [
  'Cool, bright, quiet. The finish that disappears under a sleeve.',
  'Dark and matte-leaning. Made for night and low light.',
  'Warm and soft. The one people notice, then ask about.',
]

export function Materials() {
  const [i, setI] = useState(0)
  const pick = (n: number) => { S.finish = n; setI(n) }
  return (
    <section id="materials" data-section="materials" className="s-materials">
      <div className="s-materials__col">
        <p className="eyebrow">Materials</p>
        <h2 className="title" data-reveal="lines">Choose the finish.</h2>
        <div role="radiogroup" aria-label="Ring finish" className="finishes">
          {FINISHES.map((f, n) => (
            <button
              key={f.name}
              role="radio"
              aria-checked={i === n}
              className="finish"
              onClick={() => pick(n)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); pick((n + 1) % 3) }
                if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); pick((n + 2) % 3) }
              }}
              tabIndex={i === n ? 0 : -1}
            >
              <span className="finish__name">{f.name}</span>
              <span className="finish__sw" style={{ background: `#${f.color.getHexString()}` }} aria-hidden="true" />
            </button>
          ))}
        </div>
        <p className="body" aria-live="polite">{COPY[i]} [PLACEHOLDER: real material and coating details]</p>
        <MagneticLink href="#waitlist">Join the waitlist</MagneticLink>
      </div>
    </section>
  )
}
