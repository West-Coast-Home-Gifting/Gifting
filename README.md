# LUMO RING: scroll-driven 3D landing page

Vite 8 + React 19 + TypeScript, three 0.187 (WebGPURenderer, TSL), @react-three/fiber 9.8, drei 10.7, Lenis 1.3, GSAP 3.15 (ScrollTrigger + SplitText).

## Run
    npm install
    npm run dev          # http://localhost:5173
    npm run build && npm run preview
    node tests/serve.mjs # gzip static server for dist on :4174 (used for Lighthouse)
    node tests/verify.mjs   # Playwright: 3 widths x 5 scroll stops, contrast, errors, draw calls (needs Chrome at /usr/bin/google-chrome or CHROME=...)

Debug URL flags: `?tier=high|mid|low|poster`, `?renderer=webgl|webgpu`.

## Structure
    src/state.ts            shared non-React state (ONE scroll progress `p`, damped `u`)
    src/scroll/             Lenis + ScrollTrigger -> p ; keys.ts = camera keyframes (poses)
    src/scene/              Stage (R3F Canvas, async WebGPURenderer), Ring, Env, Sky, Particles, Post, Rig, paths
    src/sections/           8 DOM sections (real text, SEO, anchors)
    src/ui/                 Cursor, MagneticLink, SplitText reveals
    src/gpu.ts              render-mode decision (poster / mid / high) before any 3D code loads
    public/fonts, public/gpu-benchmarks   self-hosted fonts and detect-gpu data
    tests/                  Playwright verify, Lighthouse server, probes

## Swap these
- Brand name: `LUMO RING` in index.html, Header, Footer, copy in sections/*.tsx
- Copy: every `[PLACEHOLDER: ...]` (materials, sensors, battery, method/studies, launch window, company, privacy)
- Colors: src/styles/tokens.css and src/scene/tokens.ts (6 tokens; finishes derive from them)
- Fonts: public/fonts + @font-face in tokens.css (Instrument Serif, Hanken Grotesk)
- Waitlist: set `VITE_WAITLIST_URL` (POST JSON {email}); without it the form shows an honest "nothing was saved" demo state
- Ring: procedural tori in scene/Ring.tsx; replace with a GLB later if you get a model
