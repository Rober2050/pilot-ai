# Deployment guide

PILOT AI has two halves that deploy independently:

| Half | What it is | Where it runs |
|---|---|---|
| Frontend | Static Vite build (`dist/`) | Any static host: Vercel, Netlify, Cloudflare Pages, or your own server |
| Backend | Postgres + Auth + `anthropic-proxy` Edge Function | Your Supabase project |

The frontend only needs two public values (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). All secrets live in Supabase.

## 1. Backend (Supabase)

Done once, from the repo root:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push                                   # migrations 001–009
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
npx supabase functions deploy anthropic-proxy
```

Or the equivalent one-liner: `./scripts/setup-supabase.sh <project-ref> <sk-ant-...>`.

### Migrations

| File | Purpose |
|---|---|
| `001_schema.sql` | Tables, RLS, signup trigger |
| `002_proxy_usage.sql` | Per-user token ledger used by the proxy quota |
| `003_seed_config.sql` | The 9 roles (system prompts), models, plans, war room styles, provider config. Idempotent. |
| `004_security_hardening.sql` | Users cannot change their own role/plan; `promote_to_admin()` helper |
| `005_share_and_audit_policies.sql` | Share links (`/pitch/:id`) and audit log policies; `is_admin()` helper |
| `006_prompts_and_plans_alignment.sql` | One JSON schema per role prompt; plans use Claude Haiku 4.5 and the 9 roles |
| `007_invite_only_signup.sql` | Optional invitation-only sign-up (off by default): `UPDATE system_config SET is_enabled = true WHERE id = 'invite_only_signup'` |
| `008_legacy_data_cleanup.sql` | Removes legacy provider rows; free plan = 1 analysis/month |
| `009_explicit_table_grants.sql` | Explicit Data API grants. Required: since 2026-10-30 Supabase no longer grants access to new tables automatically |

### Auth settings worth checking

Supabase Dashboard → Authentication:

- **Email confirmations: on.** The proxy rejects users whose email is not confirmed, so disposable signups cannot spend your credit.
- **Site URL / Redirect URLs:** add your frontend URL so confirmation links land on your app.
- Google sign-in is optional; the app works with email + password.

### Edge Function secrets

| Secret | Required | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | yes | Never expose as `VITE_*` |
| `ALLOWED_ORIGINS` | for production | Comma-separated browser origins. `localhost:5173` is always allowed. |

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically by Supabase.

Redeploy after any change to the function: `npx supabase functions deploy anthropic-proxy`.

## 2. Frontend

### Local

```bash
cp .env.example .env.local   # fill in the two Supabase values
npm install
npm run dev                  # http://localhost:5173
```

### Vercel / Netlify / Cloudflare Pages

1. Import the repo.
2. Build command `npm run build`, output directory `dist`.
3. Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
4. SPA fallback: route every path to `index.html` (Vercel and Netlify detect Vite automatically; on Cloudflare Pages add a `_redirects` file with `/* /index.html 200` if deep links 404).
5. Add the deployed origin to the proxy: `npx supabase secrets set ALLOWED_ORIGINS=https://<your-app>` and redeploy the function.

### Caching

`index.html` should be served with `no-cache`; everything under `/assets/` is content-hashed and can be `immutable`.

## 3. Cost guardrails

Every request is charged against the caller in `public.proxy_usage` at `max_tokens` (worst case) before it is sent to Anthropic. Limits live at the top of `supabase/functions/anthropic-proxy/index.ts`:

- `ALLOWED_MODELS`: only Haiku 4.5 by default. Adding Sonnet or Opus multiplies cost 3× to 15×.
- `MAX_TOKENS_CAP`: per-request ceiling.
- Daily per-user quota and `PLAN_MONTHLY_TOKEN_BUDGET` per plan (`free`, `pro`, `enterprise`).

Admins (`rol = 'admin'`) bypass plan gates in the UI but still go through the proxy quota.

## 4. Verifying a fresh install

1. Register, confirm the email, log in.
2. Create a project with one role (Strategy Analyst is the fastest) and run it.
3. Watch Supabase → Edge Functions → anthropic-proxy → Logs: you should see one `200` and a row in `proxy_usage`.
4. Export the result to PPTX from the results workspace.

If step 2 fails with a CORS error, the origin is missing from `ALLOWED_ORIGINS`. If it fails with `403 Email not confirmed`, confirm the email or disable confirmations in Auth settings (not recommended on a public deployment).
