import { Suspense, lazy, useEffect, useState } from 'react'
import { S } from './state'
import { initScroll } from './scroll/setup'
import { initReveals } from './ui/reveals'
import { Cursor } from './ui/Cursor'
import { Header } from './sections/Header'
import { Hero } from './sections/Hero'
import { Problem } from './sections/Problem'
import { Signature } from './sections/Signature'
import { Science } from './sections/Science'
import { Materials } from './sections/Materials'
import { How } from './sections/How'
import { Waitlist } from './sections/Waitlist'
import { Footer } from './sections/Footer'

const Stage = lazy(() => import('./scene/Stage'))

export function App() {
  const [mountStage, setMountStage] = useState(false)

  useEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const stops: Array<() => void> = []
    if (!S.poster && !reduced) {
      stops.push(initScroll())
      stops.push(initReveals())
    } else {
      // static page: pointer drives a tiny CSS parallax on the poster ring only
      const el = document.documentElement
      const on = (e: PointerEvent) => {
        el.style.setProperty('--px', String((e.clientX / innerWidth - 0.5) * 2))
        el.style.setProperty('--py', String((e.clientY / innerHeight - 0.5) * 2))
      }
      if (!reduced) addEventListener('pointermove', on, { passive: true })
      stops.push(() => removeEventListener('pointermove', on))
    }
    // load the 3D chunk only after first paint and when idle: keeps LCP on the real DOM headline
    if (!S.poster) {
      let done = false
      const go = () => { if (!done) { done = true; setMountStage(true) } }
      if (S.mobile) {
        // phones: the CSS hero ring is already on screen, so download and start the 3D scene only once the person
        // engages (first scroll, touch or key), with a long fallback for people who just look.
        const evs = ['scroll', 'touchstart', 'pointerdown', 'keydown'] as const
        const t = window.setTimeout(go, 15000)
        const on = () => { go(); evs.forEach((e) => removeEventListener(e, on)); clearTimeout(t) }
        evs.forEach((e) => addEventListener(e, on, { once: true, passive: true }))
        stops.push(() => { evs.forEach((e) => removeEventListener(e, on)); clearTimeout(t) })
      } else {
        const w = window as unknown as { requestIdleCallback?: (cb: () => void, o?: object) => number }
        if (w.requestIdleCallback) w.requestIdleCallback(go, { timeout: 1200 })
        else setTimeout(go, 300)
      }
    }
    return () => stops.forEach((s) => s())
  }, [])

  return (
    <>
      <div id="stage" aria-hidden="true">
        {mountStage && !S.poster && (
          <Suspense fallback={null}>
            <Stage />
          </Suspense>
        )}
      </div>
      <Cursor />
      <Header />
      <main>
        <Hero />
        <Problem />
        <Signature />
        <Science />
        <Materials />
        <How />
        <Waitlist />
      </main>
      <Footer />
    </>
  )
}
