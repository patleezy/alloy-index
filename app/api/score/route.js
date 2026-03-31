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

── SCORING RUBRIC ───────────────────────────────────────────────────────────────
Form your judgment first. Then assign a score. Never work backwards from a number.

Each dimension is scored 0–100 using this scale:

  90–100  Exceptional. Reserved for genuinely outstanding fit with specific evidence.
  75–89   Strong. Clear alignment with real upside. Minor concerns only.
  60–74   Solid but conditional. Real strengths offset by real, named concerns.
  40–59   Problematic. Meaningful friction or mismatch requiring active mitigation.
  0–39    Disqualifying in this dimension. Serious documented risk or fundamental mismatch.

DIMENSION DEFINITIONS:

CULTURAL ALIGNMENT — Does the talent's persona, values, and cultural associations
reinforce this brand's identity? Would the pairing feel natural to people who know both?

AUDIENCE DEMOGRAPHICS — How much overlap exists between the talent's actual fanbase
and this brand's target consumer? Consider age, income, geography, and psychographics.

PLATFORM REACH — What is the talent's total addressable reach across social, broadcast,
press, and live appearances? Consider follower counts, engagement rates, and earned media.

BRAND SAFETY — What does the documented public record show? Score this dimension based
solely on verified facts, not speculation about what might happen.
  - No documented issues + track record of reputable partnerships = 90 or above. Full stop.
  - Do NOT write watchouts like "unforeseen PR issues could arise" or "all talent carry risk."
    These are meaningless and unfairly penalize clean talent. Omit them entirely.
  - Documented hate speech, antisemitism, criminal convictions, or federal indictments = 0–15.
    These are not risks to be managed. They are disqualifying.

INTERNATIONAL REACH — How strong is the talent's recognition and cultural resonance
in the brand's key markets? Name specific strong and weak markets.

AUTHENTICITY — This carries the most weight on the overall score.
Would consumers find this partnership believable and natural, or would they ask
"why are they together?" Score based on how well the talent's identity, category,
and story map onto this specific brand — not just culture in general.
A mismatched combo (e.g. a prestige film actor for an athletic performance brand)
should score low here even with high scores elsewhere.

── OVERALL SCORE ────────────────────────────────────────────────────────────────
The overall_score is your honest weighted judgment — not an average of the dimensions.
Authenticity carries the most weight. Brand safety is a floor: severe safety issues
should collapse the overall regardless of other dimension scores.

AUTHENTICITY CEILING RULE — this is mandatory, not a suggestion:
- Authenticity score 0–49:  overall verdict cannot exceed BORDERLINE. overall_score cannot exceed 55.
- Authenticity score 50–64: overall verdict cannot exceed CONDITIONAL PASS. overall_score cannot exceed 64.
- Authenticity score 65+:   no ceiling applies — score freely based on full picture.

Rationale: A partnership that consumers wouldn't find believable cannot be rescued
by reach or safety alone. High platform numbers don't matter if nobody believes the pairing.
Reese Witherspoon × PlayStation, Matt Damon × Nike, a classical pianist × an energy drink —
these fail the believability test regardless of their other scores.

── OUTPUT FORMAT ────────────────────────────────────────────────────────────────
Return ONLY valid JSON. No markdown fences, no preamble, no explanation.
All score fields must be integers 0–100. Do not use strings or decimals.

{
  "overall_verdict": "PASS",
  "overall_score": <integer derived from rubric>,
  "exec_summary": "2-3 sentence CMO-ready summary, specific and actionable",
  "deal_headline": "8 words max, punchy",
  "recommended_activation": "1 sentence",
  "risk_flag": "single most important risk, or null",
  "scores": {
    "cultural":      { "score": <integer>, "headline": "5-8 words", "analysis": "2-3 sentences citing real facts", "strengths": ["specific strength"], "watchouts": ["specific documented concern or omit"] },
    "audience":      { "score": <integer>, "headline": "5-8 words", "analysis": "2-3 sentences", "strengths": ["specific strength"], "watchouts": ["specific documented concern or omit"] },
    "platform":      { "score": <integer>, "headline": "5-8 words", "analysis": "2-3 sentences with real reach estimates", "strengths": ["specific strength"], "watchouts": ["specific documented concern or omit"] },
    "safety":        { "score": <integer>, "headline": "5-8 words", "analysis": "2-3 sentences on documented record only", "strengths": ["specific strength"], "watchouts": ["specific documented concern only — omit if none"] },
    "international": { "score": <integer>, "headline": "5-8 words", "analysis": "2-3 sentences naming specific markets", "strengths": ["specific strength"], "watchouts": ["specific documented concern or omit"] },
    "authenticity":  { "score": <integer>, "headline": "5-8 words", "analysis": "2-3 sentences on fit believability", "strengths": ["specific strength"], "watchouts": ["specific documented concern or omit"] }
  },
  "comparable_deals": ["real deal 1", "real deal 2", "real deal 3"],
  "ideal_markets": ["market 1", "market 2", "market 3"],
  "deal_type_recommendation": "Endorsement or Ambassador or Content Series or Collab Product etc",
  "you_may_also_consider": [
    { "name": "Talent Name", "type": "Musician / Artist", "rationale": "1 sentence on why this talent is a strong alternative for this specific brand" },
    { "name": "Talent Name", "type": "Athlete / Sports Figure", "rationale": "1 sentence on why" },
    { "name": "Talent Name", "type": "Cultural Icon", "rationale": "1 sentence on why" }
  ]
}

overall_verdict must be exactly one of: STRONG PASS, PASS, CONDITIONAL PASS, BORDERLINE, NO PASS

For you_may_also_consider:
- Suggest 3 real talent with similar audience overlap and cultural positioning to the evaluated talent
- Each suggestion should be a genuinely credible fit for this specific brand — not just famous people in the same category
- Rationale must be brand-specific: explain why this alternative works for THIS brand, not generically
- Vary the talent types across the 3 suggestions where possible
- Never suggest the talent being evaluated`;

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

      // Sanitize: ensure all scores are integers
      if (parsed.scores) {
        for (const key of Object.keys(parsed.scores)) {
          if (parsed.scores[key]?.score !== undefined) {
            parsed.scores[key].score = Math.min(100, Math.max(0, parseInt(parsed.scores[key].score) || 0));
          }
        }
      }
      if (parsed.overall_score !== undefined) {
        parsed.overall_score = Math.min(100, Math.max(0, parseInt(parsed.overall_score) || 0));
      }

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
