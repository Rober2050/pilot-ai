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
- PILOT AI stores projects and analysis in Google Cloud Firestore
- All communication with Supabase uses TLS encryption
- User passwords are never stored — authentication is handled by Supabase Auth
- Data deletion is immediate upon account termination

---

## Known security considerations

- The project stores user-generated content (analysis results) in Firestore. Firestore rules restrict data access to the authenticated user who created it.
- Voice features use Google Cloud Text-to-Speech API — audio is processed in Google's secure infrastructure.

---

## Contact

**Security issues:** abadiarober@gmail.com  
**General inquiries:** [your contact info]
