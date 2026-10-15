# Security Policy

## Reporting Security Issues

If you discover a security vulnerability in PILOT AI, please do **not** open a public GitHub issue.

Instead, email us directly at: **abadiarober@gmail.com**

### Include in your report:
- Description of the vulnerability
- Steps to reproduce (if applicable)
- Potential impact
- Your contact information (optional but appreciated)

**We aim to respond within 48 hours and provide a fix within 7 days** for critical issues.

---

## Security best practices

### For contributors
- Never commit `.env` files, API keys, or service-role keys
- All sensitive files are listed in `.gitignore`
- Use `git-secrets` or similar pre-commit hooks to prevent accidental commits
- Always validate user input on the backend
- Rotate provider API keys periodically

### For deployment
- Data access is enforced by Postgres Row Level Security (see `supabase/migrations/`)
- Provider API keys live only as Edge Function secrets, never in `VITE_*` variables
- All API keys are environment variables, never hardcoded
- Preview deployments should be short-lived and never point at a production database
- Production deploys require merge to `main` (protected branch)

### For users
- PILOT AI stores projects and analysis in Supabase (Postgres), protected by Row Level Security
- All communication with Supabase uses TLS encryption
- User passwords are never stored — authentication is handled by Supabase Auth
- Data deletion is immediate upon account termination

---

## Known security considerations

- Projects and analysis results live in Postgres. Row Level Security policies (`supabase/migrations/`) restrict each row to the authenticated user who created it.
- Every AI call goes through the `anthropic-proxy` Edge Function, which checks the session and email confirmation, rebuilds the request from an allowlist (model, size, attachments), and enforces daily and monthly token quotas before calling Claude. The browser never sees a provider key.
- Image and PDF attachments are sent to Claude through the same proxy, capped in count and size and charged against the quota.
- Share links (`/pitch/:id`) are public by design: anyone with the link can read that snapshot. Only signed-in users can create one, and only as themselves.
- Voice dictation uses the browser's built-in speech recognition (Web Speech API). Depending on the browser, the audio may be processed by the browser vendor's speech service (Google in Chrome, Apple in Safari). PILOT AI never uploads or stores audio.

---

## Contact

**Security issues:** abadiarober@gmail.com  
**General inquiries:** [your contact info]
