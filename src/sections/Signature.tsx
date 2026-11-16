import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { S, sectionT } from '../state'

const LAYERS = [
  { name: 'Outer shell', body: '[PLACEHOLDER: material, finishes and sizing]' },
  { name: 'Sensor band', body: 'Sits against the skin on the inside of the ring. [PLACEHOLDER: exact sensor list]' },
  { name: 'Battery arc', body: '[PLACEHOLDER: battery capacity and tested battery life]' },
]

export function Signature() {
  const labels = useRef<Array<HTMLLIElement | null>>([])
  const lines = useRef<Array<SVGLineElement | null>>([])
  const bar = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (S.poster) return
    const ys = [0, 0, 0]
    const tick = () => {
      const W = innerWidth, H = innerHeight
      const narrow = W < 820
      const pad = Math.min(80, W * 0.05)
      const boxW = narrow ? Math.min(W - pad * 2, 260) : 248
      const boxX = narrow ? pad : W - pad - boxW
      // desired y follows the anchor; then spread so boxes never overlap
      const order = [0, 1, 2].sort((a, b) => S.labels[a].y - S.labels[b].y)
      const gap = narrow ? 104 : 118
      const top = narrow ? H * 0.58 : 130
      let prev = top - gap
      order.forEach((i) => {
        const want = narrow ? top : Math.min(H - 150, Math.max(top, S.labels[i].y - 30))
        const y = Math.max(want, prev + gap)
        ys[i] = y; prev = y
      })
      for (let i = 0; i < 3; i++) {
        const el = labels.current[i], ln = lines.current[i], L = S.labels[i]
        if (!el || !ln) continue
        el.style.opacity = String(L.o)
        el.style.width = boxW + 'px'
        el.style.transform = `translate3d(${boxX}px, ${ys[i]}px, 0)`
        ln.setAttribute('x1', String(L.x)); ln.setAttribute('y1', String(L.y))
        ln.setAttribute('x2', String(boxX - 10)); ln.setAttribute('y2', String(ys[i] + 16))
        ln.style.opacity = String(L.o * 0.75)
      }
      if (bar.current) bar.current.style.transform = `scaleY(${sectionT('signature')})`
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [])

  return (
    <section id="anatomy" data-section="signature" className="s-sig">
      <div className="s-sig__pin">
        <div className="s-sig__head">
          <p className="eyebrow">Anatomy</p>
          <h2 className="title" data-reveal="lines">Three layers. One quiet object.</h2>
          <p className="body">Scroll to take it apart and put it back together.</p>
        </div>
        <svg className="s-sig__leaders" aria-hidden="true">
          {LAYERS.map((l, i) => (
            <line key={l.name} ref={(el) => { lines.current[i] = el }} x1="0" y1="0" x2="0" y2="0" />
          ))}
        </svg>
        <ul className="s-sig__labels" aria-label="Ring layers">
          {LAYERS.map((l, i) => (
            <li key={l.name} ref={(el) => { labels.current[i] = el }} className="layer-label">
              <strong>{l.name}</strong>
              <span>{l.body}</span>
            </li>
          ))}
        </ul>
        <div className="s-sig__progress" aria-hidden="true"><span ref={bar} /></div>
      </div>
    </section>
  )
}
