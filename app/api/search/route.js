export async function POST(request) {
  try {
    const { query } = await request.json();
    if (!query?.trim()) return Response.json({ error: "Missing query" }, { status: 400 });

    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) return Response.json({ error: "TAVILY_API_KEY not configured on server." }, { status: 500 });

    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: query.trim(),
        search_depth: "advanced",
        max_results: 8,
        include_answer: true,
        include_raw_content: false,
      }),
    });

    if (!res.ok) {
      console.error("Tavily error:", res.status, await res.text());
      return Response.json({ error: `Tavily search failed (${res.status})` }, { status: 502 });
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
