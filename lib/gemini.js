// Shared Gemini client used by the API routes (server-side only).

// NOTE: API routes return 500 (never 502/504) for upstream failures. The site
// sits behind Cloudflare, which replaces 502/504 responses with its own HTML
// error page — hiding the JSON error message from the user.
//
// The model is configurable via the GEMINI_MODEL env var so a future model
// retirement only needs an env change in Vercel, not a code change.
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

// Timing budget — keep (2 × ATTEMPT_TIMEOUT_MS + RETRY_DELAY_MS) under the
// route's maxDuration (30s) so a retry can never be cut off by the platform.
const ATTEMPT_TIMEOUT_MS = 12000;
const RETRY_DELAY_MS = 1500;

// Calls generateContent, retrying once on 429/503 or a timeout.
// The API key is sent in the x-goog-api-key header — never in the URL —
// so it can't leak into request logs, proxies, or error traces.
export async function geminiGenerate(apiKey, body) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  for (let attempt = 1; attempt <= 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        signal: controller.signal,
        body: JSON.stringify(body),
      });
      clearTimeout(timer);
      if ((res.status === 503 || res.status === 429) && attempt === 1) {
        console.warn(`Gemini ${res.status} on attempt 1 — retrying...`);
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
        continue;
      }
      return res;
    } catch (err) {
      clearTimeout(timer);
      if (err.name === "AbortError" && attempt === 1) {
        console.warn("Gemini timeout on attempt 1 — retrying...");
        continue;
      }
      throw err;
    }
  }
}

// Maps a failed Gemini HTTP status to a user-facing message.
// Keeps upstream response bodies (which can echo request details) out of the browser.
export function geminiErrorMessage(status) {
  if (status === 404) return `AI model "${GEMINI_MODEL}" is unavailable. Set GEMINI_MODEL to a current model.`;
  if (status === 400 || status === 401 || status === 403) return "AI service rejected the request — check that GEMINI_API_KEY is valid.";
  if (status === 429) return "AI service is rate-limited or out of quota. Try again shortly.";
  if (status >= 500) return "AI service is temporarily unavailable. Try again shortly.";
  return `AI request failed (${status}).`;
}
