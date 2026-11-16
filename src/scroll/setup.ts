import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { S, setActive } from '../state'
import { KEYS } from './keys'

gsap.registerPlugin(ScrollTrigger)

/** Reads layout and fills S.ranges / S.anchors. Runs on every ScrollTrigger refresh. */
function measure() {
  const vh = window.innerHeight
  const H = document.documentElement.scrollHeight
  const max = Math.max(1, H - vh)
  const ranges: Record<string, [number, number]> = {}
  document.querySelectorAll<HTMLElement>('[data-section]').forEach((el) => {
    const id = el.dataset.section!
    const top = el.getBoundingClientRect().top + window.scrollY
    const h = el.offsetHeight
    ranges[id] = [top / max, Math.min(1, (top + Math.max(h - vh, 1)) / max)]
  })
  S.ranges = ranges
  const anchors: number[] = []
  let last = -1
  for (const [id, f] of KEYS) {
    const r = ranges[id]
    let p = r ? r[0] + (r[1] - r[0]) * f : last + 0.01
    if (p <= last) p = last + 0.001
    anchors.push(p)
    last = p
  }
  anchors.push(1)
  S.anchors = anchors
}

export function initScroll(): () => void {
  const cleanups: Array<() => void> = []

  const onPointer = (e: PointerEvent) => {
    S.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
    S.pointer.y = (e.clientY / window.innerHeight) * 2 - 1
    S.pointerPx.x = e.clientX
    S.pointerPx.y = e.clientY
  }
  window.addEventListener('pointermove', onPointer, { passive: true })
  cleanups.push(() => window.removeEventListener('pointermove', onPointer))

  const onVis = () => setActive(!document.hidden)
  document.addEventListener('visibilitychange', onVis)
  cleanups.push(() => document.removeEventListener('visibilitychange', onVis))

  const lenis = new Lenis({ lerp: 0.09, smoothWheel: true, anchors: false })
  lenis.on('scroll', ScrollTrigger.update)
  const tick = (t: number) => lenis.raf(t * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)
  cleanups.push(() => { gsap.ticker.remove(tick); lenis.destroy() })

  // in-page anchor links keep working with smooth scrolling
  const onClick = (e: MouseEvent) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]')
    if (!a) return
    const id = a.getAttribute('href')!.slice(1)
    const el = id ? document.getElementById(id) : document.body
    if (!el) return
    e.preventDefault()
    lenis.scrollTo(el, { offset: 0, duration: 1.6 })
    history.replaceState(null, '', `#${id}`)
  }
  document.addEventListener('click', onClick)
  cleanups.push(() => document.removeEventListener('click', onClick))

  // THE one shared progress value
  const st = ScrollTrigger.create({
    trigger: document.documentElement,
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      S.p = self.progress
      setActive(!document.hidden)
    },
  })
  cleanups.push(() => st.kill())

  ScrollTrigger.addEventListener('refreshInit', measure)
  ScrollTrigger.addEventListener('refresh', measure)
  measure()
  const ro = new ResizeObserver(() => ScrollTrigger.refresh())
  ro.observe(document.body)
  cleanups.push(() => ro.disconnect())
  document.fonts?.ready.then(() => ScrollTrigger.refresh())
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true })
  S.p = ScrollTrigger.maxScroll(window) ? window.scrollY / ScrollTrigger.maxScroll(window) : 0

  return () => cleanups.forEach((c) => c())
}
