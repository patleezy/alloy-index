// Retry helper — retries once on 503 or timeout before failing
async function geminiWithRetry(url, body, timeoutMs = 9000) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify(body),
      });
      clearTimeout(timer);
      if ((res.status === 503 || res.status === 429) && attempt === 1) {
        console.warn(`Gemini ${res.status} on attempt 1 — retrying in 1.5s...`);
        await new Promise(r => setTimeout(r, 1500));
        continue;
      }
      return res;
    } catch (err) {
      clearTimeout(timer);
      if (err.name === "AbortError" && attempt === 1) {
        console.warn("Gemini timeout on attempt 1 — retrying...");
        await new Promise(r => setTimeout(r, 500));
        continue;
      }
      throw err;
    }
  }
}

export const maxDuration = 10;

export async function POST(request) {
  try {
    const { talentName, talentType, brandProfile, researchContext } = await request.json();

    if (!talentName || !brandProfile?.name) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return Response.json({ error: "GEMINI_API_KEY not configured." }, { status: 500 });

    const prompt = `You are a brand risk analyst. Assess controversy and reputational risk for a brand partnership.

BRAND: ${brandProfile.name} (${brandProfile.industry || "general"})
BRAND VALUES: ${brandProfile.values || "Not specified"}
TALENT: ${talentName} (${talentType})

LIVE RESEARCH:
${researchContext || "No live research. Use training knowledge."}

Identify ALL known public controversies, scandals, and reputational risks for ${talentName}.
Be direct and factual. Only include verified public record incidents — never fabricate.
For well-known figures with major controversies (e.g. antisemitic statements, political toxicity, legal issues), be comprehensive and specific.

Return ONLY this JSON, no markdown, no preamble:
{
  "risk_profile": "LOW",
  "risk_profile_rationale": "1-2 sentences on overall risk level",
  "flags": [
    {
      "severity": "HIGH",
      "category": "Past Scandal",
      "title": "Short flag title",
      "detail": "1-2 sentences — name the specific incident, statement, or behavior",
      "brand_impact": "1 sentence on brand damage risk",
      "mitigations": ["mitigation one", "mitigation two"]
    }
  ],
  "brand_risk_averse_note": "Specific advice for risk-averse brands in 1-2 sentences.",
  "safe_to_proceed": true
}

STRICT RULES:
- risk_profile must be exactly one of: LOW, MEDIUM, HIGH, CRITICAL
- severity must be exactly one of: LOW, MEDIUM, HIGH
- safe_to_proceed must be boolean true or false
- flags must be an array (empty array if no flags)
- If talent is genuinely low risk, say so confidently`;

    const res = await geminiWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: 2048,
          temperature: 0.3,
        },
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini controversy error:", res.status, errText);
      return Response.json({ error: `Gemini API failed (${res.status})` }, { status: 502 });
    }

    const geminiData = await res.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!rawText) {
      return Response.json({ error: "Empty response from Gemini." }, { status: 500 });
    }

    const cleaned = rawText.replace(/```json|```/g, "").trim();

    try {
      const parsed = JSON.parse(cleaned);
      return Response.json({ result: parsed });
    } catch (parseErr) {
      console.error("Controversy JSON parse failed:", parseErr.message, rawText.slice(0, 300));
      return Response.json({ error: "Failed to parse controversy response." }, { status: 500 });
    }
  } catch (err) {
    console.error("Controversy route error:", err.name, err.message);
    if (err.name === "AbortError") {
      return Response.json({ error: "Risk analysis timed out. Please try again." }, { status: 504 });
    }
    return Response.json({ error: `Server error: ${err.message}` }, { status: 500 });
  }
}
