import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { S, sectionT } from '../state'

const STEPS = [
  { n: '01', t: 'Put it on', b: 'Wear it to bed like any ring. After first setup there is nothing to pair, charge or check each night.' },
  { n: '02', t: 'Sleep', b: 'It records quietly. Nothing buzzes, nothing lights up, nothing asks for your attention.' },
  { n: '03', t: 'Read one line', b: 'In the morning you get one plain sentence on how you recovered and what to change. [PLACEHOLDER: describe the app or summary]' },
]

export function How() {
  const line = useRef<HTMLSpanElement>(null)
  const items = useRef<Array<HTMLLIElement | null>>([])
  useEffect(() => {
    if (S.poster) return
    const tick = () => {
      const t = sectionT('how')
      if (line.current) line.current.style.setProperty('--t', String(t))
      items.current.forEach((el, i) => {
        if (!el) return
        const on = t >= i / 3 - 0.02
        if (el.dataset.on !== String(on)) el.dataset.on = String(on)
      })
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [])
  return (
    <section id="how" data-section="how" className="s-how">
      <div className="s-how__pin">
        <div>
          <p className="eyebrow">How it works</p>
          <h2 className="title" data-reveal="lines">Three steps. One of them is sleeping.</h2>
        </div>
        <div className="timeline">
          <span className="timeline__line" ref={line} aria-hidden="true" />
          <ol>
            {STEPS.map((s, i) => (
              <li key={s.n} ref={(el) => { items.current[i] = el }} data-on={S.poster ? 'true' : i === 0 ? 'true' : 'false'}>
                <span className="timeline__n">{s.n}</span>
                <h3>{s.t}</h3>
                <p>{s.b}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
