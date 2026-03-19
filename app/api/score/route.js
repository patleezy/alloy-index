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
      // Retry on 503 (overloaded) or 429 (rate limit) on first attempt
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
      throw err; // re-throw on second attempt or non-abort errors
    }
  }
}

export const maxDuration = 10;

export async function POST(request) {
  try {
    const { talentName, talentType, campaigns, brandProfile, notes, researchContext } = await request.json();

    if (!talentName || !talentType || !brandProfile?.name) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return Response.json({ error: "GEMINI_API_KEY not configured on server." }, { status: 500 });

    const campaignList = Array.isArray(campaigns) ? campaigns.join(", ") : campaigns || "General";
    const marketsStr = Array.isArray(brandProfile.markets) ? brandProfile.markets.join(", ") : brandProfile.markets || "Not specified";

    const prompt = `You are a senior brand partnerships analyst at ${brandProfile.name}. Evaluate this partnership for strategic fit, cultural resonance, and commercial potential.

BRAND PROFILE:
- Brand: ${brandProfile.name}
- Industry: ${brandProfile.industry || "Not specified"}
- Brand values: ${brandProfile.values || "Not specified"}
- Target audience: ${brandProfile.audience || "Not specified"}
- Key markets: ${marketsStr}
- Additional context: ${brandProfile.context || "None"}

PARTNERSHIP BEING EVALUATED:
- Talent / Partner: ${talentName}
- Type: ${talentType}
- Campaign Context: ${campaignList}
${notes ? `- Notes: ${notes}` : ""}

LIVE RESEARCH:
${researchContext || "No live research available. Use your training knowledge."}

Score across 5 dimensions 0-100. Be specific, cite real facts. Never be generic.

SCORING INSTRUCTIONS — read before generating scores:
- Use the FULL 0-100 range. Do not cluster around 80.
- A score of 90+ requires genuinely exceptional fit with real evidence. It should be rare.
- A score of 50-65 means real friction — meaningful mismatch or risk in this dimension.
- A score below 40 means a serious problem in this dimension.
- Scores across dimensions should vary based on actual fit — a talent can score 92 on platform reach and 61 on international reach. That variation is expected and correct.
- The overall_score should be your honest weighted judgment, not an average.
- Authenticity carries the most weight on the overall score — a poor fit between talent and brand identity is the hardest thing to fix regardless of reach or safety.
- Brand safety must reflect documented public record only. Do not speculate about future risk.
- A talent with no documented controversies, no legal issues, and a track record of successful partnerships with reputable brands should score 90 or above on brand safety. This is the correct score for genuinely clean talent — do not artificially lower it.
- Only score brand safety below 75 if there is specific, documented evidence of risk — a real incident, a real controversy, a real legal matter.
- PROHIBITED watchouts for brand safety: never write "unforeseen PR issues could arise", "all public figures carry inherent risk", "social media sentiment could shift", or any other generic hedge that applies to every human being. Watchouts must cite a specific documented concern or be omitted entirely.
- Be opinionated. Vague scores around 75-85 are a sign of hedging, not analysis.
- For the authenticity dimension specifically: score how natural and believable this partnership would feel to consumers. Ask yourself — would audiences find this pairing credible, or would they ask "why are they together?" A mismatched talent-brand combo (e.g. a prestige film actor for an athletic brand) should score low here even if they score well on other dimensions. This is the most brand-specific dimension — weight the brand profile heavily.

Return ONLY this JSON, no markdown, no preamble:
{
  "overall_verdict": "PASS",
  "overall_score": 74,
  "exec_summary": "2-3 sentence CMO-ready summary",
  "deal_headline": "8 words max",
  "recommended_activation": "1 sentence",
  "risk_flag": "single most important risk or null",
  "scores": {
    "cultural":      { "score": 88, "headline": "5-8 words", "analysis": "2-3 sentences", "strengths": ["s1","s2"], "watchouts": ["w1"] },
    "audience":      { "score": 79, "headline": "5-8 words", "analysis": "2-3 sentences", "strengths": ["s1","s2"], "watchouts": ["w1"] },
    "platform":      { "score": 91, "headline": "5-8 words", "analysis": "2-3 sentences with reach estimates", "strengths": ["s1","s2"], "watchouts": ["w1"] },
    "safety":        { "score": 78, "headline": "5-8 words", "analysis": "2-3 sentences on documented risk only", "strengths": ["s1"], "watchouts": ["w1"] },
    "international":  { "score": 67, "headline": "5-8 words", "analysis": "2-3 sentences naming markets", "strengths": ["s1","s2"], "watchouts": ["w1"] },
    "authenticity":   { "score": 72, "headline": "5-8 words", "analysis": "2-3 sentences on fit believability", "strengths": ["s1","s2"], "watchouts": ["w1"] }
  },
  "comparable_deals": ["deal1","deal2","deal3"],
  "ideal_markets": ["market1","market2","market3"],
  "deal_type_recommendation": "Endorsement or Ambassador or Content Series etc"
}

RULES:
- overall_verdict must be exactly one of: STRONG PASS, PASS, CONDITIONAL PASS, BORDERLINE, NO PASS
- Dimension scores should reflect genuine variation — do not round to 5s or cluster near 80
- The example scores above are illustrative of the variation expected, not targets`;

    const res = await geminiWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: 4096,
          temperature: 0.7,
        },
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini score error:", res.status, errText);
      return Response.json({ error: `Gemini API failed (${res.status})` }, { status: 502 });
    }

    const geminiData = await res.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!rawText) {
      console.error("Empty Gemini response:", JSON.stringify(geminiData).slice(0, 300));
      return Response.json({ error: "Empty response from Gemini. Try again." }, { status: 500 });
    }

    const cleaned = rawText.replace(/```json|```/g, "").trim();

    try {
      const parsed = JSON.parse(cleaned);
      return Response.json({ result: parsed });
    } catch (parseErr) {
      console.error("Score JSON parse failed:", parseErr.message, rawText.slice(0, 300));
      return Response.json({ error: "Failed to parse scoring response. Try again." }, { status: 500 });
    }
  } catch (err) {
    console.error("Score route error:", err.name, err.message);
    if (err.name === "AbortError") {
      return Response.json({ error: "Scoring timed out. Please try again." }, { status: 504 });
    }
    return Response.json({ error: `Server error: ${err.message}` }, { status: 500 });
  }
}
