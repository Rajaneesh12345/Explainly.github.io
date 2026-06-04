# Explainly — Web Site

Marketing and app pages for the **Explainly Chrome extension** (AI text-explanation tool). Hosted on GitHub Pages via Jekyll. No build step — raw HTML/CSS/JS files served as-is.

---

## What the repo is

This is the **public web site**, not the Chrome extension source. It has two concerns:

1. **Marketing pages** — landing page, pricing, legal pages. Visible to anyone.
2. **App pages** (`app/`) — authenticated web UI: sign-in, account, library, upgrade. Loaded by the extension and directly.

---

## File map

```
index.html            Landing page (new design — css/landing.css + js/landing.js)
pricing.html          Standalone pricing page (OLD inline-style design — not yet migrated)
privacy.html          Privacy policy (new design)
terms.html            Terms of service (new design)
refund.html           Refund policy (new design)
demo.html             Interactive demo page
success.html          Post-payment success redirect page

app/
  login.html          Google OAuth sign-in page
  account.html        Account dashboard (tier, usage, sign-out)
  library.html        Saved explanations library
  upgrade.html        Upgrade / payment page (old design)

auth/
  callback.html       Supabase OAuth callback — exchanges code for session tokens

css/
  landing.css         Design system for index + legal pages (dark/light, glassmorphism, starfield)
  legal.css           Additional styles for legal pages (card, callout, guarantee banner, tabs)
  app.css             Separate styles for app/* pages

js/
  config.js           Global constants: backend URL, Supabase keys, payment links, tier limits
  auth.js             Auth helpers: sign-in, sign-out, token storage, refresh
  api.js              apiFetch() wrapper: attaches Bearer token, handles 401 refresh
  landing.js          Landing page interactions: starfield canvas, theme toggle, pricing toggle,
                      typewriter, highlight→popup simulation, scroll reveal

icons/
  icon-192.png        PWA / favicon
  icon-512.png        PWA icon
  icon16.png          Small extension icon (16×16) used in demo mocks
  logo-indigo.png     Accent-coloured Explainly logo (default)
  logo-navy.png       …navy accent variant
  logo-slate.png      …slate accent variant
  logo-abyss.png      …abyss (cyan) accent variant
  logo-forest.png     …forest (green) accent variant
```

---

## CSS architecture — two separate systems

### System 1 — Landing / Legal  (`css/landing.css` + `css/legal.css`)
Used by: `index.html`, `privacy.html`, `terms.html`, `refund.html`

- **Fonts** (Google Fonts): Space Grotesk (display headings), Manrope (body), JetBrains Mono (labels/mono)
- **Theming** via `data-*` attributes on `<html>`:
  - `data-theme="dark|light"` — persisted in `localStorage` key `explainly-theme`
  - `data-accent="indigo|navy|slate|abyss|forest"` — sets `--a1`, `--a2`, `--a-glow` CSS vars
  - `data-font="techy|humanist|rounded"` — swaps the `--display` font family
- Default: `data-theme="dark" data-accent="indigo" data-font="techy"`
- Key tokens: `--bg`, `--ink`, `--surface`, `--line`, `--a1`, `--a2`, `--a-glow`, `--shadow`, `--glass`
- Background layers: `<canvas id="starfield">` (animated star field) + `.bg-aura` (radial gradient) — both `position:fixed`, `z-index:0`
- All content sits at `z-index:1`

### System 2 — App (`css/app.css`)
Used by: `app/*.html`, `auth/callback.html`

- Separate design, not themed. Dark navy (`#1e1e2e`) nav.
- Does **not** use Google Fonts or the token system above.
- Do not mix the two systems.

---

## JavaScript

### `js/config.js` — load first
Global `var` declarations (no modules). Contains:
- `BACKEND_URL` — Vercel backend (`https://explainly-backend-dev.vercel.app`)
- `SUPABASE_URL` / `SUPABASE_ANON_KEY`
- `PAYMENT_LINKS.razorpay` — Razorpay payment page URLs for `pro`, `premium`, `premium_yearly`
- `PADDLE_CLIENT_TOKEN` / `PADDLE_PRICE_IDS` — Paddle price IDs for `pro`, `premium`, `premium_yearly`
- `TIER_LIMITS` — `{ free: {daily:10,deep:1,why:1}, pro: {daily:100,deep:10,why:10}, premium: {daily:500,deep:75,why:75} }`
- `TIER_ORDER` — `{ free:0, pro:1, premium:2 }`

### `js/auth.js` — requires config.js
- `localStorage` keys: `explainly_token`, `explainly_refresh`, `explainly_email`, `explainly_usage_cache`
- `signInWithGoogle()` — triggers Supabase Google OAuth; redirect lands at `/auth/callback.html`
- `signOut()` — clears localStorage + Supabase session
- `refreshToken()` — calls `BACKEND_URL/api/auth/refresh`, deduped with `_refreshPromise`
- `requireAuth()` — redirects to `/app/login.html` if no token

### `js/api.js` — requires config.js + auth.js
- `apiFetch(path, options)` — fetch with Bearer token, auto-retries once on 401 after `refreshToken()`
- `fetchUsage()` — GET `/api/usage`
- `fetchSaves(offset, limit)` — GET `/api/saves`
- `deleteSave(id)` — DELETE `/api/saves?id=`

### `js/landing.js` — landing page only
Handles: theme toggle, header scroll shadow, starfield canvas (shooting stars, accent-reactive),
scroll reveal (IntersectionObserver), typewriter effect, highlight→popup simulation (`[data-sim]`),
monthly/annual pricing toggle (`#priceSeg`), comparison table accordion (`#cmpToggle`),
sign-in label swap (`explainly_token` → "My Library").

---

## Payments

Two processors, auto-detected by region in `app/upgrade.html`:

| Processor | Region | Format |
|---|---|---|
| Razorpay | India | Payment page URLs in `config.js` → `PAYMENT_LINKS.razorpay` |
| Paddle | International | Inline JS SDK, price IDs in `config.js` → `PADDLE_PRICE_IDS` |

**⚠ Pro Annual plan** is shown on the landing page pricing toggle (new design) but **does not yet have a Razorpay payment link** in `config.js`. Only `pro`, `premium`, `premium_yearly` exist. Add `pro_yearly` when the Razorpay page is created.

---

## Pricing — source of truth

Always use `js/config.js → TIER_LIMITS` for feature limits. Pricing amounts:

| Plan | Monthly | Annual |
|---|---|---|
| Free | ₹0 / $0 | — |
| Pro | ₹149/mo · $4.99/mo | ₹1,440/yr · ₹120/mo effective |
| Premium | ₹399/mo · $11.99/mo | ₹2,999/yr · ₹250/mo effective |

---

## Auth flow

1. User clicks "Sign in with Google" → `signInWithGoogle()` → Supabase OAuth
2. Google redirects to `/auth/callback.html`
3. Callback exchanges code → stores `explainly_token`, `explainly_refresh`, `explainly_email` in `localStorage`
4. Redirects to `/app/account.html` (or `?next=` param)
5. API calls use `apiFetch()` which attaches `Authorization: Bearer <token>`
6. On 401: auto-refresh via `BACKEND_URL/api/auth/refresh`

---

## Hosting

- GitHub Pages via Jekyll (`_config.yml`, `Gemfile`)
- `.nojekyll` present → Jekyll processes `_config.yml` but ignores `_` prefixed dirs
- `_redirects` file present (Netlify/Cloudflare Pages syntax — may be legacy)
- PWA manifest at `manifest.json`

---

## What still uses the OLD design

These pages have not been migrated to the new design system and use either old inline `<style>` blocks or `css/app.css`:

- `pricing.html` — standalone pricing page, old inline styles
- `app/upgrade.html` — upgrade/payment page, uses `css/app.css`
- `app/account.html` — uses `css/app.css`
- `app/library.html` — uses `css/app.css`
- `app/login.html` — uses `css/app.css`
- `demo.html` / `success.html` — not yet reviewed

---

## Contact / brand

- **Entity**: Unproton Labs
- **Email**: support@unproton.com
- **Contact page**: https://unproton.com/contact
- **CWS link**: https://chromewebstore.google.com/detail/explainly/fbajmbncecpiklnaekpfpkcmieimfcpb
- **Copyright**: © 2026 Unproton Labs · Explainly

---

## Design handoff

The original design files are in `handoff_extract/` (gitignored). Source zip is `Explainly-unproton-handoff.zip` (also gitignored). Both can be deleted once the implementation is complete and verified.
