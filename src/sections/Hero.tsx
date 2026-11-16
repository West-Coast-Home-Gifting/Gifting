import { MagneticLink } from '../ui/Magnetic'

export function Hero() {
  return (
    <section id="top" data-section="hero" className="s-hero">
      <div className="poster-ring" aria-hidden="true" />
      <div className="s-hero__copy">
        <p className="eyebrow">A smart ring for sleep and recovery</p>
        <h1 className="display" data-reveal="lines">Sleep, without the noise.</h1>
        <p className="lede">
          LUMO RING reads the night and says one plain thing about it. No score to chase, no screen to check, nothing to wear on your wrist.
        </p>
        <div className="cta-row">
          <MagneticLink href="#waitlist">Join the waitlist</MagneticLink>
          <span className="micro">One email at launch. [PLACEHOLDER: launch window]</span>
        </div>
      </div>
      <a href="#problem" className="scroll-hint" aria-label="Scroll to the next section"><span />Scroll</a>
    </section>
  )
}
