import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const API_KEY = process.env.ANTHROPIC_API_KEY;

app.use(express.json());
app.use(express.static(join(__dirname, "dist")));

// CORS middleware
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// API route: Claude proxy
app.post("/api/claude", async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });
  }

  try {
    let body = req.body;
    let data = await callClaudeWithRetry(body);

    if (!data) {
      return res.status(500).json({ error: "Empty response from Anthropic API" });
    }
    if (typeof data !== "object") {
      return res.status(500).json({ error: `Response is not an object: ${typeof data}` });
    }
    if (!data.content && !data.error) {
      return res.status(500).json({ error: `Missing content in response: ${JSON.stringify(data).slice(0, 200)}` });
    }

    // Agentic loop
    let iterations = 0;
    const MAX_ITER = 8;

    while (data && data.stop_reason === "tool_use" && iterations < MAX_ITER) {
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

      data = await callClaudeWithRetry(body);
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve index.html for all other routes (SPA routing)
app.get("*", (req, res) => {
  res.sendFile(join(__dirname, "dist", "index.html"));
});

// Helper: retry with exponential backoff for rate limits
async function callClaudeWithRetry(body, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-beta": "web-search-2025-03-05",
        },
        body: JSON.stringify(body),
      });

      if (response.status === 429) {
        const wait = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        console.log(`Rate limited. Waiting ${wait}ms before retry ${i + 1}/${retries}`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Anthropic API ${response.status}: ${error}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (parseErr) {
        const text = await response.text();
        throw new Error(`Failed to parse JSON: ${text.slice(0, 200)}`);
      }

      if (!data || typeof data !== "object") {
        throw new Error(`Invalid response object: ${JSON.stringify(data).slice(0, 200)}`);
      }
      return data;
    } catch (err) {
      if (i === retries - 1) throw err;
      console.error(`Attempt ${i + 1} failed:`, err.message);
    }
  }
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
