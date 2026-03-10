export const maxDuration = 30;

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

    const prompt = `You are a senior brand partnerships analyst at ${brandProfile.name}. Evaluate talent and brand deals for strategic fit, cultural resonance, and commercial potential.

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

LIVE RESEARCH (from web search, use this to inform your analysis):
${researchContext || "No live research available. Use your training knowledge."}

Score this partnership across 5 dimensions from 0 to 100. Be opinionated, specific, and reference the live research where useful. Never be generic.

Return exactly this JSON structure with no markdown fences, no preamble, no extra text:
{
  "overall_verdict": "STRONG PASS",
  "overall_score": 85,
  "exec_summary": "2-3 sentence CMO-ready summary, specific and actionable",
  "deal_headline": "8 words max punchy framing",
  "recommended_activation": "1 sentence on how to activate",
  "risk_flag": "single most important risk or null",
  "scores": {
    "cultural": {
      "score": 80,
      "headline": "5 to 8 word headline",
      "analysis": "2-3 sentences citing real known facts about this talent",
      "strengths": ["strength one", "strength two"],
      "watchouts": ["watchout one"]
    },
    "audience": {
      "score": 80,
      "headline": "5 to 8 word headline",
      "analysis": "2-3 sentences",
      "strengths": ["strength one", "strength two"],
      "watchouts": ["watchout one"]
    },
    "platform": {
      "score": 80,
      "headline": "5 to 8 word headline",
      "analysis": "2-3 sentences with follower or reach estimates if known",
      "strengths": ["strength one", "strength two"],
      "watchouts": ["watchout one"]
    },
    "safety": {
      "score": 80,
      "headline": "5 to 8 word headline",
      "analysis": "2-3 sentences, be direct about controversies or risks",
      "strengths": ["strength one"],
      "watchouts": ["watchout one", "watchout two"]
    },
    "international": {
      "score": 80,
      "headline": "5 to 8 word headline",
      "analysis": "2-3 sentences naming specific strong and weak markets",
      "strengths": ["strength one", "strength two"],
      "watchouts": ["watchout one"]
    }
  },
  "comparable_deals": ["real comparable deal one", "real comparable deal two", "real comparable deal three"],
  "ideal_markets": ["market one", "market two", "market three"],
  "deal_type_recommendation": "Endorsement or Ambassador or Content Series or Collab Product etc",
  "controversy_flags": {
    "risk_profile": "LOW | MEDIUM | HIGH | CRITICAL",
    "risk_profile_rationale": "1-2 sentences explaining the overall risk profile",
    "flags": [
      {
        "severity": "HIGH",
        "category": "category label e.g. Hate Speech / Political Toxicity / Legal / Workplace / Past Scandal",
        "title": "Short flag title",
        "detail": "1-2 sentences with specifics — name the incident, statement, or behavior. Be direct and factual.",
        "brand_impact": "1 sentence on specific brand damage risk",
        "mitigations": ["mitigation one", "mitigation two"]
      }
    ],
    "brand_risk_averse_note": "Specific advice for risk-averse brands in 1-2 sentences. If low risk, confirm that.",
    "safe_to_proceed": true
  }
}

overall_verdict must be exactly one of: STRONG PASS, PASS, CONDITIONAL PASS, BORDERLINE, NO PASS
risk_profile must be exactly one of: LOW, MEDIUM, HIGH, CRITICAL
For controversy_flags.flags: include ALL known flags, no matter how old. If none exist, return an empty array. Never fabricate. For well-known talent with public controversies (e.g. Kanye West, Elon Musk), be comprehensive and specific.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout

    let res;
    try {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              maxOutputTokens: 8192,
              temperature: 0.7,
            },
          }),
        }
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini error:", res.status, errText);
      return Response.json({ error: `Gemini API failed (${res.status})` }, { status: 502 });
    }

    const geminiData = await res.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!rawText) {
      console.error("Empty Gemini response:", JSON.stringify(geminiData).slice(0, 300));
      return Response.json({ error: "Empty response from Gemini. Try again." }, { status: 500 });
    }

    // Strip any accidental fences (responseMimeType should prevent this, but belt-and-suspenders)
    const cleaned = rawText.replace(/```json|```/g, "").trim();

    try {
      const parsed = JSON.parse(cleaned);
      return Response.json({ result: parsed });
    } catch (parseErr) {
      console.error("JSON parse failed at position:", parseErr.message);
      console.error("Raw (first 500):", rawText.slice(0, 500));
      return Response.json({ error: "Failed to parse scoring response. Try again." }, { status: 500 });
    }
  } catch (err) {
    console.error("Score route error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
