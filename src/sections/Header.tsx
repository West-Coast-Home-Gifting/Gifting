import { MagneticLink } from '../ui/Magnetic'

export function Header() {
  return (
    <header className="site-header">
      <a href="#top" className="wordmark" aria-label="LUMO RING, back to top">LUMO<span> RING</span></a>
      <MagneticLink href="#waitlist" className="cta--small">Join the waitlist</MagneticLink>
    </header>
  )
}
