import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { S } from '../state'

/** One custom cursor with one state change: it grows over the ring and over the CTA. Fine pointers only. */
export function Cursor() {
  const el = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (S.poster || matchMedia('(pointer: coarse)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const node = el.current!
    document.documentElement.classList.add('has-cursor')
    const qx = gsap.quickTo(node, 'x', { duration: 0.35, ease: 'power3.out' })
    const qy = gsap.quickTo(node, 'y', { duration: 0.35, ease: 'power3.out' })
    let state = ''
    const move = (e: PointerEvent) => {
      qx(e.clientX); qy(e.clientY)
      const t = e.target as HTMLElement
      const next = t.closest('a,button,input,[data-cta]') ? 'cta' : S.overRing ? 'ring' : ''
      if (next !== state) { state = next; node.dataset.state = next }
    }
    // the ring moves without the pointer, so also re-evaluate on ticks
    const tick = () => {
      if (state === 'cta') return
      const next = S.overRing ? 'ring' : ''
      if (next !== state) { state = next; node.dataset.state = next }
    }
    gsap.ticker.add(tick)
    addEventListener('pointermove', move, { passive: true })
    return () => {
      removeEventListener('pointermove', move); gsap.ticker.remove(tick)
      document.documentElement.classList.remove('has-cursor')
    }
  }, [])
  return <div ref={el} className="cursor" data-state="" aria-hidden="true"><span /></div>
}
