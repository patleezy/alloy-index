import { geminiGenerate, geminiErrorMessage } from "../../../lib/gemini";

export const maxDuration = 30;

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
  "recommendation": "PROCEED"
}

STRICT RULES:
- risk_profile must be exactly one of: LOW, MEDIUM, HIGH, CRITICAL
- severity must be exactly one of: LOW, MEDIUM, HIGH
- recommendation must be exactly one of: PROCEED, PAUSE_AND_MONITOR, DO_NOT_PROCEED
- flags must be an array (empty array if no flags)
- If talent is genuinely low risk, say so confidently

RECOMMENDATION DECISION RUBRIC — apply this consistently, not based on feel:

Use DO_NOT_PROCEED when ANY of the following are true:
1. Criminal conviction for violent crime, sexual assault, or abuse (e.g. Jonathan Majors, Bill Cosby)
2. Documented hate speech targeting protected groups — antisemitism, racism, homophobia (e.g. Kanye West's repeated antisemitic statements and Hitler praise)
3. Federal criminal indictment for serious crimes (e.g. Sean Combs/Diddy)
4. Conduct so publicly condemned that no major mainstream brand has maintained an active partnership

Use PAUSE_AND_MONITOR when:
1. Active legal investigation or serious allegation without conviction yet
2. Recent controversy currently under public scrutiny but not yet resolved
3. Polarizing political views without criminal conduct
4. Past controversy with demonstrated rehabilitation and meaningful time elapsed

Use PROCEED when:
1. No significant public controversy
2. Minor past issues that are resolved and not material to brand risk
3. Politically outspoken but within acceptable mainstream range`;

    const res = await geminiGenerate(
      apiKey,
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
      return Response.json({ error: geminiErrorMessage(res.status) }, { status: 500 });
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
      return Response.json({ error: "Risk analysis timed out. Please try again." }, { status: 500 });
    }
    return Response.json({ error: "Something went wrong on the server. Please try again." }, { status: 500 });
  }
}
