import { useState, type FormEvent } from 'react'

type Status = 'idle' | 'sending' | 'success' | 'demo' | 'error'
const ENDPOINT = import.meta.env.VITE_WAITLIST_URL as string | undefined

export function Waitlist() {
  const [status, setStatus] = useState<Status>('idle')
  const [msg, setMsg] = useState('')

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const email = String(new FormData(e.currentTarget).get('email') ?? '').trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setStatus('error'); setMsg('That does not look like an email address. Check it and try again.'); return
    }
    setStatus('sending')
    if (!ENDPOINT) {
      // No backend configured: say so instead of pretending the email was saved.
      setStatus('demo'); return
    }
    try {
      const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      if (!res.ok) throw new Error(String(res.status))
      setStatus('success')
    } catch {
      setStatus('error'); setMsg('Something went wrong on our side. Your email was not saved. Please try again in a moment.')
    }
  }

  return (
    <section id="waitlist" data-section="waitlist" className="s-waitlist">
      <div className="s-waitlist__inner">
        <p className="eyebrow">Waitlist</p>
        <h2 className="title title--center" data-reveal="lines">Be early to a quieter night.</h2>
        {status === 'success' || status === 'demo' ? (
          <div className="success" role="status">
            <p className="success__title">{status === 'success' ? 'You are on the list.' : 'Form works. Nothing was saved.'}</p>
            <p className="micro">
              {status === 'success'
                ? 'We will email you once, when [PLACEHOLDER: launch window] opens.'
                : 'Demo mode: no waitlist endpoint is configured yet, so this email was not stored anywhere.'}
            </p>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="form">
            <label htmlFor="email" className="sr-only">Email address</label>
            <input id="email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" required aria-describedby="email-help" aria-invalid={status === 'error'} />
            <button type="submit" data-cta className="cta" disabled={status === 'sending'}>
              <span>{status === 'sending' ? 'Sending…' : 'Join the waitlist'}</span>
            </button>
            <p id="email-help" className={`micro form__help ${status === 'error' ? 'is-error' : ''}`} role={status === 'error' ? 'alert' : undefined}>
              {status === 'error' ? msg : 'One email when [PLACEHOLDER: launch window] opens. No newsletter, no sharing your address.'}
            </p>
          </form>
        )}
      </div>
    </section>
  )
}
