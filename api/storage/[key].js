// api/storage/[key].js — Vercel serverless function
// Handles GET and POST for persistent key-value storage.
// Uses Vercel KV (Redis) if configured, falls back to a simple in-process
// store for local dev (data resets on cold start in that case — connect KV
// in Vercel dashboard for true persistence).

// ── Vercel KV (recommended for production) ──────────────────────────────────
// To enable: Vercel Dashboard → Storage → Create KV Database → link to project.
// That auto-sets KV_REST_API_URL and KV_REST_API_TOKEN env vars.
// Install locally: npm install @vercel/kv

let kv = null;
try {
  // Dynamically import so the function still boots if KV is not configured
  const mod = await import("@vercel/kv");
  kv = mod.kv;
} catch {
  // KV package not installed or env vars missing — use in-memory fallback
}

// In-memory fallback (dev only — does not persist across serverless invocations)
const memStore = {};

async function kvGet(key) {
  if (kv) return kv.get(key);
  return memStore[key] ?? null;
}

async function kvSet(key, value) {
  if (kv) return kv.set(key, value);
  memStore[key] = value;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { key } = req.query;
  if (!key) return res.status(400).json({ error: "Missing key" });

  if (req.method === "GET") {
    try {
      const value = await kvGet(key);
      if (value === null) return res.status(200).json(null);
      // Value stored as a JSON string — return in same shape as old server
      return res.status(200).json({ key, value: typeof value === "string" ? value : JSON.stringify(value) });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === "POST") {
    try {
      const { value } = req.body;
      await kvSet(key, value);
      return res.status(200).json({ key, value });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
