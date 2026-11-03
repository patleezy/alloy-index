export const maxDuration = 30;

export async function POST(request) {
  try {
    const { query } = await request.json();
    if (!query?.trim()) return Response.json({ error: "Missing query" }, { status: 400 });

    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) return Response.json({ error: "TAVILY_API_KEY not configured on server." }, { status: 500 });

    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        query: query.trim(),
        search_depth: "advanced",
        max_results: 8,
        include_answer: true,
        include_raw_content: false,
      }),
    });

    if (!res.ok) {
      console.error("Tavily error:", res.status, await res.text());
      const msg = res.status === 401 || res.status === 403
        ? "Research service rejected the request — check that TAVILY_API_KEY is valid."
        : res.status === 429 || res.status === 432 || res.status === 433
          ? "Research service is rate-limited or out of credits. Try again later."
          : `Research search failed (${res.status}).`;
      return Response.json({ error: msg }, { status: 500 });
    }

    const data = await res.json();
    return Response.json({
      answer: data.answer || null,
      results: (data.results || []).map(r => ({
        title: r.title,
        content: r.content,
        url: r.url,
      })),
    });
  } catch (err) {
    console.error("Search route error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
