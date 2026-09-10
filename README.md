# PILOT AI

**9 specialized AI agents that take a product idea from a sentence to presentation-ready deliverables.**

You describe an idea. Nine role-based agents (Strategy Analyst, Product Manager, Business Analyst, Project Manager, Marketing Manager, Architect, UX/UI Designer, QA Engineer, DevOps Engineer) each produce a structured analysis, pass their JSON forward to the next role, and a synthesis agent moderates the whole team into one executive verdict. Everything exports to **PPT, DOCX, PDF and Excel**.

Built as a solo Technical PM project. Shared as a self-hostable reference implementation of a multi-agent pipeline with real exports, quotas and RLS. Not a hosted service: you run it on your own free Supabase project with your own Anthropic key.

*(Versión en español más abajo.)*

---

## What each agent delivers

| Agent | Output |
|---|---|
| Strategy Analyst | Market analysis, SWOT/TOWS, IDEO desirability/feasibility/viability, unit economics |
| Product Manager | PRD, OKRs, roadmap, prioritized backlog |
| Business Analyst | Process maps (BPMN swimlanes), requirements, KPI dashboard |
| Project Manager | Charter, Gantt, risk matrix, PMBOK or Agile plan |
| Marketing Manager | Go-to-market, positioning, channel mix |
| Architect | System design, C4 diagrams, stack recommendation |
| UX/UI Designer | Clickable HTML landing prototype, UX audit |
| QA Engineer | Test strategy, test cases, quality gates |
| DevOps Engineer | CI/CD pipeline, infra design, SRE runbook |
| **Synthesis agent** | Team verdict (PROCEED / PIVOT / HALT), consensus, tensions between roles, top risks |

## How it works

```
idea ──▶ role 1 ──▶ role 2 ──▶ … ──▶ role 9 ──▶ synthesis agent
          │           │                 │              │
          └── JSON ───┴── JSON ─────────┴── JSON ──────┘
                                  │
                    exporters: PPTX · DOCX · PDF · XLSX
```

- Each role has a **protocol** (`src/ai/protocols.ts`): a strict JSON schema the model must return, plus the role's methodology.
- Outputs are normalized (`src/services/export/contentNormalizer.ts`) and rendered by shared drivers into the four document formats.
- The browser never talks to Anthropic. It calls a **Supabase Edge Function** (`supabase/functions/anthropic-proxy`) that holds the key, enforces a model allowlist, per-user daily quotas and per-plan monthly token budgets, and streams the response back over SSE.
- Data isolation is enforced by Postgres **Row Level Security** (`supabase/migrations/`).

## Stack

React 18 · TypeScript 5 · Vite 5 · Tailwind 3 · Framer Motion · React Router 6 · i18next (ES/EN) · Recharts · React Flow + Dagre · pptxgenjs · docx · jsPDF · xlsx-js-style · Supabase (Postgres, Auth, Edge Functions on Deno) · Anthropic Claude (Haiku 4.5 by default)

---

## Run it yourself (about 20 minutes)

You need: **Node 20+**, **Git**, a free **Supabase** account, and an **Anthropic API key** with some credit. Every analysis costs tokens on *your* key; a full 9-role run is roughly 100k to 300k tokens on Haiku.

### 1. Create accounts

1. [supabase.com](https://supabase.com) → New project. Note the **project ref** (the 20-character id in the project URL).
2. [console.anthropic.com](https://console.anthropic.com) → API keys → create one (`sk-ant-...`).

### 2. Clone and install

```bash
git clone https://github.com/Rober2050/pilot-ai.git
cd pilot-ai
npm install
```

### 3. Set up Supabase (one command)

```bash
npx supabase login          # opens the browser once
./scripts/setup-supabase.sh <project-ref> <sk-ant-your-key>
```

The script links the project, applies the migrations (schema, the 9 roles with their system prompts, plans, security policies), stores your Anthropic key as a server-side secret, and deploys the proxy function.

On Windows without Git Bash, run the four commands inside the script by hand:

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
npx supabase functions deploy anthropic-proxy
```

### 4. Configure the frontend

```bash
cp .env.example .env.local
```

Open `.env.local` and paste the two values from Supabase Dashboard → Project Settings → API:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
```

### 5. Run

```bash
npm run dev
```

Open http://localhost:5173, register with your email, confirm the email Supabase sends you (the proxy refuses unconfirmed accounts), type an idea, pick a role, and run it.

### Make yourself admin (optional)

Admins bypass plan limits and see the admin console. In Supabase Dashboard → SQL Editor:

```sql
SELECT public.promote_to_admin('you@example.com');
```

Role and plan columns are server-owned: users cannot change them from the client (see `supabase/migrations/004_security_hardening.sql`).

### Deploy the frontend (optional)

It is a static Vite build. Vercel, Netlify or Cloudflare Pages work with defaults: build command `npm run build`, output `dist`, and the two `VITE_SUPABASE_*` variables set in the host's environment settings. Then allow your domain in the proxy:

```bash
npx supabase secrets set ALLOWED_ORIGINS=https://your-app.vercel.app
npx supabase functions deploy anthropic-proxy
```

### Cost controls you can tune

In `supabase/functions/anthropic-proxy/index.ts`:

| Knob | Default | Meaning |
|---|---|---|
| `ALLOWED_MODELS` | Haiku 4.5 | Models the client may request |
| `MAX_TOKENS_CAP` | 64k | Ceiling per request |
| daily quota | ~3 full runs | Per-user hard stop per UTC day |
| `PLAN_MONTHLY_TOKEN_BUDGET` | per plan | Monthly budget by subscription plan |

Redeploy the function after changing them.

---

## Project layout

```
src/
├── ai/                 protocols.ts (role schemas + methodology), promptEngine.ts
├── services/
│   ├── ai/             provider factory, streaming, SynthesisAgent, outputValidator
│   ├── export/         exportRegistry, contentNormalizer, documentRenderer, ppt/, drivers/
│   └── firebase/       data services on Supabase (folder name is historical)
├── components/         dashboard widgets, ResultsWorkspace, role dashboards
├── pages/              StrategyHub (main workspace), ProjectList, AdminConsole, ...
├── i18n/               ES + EN, 23 namespaces
└── types/              blueprint.ts is the central model
supabase/
├── migrations/         001 schema · 002 proxy usage ledger · 003 seed roles/plans · 004 security
└── functions/anthropic-proxy/
```

More detail in [ARCHITECTURE.md](ARCHITECTURE.md), [FEATURES.md](FEATURES.md) and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Scripts

```bash
npm run dev       # Vite dev server
npm run build     # tsc + vite build
npm run test      # Vitest
npm run lint
```

## Known limitations

- Few automated tests. The export generators and role protocols were validated by hand.
- The `services/firebase/` folder name predates the Supabase migration; the code inside is Supabase.
- War Room and the voice features are experimental and disabled by default.
- Only Anthropic is wired through the secure proxy. Gemini and OpenAI providers exist in code but would need the same proxy treatment before use.

## License

MIT with Commons Clause. Free to use, modify and self-host; not to be sold as a service. See [LICENSE](LICENSE).

---

## Versión en español

PILOT AI toma una idea de producto escrita en una frase y la pasa por 9 agentes con rol (Strategy Analyst, Product Manager, Business Analyst, Project Manager, Marketing, Arquitecto, UX/UI, QA y DevOps). Cada uno entrega un análisis estructurado en JSON que alimenta al siguiente, y un agente de síntesis modera al equipo y emite un veredicto ejecutivo. Todo se exporta a PPT, Word, PDF y Excel.

No es un servicio alojado. Lo corrés en tu propio proyecto gratuito de Supabase con tu propia clave de Anthropic. Los tokens los pagás vos.

### Instalación en 5 pasos (unos 20 minutos)

1. **Cuentas:** creá un proyecto en [supabase.com](https://supabase.com) y una API key en [console.anthropic.com](https://console.anthropic.com).
2. **Código:** `git clone` del repo y `npm install`.
3. **Supabase:** `npx supabase login` y después `./scripts/setup-supabase.sh <project-ref> <sk-ant-...>`. Crea tablas, carga los 9 roles, aplica seguridad, guarda tu clave como secret y despliega el proxy.
4. **Frontend:** `cp .env.example .env.local` y pegá la URL y la anon key de Supabase (Dashboard → Project Settings → API).
5. **Correr:** `npm run dev` y abrí http://localhost:5173. Registrate, confirmá el mail, escribí una idea y ejecutá un rol.

Para ser admin: en el SQL Editor de Supabase, `SELECT public.promote_to_admin('tu@email.com');`.

Los detalles de cada paso están en la sección en inglés de arriba.
