// api/claude.js — Vercel serverless function
// Proxies requests to Anthropic API and handles the agentic web search loop.

const API_KEY = process.env.ANTHROPIC_API_KEY;

async function callClaude(body) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "web-search-2025-03-05",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Anthropic API ${r.status}: ${t.slice(0, 400)}`);
  }
  return r.json();
}

export default async function handler(req, res) {
  // CORS — allow the custom domain and localhost dev
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!API_KEY) {
    return res.status(500).json({
      error: "ANTHROPIC_API_KEY is not set. Add it in Vercel → Project Settings → Environment Variables.",
    });
  }

  try {
    let body = { ...req.body };
    let data = await callClaude(body);

    // Agentic loop: web_search tool requires feeding results back until end_turn
    let iterations = 0;
    const MAX_ITER = 8;

    while (data.stop_reason === "tool_use" && iterations < MAX_ITER) {
      iterations++;
      const toolUseBlocks = data.content.filter((b) => b.type === "tool_use");
      if (toolUseBlocks.length === 0) break;

      const toolResults = toolUseBlocks.map((tb) => ({
        type: "tool_result",
        tool_use_id: tb.id,
        content: tb.content || "",
      }));

      body = {
        ...body,
        messages: [
          ...(body.messages || []),
          { role: "assistant", content: data.content },
          { role: "user", content: toolResults },
        ],
      };

      data = await callClaude(body);
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
