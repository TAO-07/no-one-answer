export const config = {
  runtime: "nodejs",
};

export default async function handler(req, res) {
  try {
    // 只允许 POST
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method Not Allowed" });
      return;
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "Missing DEEPSEEK_API_KEY in env" });
      return;
    }

    const {
      messages,
      model = "deepseek-chat",
      stream = true,
      temperature,
    } = req.body || {};

    if (!Array.isArray(messages)) {
      res.status(400).json({ error: "messages must be an array" });
      return;
    }

    const upstream = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        stream,
        temperature: temperature ?? 0.7,
      }),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      res.status(upstream.status).send(text);
      return;
    }

    // 流式：SSE 透传
    if (stream) {
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");

      const reader = upstream.body.getReader();

      // 客户端断开时停止读取
      let closed = false;
      req.on("close", () => {
        closed = true;
        try { reader.cancel(); } catch {}
      });

      while (!closed) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }

      res.end();
      return;
    }

    // 非流式：JSON 返回
    const data = await upstream.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err?.message || String(err) });
  }
}
