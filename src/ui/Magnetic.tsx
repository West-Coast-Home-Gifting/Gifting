import { useEffect, useRef, type ReactNode } from 'react'
import { gsap } from 'gsap'
import { S } from '../state'

/** CTA link/button that drifts toward the cursor. Disabled for touch and reduced motion. */
export function MagneticLink({ href, children, className = '' }: { href: string; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLAnchorElement>(null)
  useEffect(() => {
    if (S.poster || matchMedia('(pointer: coarse)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const n = ref.current!
    const qx = gsap.quickTo(n, 'x', { duration: 0.5, ease: 'elastic.out(1,0.5)' })
    const qy = gsap.quickTo(n, 'y', { duration: 0.5, ease: 'elastic.out(1,0.5)' })
    const move = (e: PointerEvent) => {
      const r = n.getBoundingClientRect()
      qx((e.clientX - (r.left + r.width / 2)) * 0.28)
      qy((e.clientY - (r.top + r.height / 2)) * 0.4)
    }
    const leave = () => { qx(0); qy(0) }
    n.addEventListener('pointermove', move); n.addEventListener('pointerleave', leave)
    return () => { n.removeEventListener('pointermove', move); n.removeEventListener('pointerleave', leave) }
  }, [])
  return <a ref={ref} href={href} data-cta className={`cta ${className}`}><span>{children}</span></a>
}
