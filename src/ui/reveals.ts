import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(ScrollTrigger, SplitText)

/** Line-by-line masked reveals. Text stays in the DOM (and readable) the whole time; only its transform animates. */
export function initReveals(): () => void {
  const splits: SplitText[] = []
  const ctx = gsap.context(() => {
    document.querySelectorAll<HTMLElement>('[data-reveal="lines"]').forEach((el) => {
      const s = SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        linesClass: 'line',
        onSplit(self) {
          return gsap.from(self.lines, {
            yPercent: 115,
            duration: 1.1,
            ease: 'power4.out',
            stagger: 0.09,
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          })
        },
      })
      splits.push(s)
    })
    document.querySelectorAll<HTMLElement>('[data-reveal="fade"]').forEach((el) => {
      gsap.from(el, {
        autoAlpha: 0, y: 24, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      })
    })
  })
  // when everything has had a moment, make sure nothing is stuck mid-reveal
  return () => { ctx.revert(); splits.forEach((s) => s.revert()) }
}
