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
  login.html          Google OAuth sign-in page (new design)
  account.html        Account dashboard — tier, usage bars, stats, settings, tweaks (new design)
  library.html        Saved explanations library — search, filter, sort, card expand (new design)
  upgrade.html        Plans & payment — billing toggle, comparison table, Razorpay + Paddle (new design)

auth/
  callback.html       Supabase OAuth callback — exchanges code for session tokens

css/
  landing.css         Design system for index + legal pages (dark/light, glassmorphism, starfield)
  legal.css           Additional styles for legal pages (card, callout, guarantee banner, tabs)
  app.css             Design system for app/* pages — SAME token system as landing.css
                      (migrated from Explainly-unproton-app.zip, June 2026)

js/
  config.js           Global constants: backend URL, Supabase keys, payment links, tier limits
  auth.js             Auth helpers: sign-in, sign-out, token storage, refresh
  api.js              apiFetch() wrapper: attaches Bearer token, handles 401 refresh
  app-shell.js        Shared app shell — tweaks panel, starfield, theme toggle, logo swap, toast
                      (loaded on every app/* page after config.js + auth.js)
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

Now uses the **same token system as System 1** (migrated June 2026 from `Explainly-unproton-app.zip`).

- **Fonts**: same Google Fonts stack — Space Grotesk, Manrope, JetBrains Mono, Bricolage Grotesque, Sora
- **Theming** via `data-*` attributes on `<html>` (all 5 now used):
  - `data-theme="dark|light"` — same dark/light palettes as landing
  - `data-accent="indigo|navy|slate|abyss|forest"` — accent colour tokens `--a1`, `--a2`, `--a-glow`, `--a-ink`
  - `data-font="techy|humanist|rounded"` — swaps `--display` font family
  - `data-card="elevated|outline|glass"` — card surface style
  - `data-radius="sharp|rounded|soft"` — corner radius scale via `--r`
- Defaults: `data-theme="dark" data-accent="indigo" data-font="humanist" data-card="elevated" data-radius="rounded"`
- Background layers: same `<canvas id="starfield">` + `.bg-aura` pattern as landing
- **App shell layout**: `.app-shell` flex container — `.sidebar` (desktop, sticky) + `.topbar` + `.tabbar` (mobile)
- **Tweaks persistence**: `localStorage` key `explainly-app-tweaks` (JSON object, all 5 keys)
- **Settings persistence**: `localStorage` key `explainly-settings` (depth preference, toggle states)
- Logo images load from `/icons/logo-{accent}.png` and swap automatically when accent changes
- `js/app-shell.js` must be loaded last (after config + auth) on every app page — it applies tweaks immediately on parse to avoid theme flash

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

### `js/app-shell.js` — all app pages (load after config.js + auth.js)
- Applies tweaks from `explainly-app-tweaks` immediately on script parse (prevents theme flash)
- `window.showToast(msg)` — global toast helper used across all app pages
- On `DOMContentLoaded`: binds `#theme-side` + `#theme-top` toggle buttons; populates sidebar
  user info (`#side-avatar`, `#side-name`, `#side-email`, `#top-avatar`) from `getEmail()`; starts
  starfield canvas; builds tweaks panel if `#tweaks-root` exists; wires `#open-tweaks-btn`
- **Starfield**: accent-reactive (watches `data-accent` via MutationObserver), shooting stars, reduced-motion aware
- **Tweaks panel**: draggable floating panel — controls theme, accent, font, card style, radius

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
| Pro | ₹149/mo · $4.99/mo | ₹1,440/yr (₹120/mo) |
| Premium | ₹399/mo · $11.99/mo | ₹2,999/yr (₹250/mo) |

**Tier limits (source of truth — `js/config.js → TIER_LIMITS`):**

| | Free | Pro | Premium |
|---|---|---|---|
| Explains / day | 15 | 100 | 500 |
| Deep / day | 2 | 10 | 75 |
| Why? / day | 1 | 10 | 75 |
| Saved explanations | 50 (local) | 500 (cloud) | 2,500 (cloud) |

**No "unlimited" anywhere** — all caps are explicit numbers. Do not re-introduce "unlimited" in any UI copy.

---

## Auth flow

1. User clicks "Sign in with Google" → `signInWithGoogle()` → Supabase OAuth
2. Google redirects to `/auth/callback.html`
3. Callback exchanges code → stores `explainly_token`, `explainly_refresh`, `explainly_email` in `localStorage`
4. Redirects to `/app/library.html` (or `?next=` param)
5. API calls use `apiFetch()` which attaches `Authorization: Bearer <token>`
6. On 401: auto-refresh via `BACKEND_URL/api/auth/refresh`

### Supabase OAuth redirect URL allowlist
`signInWithGoogle()` uses `redirectTo: window.location.origin + '/auth/callback.html'`. Supabase **ignores** this if the URL isn't whitelisted — it falls back to the configured Site URL instead.

**Required entries in Supabase Dashboard → Authentication → URL Configuration → Redirect URLs:**
```
http://localhost:5500/**
http://localhost:5500/auth/callback.html
https://explainly.github.io/**
https://explainly.github.io/auth/callback.html
```
If OAuth redirects to the wrong URL (e.g. `localhost:3000`), the Site URL in Supabase dashboard is the culprit — add the correct local/prod URL to the Redirect URLs allowlist.

---

## Hosting

- GitHub Pages via Jekyll (`_config.yml`, `Gemfile`)
- `.nojekyll` present → Jekyll processes `_config.yml` but ignores `_` prefixed dirs
- `_redirects` file present (Netlify/Cloudflare Pages syntax — may be legacy)
- PWA manifest at `manifest.json`

### Local development (Live Server)
The project lives inside a subfolder `Explainly.github.io/` of the workspace. Live Server must be pointed at that subfolder or all absolute paths (`/css/`, `/js/`, `/icons/`) will 404.

`.vscode/settings.json` (at workspace root `/workspaces/codespaces-blank/`) is already configured:
```json
{
  "liveServer.settings.root": "/Explainly.github.io",
  "liveServer.settings.port": 5500
}
```
**After any VS Code restart**, click the Live Server status bar item from inside a file in `Explainly.github.io/`. The site then serves at `http://localhost:5500/`.

---

## What still uses the OLD design

- `pricing.html` — standalone pricing page, old inline styles (not yet migrated)
- `demo.html` / `success.html` — not yet reviewed

All `app/*.html` pages were migrated to the new design system in June 2026 (source: `Explainly-unproton-app.zip`).

---

## App pages — design notes

### Script load order (all app pages)
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/..."></script>
<script src="/js/config.js"></script>
<script src="/js/auth.js"></script>
<script src="/js/api.js"></script>       <!-- omit on login.html -->
<script src="/js/app-shell.js"></script> <!-- must be last shared script -->
<script>/* page-specific inline JS */</script>
```

### app/library.html
- Card structure uses `.card.hov.save` → `.save-head[data-toggle]` → `.save-body`
- Real API: `fetchSaves(offset, limit)` — returns `{id, mode, selected_text, source_title, source_domain, source_url, meaning, simpler, tone, created_at}`
- No `fav`, `tags`, or `collection` fields from real API — those UI elements are omitted
- Delete via `deleteSave(id)` from `api.js`

### app/account.html
- Stats grid shows live data from `fetchUsage()` — returns `{tier, usage_today, usage_deep_today, usage_why_today}`
- Streak and 7-day chart are **not shown** — data not available from the API
- Settings persist in `localStorage` key `explainly-settings` AND sync to Supabase `user_settings` table on Save
- Tweaks panel available via "Open Tweaks" button in Settings section (`#tweaks-root` + `#open-tweaks-btn`)
- **Settings defaults** (hardcoded as `DEFAULT_SETTINGS` in inline JS):
  - `defaultDepth`: `"normal"`
  - `autosave`: `false`
  - `tts`: `true`
  - `reminder`: `false`
- On load: sets Supabase session from stored tokens, fetches `user_settings` row, merges over localStorage defaults
- "Save" button (`#save-settings-btn`): upserts `{user_id, settings, updated_at}` to `user_settings` table

### app/upgrade.html
- `#tweaks-root` is **not present** on this page (tweaks only on account)
- Billing toggle (Monthly / Annual) animates `.thumb` slider within `#bill-toggle`
- Plan cards rendered dynamically by `renderPlans()` — re-runs on billing period OR provider change, and after upgrade poll
- **Provider-aware pricing**: PLANS data has both `monthly`/`annual` (USD, Paddle) and `monthly_inr`/`annual_inr` (INR, Razorpay) keys. `renderPlans()` picks the right one via `_period + (_provider === 'razorpay' ? '_inr' : '')`. Switching between Razorpay/Paddle immediately re-renders prices.
- Comparison table column order: **Free | Pro | Premium** (Premium highlighted with `colpop`)

---

## Contact / brand

- **Entity**: Unproton Labs
- **Email**: support@unproton.com
- **Contact page**: https://unproton.com/contact
- **CWS link**: https://chromewebstore.google.com/detail/explainly/fbajmbncecpiklnaekpfpkcmieimfcpb
- **Copyright**: © 2026 Unproton Labs · Explainly

---

## Supabase tables

### `user_settings`
Stores per-user app settings synced from `app/account.html`.

```sql
create table user_settings (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  settings   jsonb not null default '{}',
  updated_at timestamptz default now()
);
alter table user_settings enable row level security;
create policy "Users can manage own settings"
  on user_settings for all
  using (auth.uid() = user_id);
```

**Schema of `settings` JSONB column:**
```json
{
  "defaultDepth": "normal",
  "autosave":     false,
  "tts":          true,
  "reminder":     false,
  "theme":        "dark",
  "accent":       "indigo",
  "font":         "humanist",
  "card":         "elevated",
  "radius":       "rounded"
}
```

**Seed defaults for existing users** (run once in SQL Editor):
```sql
insert into user_settings (user_id, settings, updated_at)
select id,
  '{"defaultDepth":"normal","autosave":false,"tts":true,"reminder":false,
    "theme":"dark","accent":"indigo","font":"humanist","card":"elevated","radius":"rounded"}'::jsonb,
  now()
from auth.users
on conflict (user_id) do nothing;
```

**Frontend usage** (account.html inline JS — direct Supabase client, no backend required):
```js
// Read
_supabase.auth.setSession({ access_token: getToken(), refresh_token: getRefresh() })
  .then(() => _supabase.from('user_settings').select('settings').single())
  .then(({ data }) => { if (data) applySettings(data.settings); });

// Write (Save button)
_supabase.auth.setSession(...)
  .then(({ data }) => _supabase.from('user_settings')
    .upsert({ user_id: data.session.user.id, settings, updated_at: new Date().toISOString() },
            { onConflict: 'user_id' }));
```

---

## UI conventions

### Brand / home navigation
`.side-brand` (sidebar) and `.topbar .brand` are both `<a href="/">` links — clicking the Explainly logo or name on any app page returns to the homepage. Do **not** change these to `<div>` or point them at an app page.

### `.side-account` email overflow
`.side-account .who span` (the email row) has `display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis` — required because long email addresses break the sidebar layout. Do not remove these.

---

## Design handoff

- `Explainly-unproton-handoff.zip` (gitignored) — original landing/legal design source
- `Explainly-unproton-app.zip` — app pages design source (Library, Account, Upgrade, Login). Implementation complete as of June 2026. The zip contains `explainly-app.css` (now `css/app.css`), `explainly-app.js` (reference only — logic was split into `js/app-shell.js` and inline page scripts), `explainly-app-data.js` (mock data, not used in production), and `assets/logo-*.png` (copied to `icons/`).
