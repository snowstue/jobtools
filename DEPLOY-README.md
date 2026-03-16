# Orbit Tools — Deploy Guide
## GitHub → Vercel → orbit.tools

---

## File Structure

```
orbit-tools/
├── api/
│   ├── claude.js            ← Anthropic proxy (replaces api-server.js)
│   └── storage/
│       └── [key].js         ← Persistent storage endpoint
├── src/
│   └── App.jsx              ← React frontend (unchanged)
├── public/
│   └── index.html
├── .env.local.example       ← Copy to .env.local for local dev
├── .gitignore
├── package.json
├── vercel.json
└── vite.config.js
```

---

## Step 1 — Create the GitHub repo

```bash
git init
git add .
git commit -m "Initial commit — orbit.tools"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/orbit-tools.git
git push -u origin main
```

---

## Step 2 — Connect to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your `orbit-tools` GitHub repo
3. Framework preset: **Vite**
4. Build command: `vite build` (auto-detected)
5. Output directory: `dist` (auto-detected)
6. Click **Deploy**

Vercel auto-deploys on every push to `main` from this point forward.

---

## Step 3 — Add your Anthropic API key

Vercel Dashboard → your project → **Settings → Environment Variables**

| Name | Value | Environments |
|------|-------|--------------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Production, Preview, Development |

After adding, go to **Deployments → Redeploy** (with "Use existing build cache" unchecked) to apply.

---

## Step 4 — Add persistent storage (Vercel KV)

Without KV, pipeline data resets on every serverless cold start. KV gives you true persistence.

1. Vercel Dashboard → **Storage → Create Database → KV (Redis)**
2. Name it `orbit-tools-kv` → Create
3. **Connect to Project** → select your project → all environments
4. Vercel auto-injects `KV_REST_API_URL` and `KV_REST_API_TOKEN` — no manual copy needed

For local dev, pull those vars:
```bash
vercel env pull .env.local
```

---

## Step 5 — Connect orbit.tools domain

Vercel Dashboard → your project → **Settings → Domains**

Add: `orbit.tools`

Vercel gives you DNS records to add at your registrar:

| Type | Name | Value |
|------|------|-------|
| `A` | `@` | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |

DNS propagates in 5–30 minutes. Vercel auto-provisions an SSL certificate.

---

## Local Development

```bash
# Install dependencies
npm install

# Copy env template
cp .env.local.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY

# Run local dev server (Vercel CLI serves both frontend + API routes)
npm run dev
# Opens on http://localhost:3000
```

`vercel dev` handles both the Vite frontend and the `/api` serverless functions
on a single port — no need to run two processes.

---

## How Deployments Work

| Action | Result |
|--------|--------|
| Push to `main` | Auto-deploys to `orbit.tools` (production) |
| Open a PR | Auto-deploys to a preview URL for testing |
| Merge PR | Auto-deploys to production |

Preview URLs follow the pattern: `orbit-tools-git-branch-name.vercel.app`

---

## Environment Variables Reference

| Variable | Required | Purpose |
|----------|----------|---------|
| `ANTHROPIC_API_KEY` | Yes | Claude API access |
| `KV_REST_API_URL` | Recommended | Vercel KV persistence |
| `KV_REST_API_TOKEN` | Recommended | Vercel KV auth |

---

## Cost Estimate

| Service | Cost |
|---------|------|
| Vercel Hobby (personal use) | Free |
| Vercel KV | Free up to 256MB |
| Anthropic API | ~$0.10–0.25/day typical use |
| orbit.tools domain | ~$15–20/year (wherever purchased) |

Vercel Pro ($20/month) only needed if you add team members or need >100GB bandwidth.

---

## Troubleshooting

**Discovery returns "Market Intelligence" badge instead of "Live Web Search"**
Check Vercel function logs: Dashboard → Deployments → Functions tab.
Usually means the `anthropic-beta` header was rejected or the agentic loop timed out.
The `maxDuration: 120` in `vercel.json` gives the function 2 minutes — sufficient for most searches.

**Storage not persisting between sessions**
KV is not connected. Follow Step 4 above. Without KV, in-memory fallback is used and resets on cold start.

**API key error on first deploy**
The environment variable was added after the build. Trigger a fresh deploy: Deployments → three-dot menu → Redeploy (uncheck "use build cache").
