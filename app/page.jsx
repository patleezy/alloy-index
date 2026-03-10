"use client";
import { useState, useEffect, useCallback, useRef } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const PROFILES_KEY = "alloy_profiles";
const THEME_KEY    = "alloy_theme";

const NIKE_DEFAULTS = {
  name: "Nike",
  industry: "Sportswear / Athletic",
  values: "Inspiring, innovative, authentic, performance-driven, inclusive",
  audience: "Athletes, Gen Z, Millennials, fitness enthusiasts, sneaker culture",
  markets: [],
  context: "Just Do It. World's leading athletic footwear and apparel brand. Key products: Air Max, Jordan, React. Heavy investment in athlete storytelling and cultural moments.",
};

const EMPTY_BRAND = { name: "", industry: "", values: "", audience: "", markets: [], context: "" };

const MARKET_OPTIONS = [
  { label: "United States", flag: "🇺🇸" },
  { label: "United Kingdom", flag: "🇬🇧" },
  { label: "Germany",        flag: "🇩🇪" },
  { label: "France",         flag: "🇫🇷" },
  { label: "Italy",          flag: "🇮🇹" },
  { label: "Spain",          flag: "🇪🇸" },
  { label: "Japan",          flag: "🇯🇵" },
  { label: "South Korea",    flag: "🇰🇷" },
  { label: "China",          flag: "🇨🇳" },
  { label: "Australia",      flag: "🇦🇺" },
  { label: "Brazil",         flag: "🇧🇷" },
  { label: "Mexico",         flag: "🇲🇽" },
  { label: "Canada",         flag: "🇨🇦" },
  { label: "India",          flag: "🇮🇳" },
  { label: "UAE",            flag: "🇦🇪" },
  { label: "South Africa",   flag: "🇿🇦" },
  { label: "Southeast Asia", flag: "🌏" },
  { label: "LATAM",          flag: "🌎" },
  { label: "MENA",           flag: "🌍" },
  { label: "Nordics",        flag: "🏔️" },
];

const TALENT_TYPES = [
  { id: "Athlete / Sports Figure", icon: "⚡" },
  { id: "Musician / Artist",       icon: "🎵" },
  { id: "Influencer / Creator",    icon: "📱" },
  { id: "Brand Collaboration",     icon: "🤝" },
  { id: "Actor / Entertainer",     icon: "🎬" },
  { id: "Cultural Icon",           icon: "✦"  },
];

const CAMPAIGN_TAGS = [
  "New Product Launch", "Brand Awareness", "Holiday / Seasonal",
  "Limited Edition Collab", "Sport / Performance", "Cultural Moment",
  "Back to School", "Sustainability", "Gen Z Targeting", "Global Expansion",
];

const DIMS = [
  { key: "cultural",      label: "Cultural Alignment",    icon: "◈" },
  { key: "audience",      label: "Audience Demographics", icon: "◉" },
  { key: "platform",      label: "Platform Reach",        icon: "◎" },
  { key: "safety",        label: "Brand Safety",          icon: "◇" },
  { key: "international", label: "International Reach",   icon: "◆" },
];

const VERDICT_CFG = {
  "STRONG PASS":      { color: "#22c55e", bg: "rgba(34,197,94,0.07)",   border: "rgba(34,197,94,0.2)" },
  "PASS":             { color: "#84cc16", bg: "rgba(132,204,18,0.07)",  border: "rgba(132,204,18,0.2)" },
  "CONDITIONAL PASS": { color: "#f59e0b", bg: "rgba(245,158,11,0.07)",  border: "rgba(245,158,11,0.2)" },
  "BORDERLINE":       { color: "#f97316", bg: "rgba(249,115,22,0.07)",  border: "rgba(249,115,22,0.2)" },
  "NO PASS":          { color: "#C8102E", bg: "rgba(200,16,46,0.07)",   border: "rgba(200,16,46,0.2)" },
};

const INDUSTRIES = [
  "Consumer Electronics", "Audio / Music Tech", "Sportswear / Athletic",
  "Fashion / Apparel", "Beauty / Personal Care", "Food & Beverage",
  "Automotive", "Financial Services", "Gaming", "Streaming / Media", "Other",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const scoreColor = (s) => {
  if (s >= 80) return "#22c55e";
  if (s >= 65) return "#84cc16";
  if (s >= 50) return "#f59e0b";
  if (s >= 35) return "#f97316";
  return "#C8102E";
};

// ─── Radar Chart ──────────────────────────────────────────────────────────────

function RadarChart({ scores, theme }) {
  const cx = 145, cy = 145, r = 95;
  const keys = ["cultural","audience","platform","safety","international"];
  const labels = ["Cultural","Audience","Platform","Safety","Intl."];
  const step = (2 * Math.PI) / keys.length;
  const pt = (i, val) => {
    const a = -Math.PI / 2 + i * step, p = (val || 0) / 100;
    return { x: cx + r * p * Math.cos(a), y: cy + r * p * Math.sin(a) };
  };
  const pts = keys.map((k, i) => pt(i, scores?.[k]));
  const poly = pts.map(p => `${p.x},${p.y}`).join(" ");
  const isLight = theme === "light";

  return (
    <svg width="290" height="290" viewBox="0 0 290 290" style={{ display: "block", margin: "0 auto" }}>
      {[0.25, 0.5, 0.75, 1].map(ring => {
        const rp = keys.map((_, i) => {
          const a = -Math.PI / 2 + i * step;
          return `${cx + r * ring * Math.cos(a)},${cy + r * ring * Math.sin(a)}`;
        }).join(" ");
        return <polygon key={ring} points={rp} fill="none"
          stroke={isLight ? (ring === 1 ? "#ccc8c0" : "#e0ddd8") : (ring === 1 ? "#2a2a2a" : "#1e1e1e")}
          strokeWidth="1" />;
      })}
      {[25, 50, 75].map(val => (
        <text key={val} x={cx + 4} y={cy - r * (val / 100) + 4}
          style={{ fill: isLight ? "#bbb" : "#333", fontSize: 7, fontFamily: "monospace" }}>{val}</text>
      ))}
      {keys.map((_, i) => {
        const a = -Math.PI / 2 + i * step;
        return <line key={i} x1={cx} y1={cy}
          x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)}
          stroke={isLight ? "#dedad3" : "#1e1e1e"} strokeWidth="1" />;
      })}
      <polygon points={poly} fill="rgba(200,16,46,0.1)" stroke="#C8102E" strokeWidth="2" strokeLinejoin="round" />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4.5" fill="#C8102E" stroke={isLight ? "#f2f0eb" : "#0a0a0a"} strokeWidth="2" />)}
      {labels.map((label, i) => {
        const a = -Math.PI / 2 + i * step;
        return (
          <text key={i} x={cx + (r + 26) * Math.cos(a)} y={cy + (r + 26) * Math.sin(a)}
            textAnchor="middle" dominantBaseline="middle"
            style={{ fill: isLight ? "#999" : "#555", fontSize: 9,
              fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.1em", fontWeight: 700 }}>
            {label}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Score Bar ────────────────────────────────────────────────────────────────

function ScoreBar({ score }) {
  const c = scoreColor(score);
  return (
    <div style={{ height: 2, background: "var(--score-track)", borderRadius: 2, marginTop: 8, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${score}%`,
        background: `linear-gradient(90deg,${c}66,${c})`,
        borderRadius: 2, transition: "width 1.2s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );
}

// ─── Chip ─────────────────────────────────────────────────────────────────────

function Chip({ label, active, onClick, small }) {
  return (
    <button onClick={onClick} style={{
      padding: small ? "4px 9px" : "5px 11px",
      borderRadius: 20, cursor: "pointer", transition: "all 0.15s",
      background: active ? "var(--red-soft)" : "var(--tag-bg)",
      border: `1px solid ${active ? "var(--red-border)" : "var(--border)"}`,
      color: active ? "var(--red)" : "var(--muted)",
      fontFamily: "var(--font-body)", fontSize: small ? 11 : 12,
      fontWeight: active ? 600 : 400, whiteSpace: "nowrap",
    }}>
      {label}
    </button>
  );
}

// ─── Input / Label styles (dynamic) ───────────────────────────────────────────

const getInputStyle = () => ({
  width: "100%", background: "var(--input-bg)", border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)", padding: "9px 12px",
  color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 13,
  outline: "none", transition: "border-color 0.2s",
});

const LABEL_STYLE = {
  display: "block", fontFamily: "var(--font-display)", fontSize: 10,
  letterSpacing: "0.12em", color: "var(--muted)", marginBottom: 5, fontWeight: 700,
};

// ─── Profile Manager ──────────────────────────────────────────────────────────

function ProfileManager({ current, onLoad, onSave, onDelete }) {
  const [profiles, setProfiles] = useState({});
  const [saveName, setSaveName] = useState("");
  const [open, setOpen]         = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PROFILES_KEY);
      if (stored) setProfiles(JSON.parse(stored));
    } catch {}
  }, [open]);

  const save = () => {
    const name = saveName.trim() || current.name || "Untitled";
    const next = { ...profiles, [name]: current };
    try {
      localStorage.setItem(PROFILES_KEY, JSON.stringify(next));
      setProfiles(next);
      setSaveName("");
    } catch {}
  };

  const del = (name) => {
    const next = { ...profiles };
    delete next[name];
    try { localStorage.setItem(PROFILES_KEY, JSON.stringify(next)); } catch {}
    setProfiles(next);
  };

  const count = Object.keys(profiles).length;

  return (
    <div style={{ marginBottom: 16 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", padding: "9px 14px", background: "var(--tag-bg)",
        border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
        color: "var(--text2)", fontFamily: "var(--font-display)", fontSize: 11,
        fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        transition: "border-color 0.2s",
      }}>
        <span>SAVED PROFILES {count > 0 ? `(${count})` : ""}</span>
        <span style={{ fontSize: 9, opacity: 0.5 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{
          marginTop: 6, padding: 12, background: "var(--surface)",
          border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
          display: "grid", gap: 8,
        }}>
          {/* Save current */}
          <div style={{ display: "flex", gap: 6 }}>
            <input
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              placeholder={`Save as "${current.name || "Profile name"}"`}
              style={{ ...getInputStyle(), fontSize: 12 }}
              onKeyDown={e => e.key === "Enter" && save()}
            />
            <button onClick={save} style={{
              padding: "0 14px", background: "var(--red)", border: "none",
              borderRadius: "var(--radius-sm)", color: "#fff",
              fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700,
              letterSpacing: "0.08em", cursor: "pointer", whiteSpace: "nowrap",
            }}>SAVE</button>
          </div>

          {/* Saved list */}
          {Object.entries(profiles).length === 0 && (
            <p style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-body)" }}>
              No saved profiles yet.
            </p>
          )}
          {Object.entries(profiles).map(([name, data]) => (
            <div key={name} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "7px 10px", background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
            }}>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{name}</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "var(--muted)" }}>{data.industry || "No industry"}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => { onLoad(data); setOpen(false); }} style={{
                  padding: "4px 10px", background: "var(--red-soft)", border: "1px solid var(--red-border)",
                  borderRadius: 4, color: "var(--red)", fontFamily: "var(--font-display)",
                  fontSize: 10, fontWeight: 700, cursor: "pointer",
                }}>LOAD</button>
                <button onClick={() => del(name)} style={{
                  padding: "4px 8px", background: "none", border: "1px solid var(--border)",
                  borderRadius: 4, color: "var(--muted)", fontFamily: "var(--font-display)",
                  fontSize: 10, cursor: "pointer",
                }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Brand Panel ──────────────────────────────────────────────────────────────

function BrandPanel({ brand, onChange, savedFlash }) {
  const inp = (field) => ({
    value: typeof brand[field] === "string" ? brand[field] : "",
    onChange: (e) => onChange(field, e.target.value),
    style: getInputStyle(),
    onFocus: e => e.target.style.borderColor = "var(--red-border)",
    onBlur:  e => e.target.style.borderColor = "var(--border)",
  });

  const toggleMarket = (label) => {
    const cur = brand.markets || [];
    const next = cur.includes(label) ? cur.filter(m => m !== label) : [...cur, label];
    onChange("markets", next);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ ...LABEL_STYLE, marginBottom: 0 }}>BRAND PROFILE</span>
        <span style={{
          fontSize: 10, color: "#22c55e", fontFamily: "var(--font-body)",
          opacity: savedFlash ? 1 : 0, transition: "opacity 0.3s",
          display: "flex", alignItems: "center", gap: 4,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
          SAVED
        </span>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={LABEL_STYLE}>Brand Name *</label>
            <input {...inp("name")} placeholder="e.g. Nike" />
          </div>
          <div>
            <label style={LABEL_STYLE}>Industry</label>
            <select value={brand.industry} onChange={e => onChange("industry", e.target.value)}
              style={{ ...getInputStyle(), cursor: "pointer" }}>
              <option value="">Select…</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label style={LABEL_STYLE}>Brand Values</label>
          <input {...inp("values")} placeholder="e.g. Inspiring, innovative, performance-driven" />
        </div>

        <div>
          <label style={LABEL_STYLE}>Target Audience</label>
          <input {...inp("audience")} placeholder="e.g. Gen Z, Millennials, athletes" />
        </div>

        <div>
          <label style={LABEL_STYLE}>Key Markets</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 6 }}>
            {MARKET_OPTIONS.map(m => (
              <Chip key={m.label} label={`${m.flag} ${m.label}`}
                active={(brand.markets || []).includes(m.label)}
                onClick={() => toggleMarket(m.label)} small />
            ))}
          </div>
          {(brand.markets || []).length > 0 && (
            <p style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-body)", marginTop: 4 }}>
              Selected: {brand.markets.join(", ")}
            </p>
          )}
        </div>

        <div>
          <label style={LABEL_STYLE}>Additional Context</label>
          <textarea {...inp("context")}
            placeholder="Products, recent campaigns, positioning notes…"
            rows={2} style={{ ...getInputStyle(), resize: "vertical", lineHeight: 1.55 }} />
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [theme, setTheme]           = useState("dark");
  const [brand, setBrand]           = useState({ ...NIKE_DEFAULTS });
  const [savedFlash, setSavedFlash] = useState(false);
  const [brandLoaded, setBLoaded]   = useState(false);
  const saveTimer                   = useRef(null);
  const flashTimer                  = useRef(null);

  const [talentName, setTalentName] = useState("");
  const [talentType, setTalentType] = useState("");
  const [campaigns, setCampaigns]   = useState([]);
  const [notes, setNotes]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [phase, setPhase]           = useState("");
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState("");
  const [copied, setCopied]         = useState(null);
  const [mobileTab, setMobileTab]   = useState("input"); // "input" | "results"
  const resultRef                   = useRef(null);

  // ── Load theme + brand ────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const t = localStorage.getItem(THEME_KEY);
      const resolved = (t === "light" || t === "dark") ? t : "dark";
      setTheme(resolved);
      document.documentElement.setAttribute("data-theme", resolved);
      const saved = localStorage.getItem("alloy_current_brand");
      if (saved) setBrand({ ...NIKE_DEFAULTS, ...JSON.parse(saved) });
    } catch {
      document.documentElement.setAttribute("data-theme", "dark");
    }
    setBLoaded(true);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem(THEME_KEY, next); } catch {}
  };

  // ── Auto-save brand ───────────────────────────────────────────────────────
  const handleBrandChange = useCallback((field, value) => {
    setBrand(prev => {
      const next = { ...prev, [field]: value };
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        try {
          localStorage.setItem("alloy_current_brand", JSON.stringify(next));
          clearTimeout(flashTimer.current);
          setSavedFlash(true);
          flashTimer.current = setTimeout(() => setSavedFlash(false), 2000);
        } catch {}
      }, 500);
      return next;
    });
  }, []);

  // ── Toggle campaigns ──────────────────────────────────────────────────────
  const toggleCampaign = (tag) =>
    setCampaigns(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  // ── Score ─────────────────────────────────────────────────────────────────
  const canScore = brand.name.trim() && talentName.trim() && talentType;

  const handleScore = async () => {
    if (!canScore) return;
    setLoading(true); setResult(null); setError("");
    try {
      setPhase("searching");
      const searchRes = await fetch("/api/search", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `"${talentName}" brand partnerships endorsements reputation ${talentType} ${new Date().getFullYear()}`,
        }),
      });
      const searchData = await searchRes.json();
      if (!searchRes.ok) throw new Error(searchData.error || "Search failed");

      const researchContext = [
        searchData.answer ? `Summary: ${searchData.answer}` : "",
        ...(searchData.results || []).map((r, i) => `[${i+1}] ${r.title}\n${r.content?.slice(0,300)}`),
      ].filter(Boolean).join("\n\n");

      setPhase("scoring");
      const marketsStr = Array.isArray(brand.markets) ? brand.markets.join(", ") : brand.markets;
      const scoreRes = await fetch("/api/score", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          talentName, talentType, campaigns, notes,
          brandProfile: { ...brand, markets: marketsStr },
          researchContext,
        }),
      });
      const scoreData = await scoreRes.json();
      if (!scoreRes.ok) throw new Error(scoreData.error || "Scoring failed");

      setResult(scoreData.result);
      setMobileTab("results");
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false); setPhase("");
    }
  };

  // ── Memo builder ──────────────────────────────────────────────────────────
  const buildMemo = () => {
    if (!result) return "";
    const markets = Array.isArray(brand.markets) ? brand.markets.join(", ") : brand.markets;
    return [
      `ALLOY INDEX — PARTNERSHIP ASSESSMENT`,
      `${"─".repeat(56)}`,
      `Brand:   ${brand.name}`,
      `Talent:  ${talentName}  |  Type: ${talentType}`,
      `Date:    ${new Date().toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" })}`,
      ``,
      `VERDICT: ${result.overall_verdict}  |  SCORE: ${result.overall_score}/100`,
      `DEAL TYPE: ${result.deal_type_recommendation}`,
      ``,
      `"${result.deal_headline}"`,
      ``,
      `EXECUTIVE SUMMARY`,
      `${"─".repeat(56)}`,
      result.exec_summary,
      ``,
      `RECOMMENDED ACTIVATION`,
      result.recommended_activation,
      result.risk_flag ? `\n⚠  RISK FLAG\n${result.risk_flag}` : "",
      ``,
      `DIMENSION SCORES`,
      `${"─".repeat(56)}`,
      ...DIMS.map(d => {
        const dim = result.scores?.[d.key]; if (!dim) return "";
        return [``,`${d.label.toUpperCase()}  ${dim.score}/100`,dim.headline,dim.analysis,
          `  ↑ ${(dim.strengths||[]).join("; ")}`,`  ↓ ${(dim.watchouts||[]).join("; ")}`].join("\n");
      }),
      ``,`${"─".repeat(56)}`,
      `IDEAL MARKETS: ${(result.ideal_markets||[]).join(", ")}`,
      `COMPARABLE DEALS`,
      ...(result.comparable_deals||[]).map(d=>`  • ${d}`),
      ``,`${"─".repeat(56)}`,
      `Generated by Alloy Index (Gemini 2.5 Flash)`,
    ].filter(l=>l!==undefined).join("\n");
  };

  const copyMemo = () => {
    navigator.clipboard.writeText(buildMemo()).then(() => {
      setCopied("copy"); setTimeout(() => setCopied(null), 2000);
    });
  };

  const downloadTxt = () => {
    const blob = new Blob([buildMemo()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const slug = `${brand.name}-${talentName}`.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"");
    a.href = url; a.download = `alloy-memo-${slug}.txt`; a.click();
    URL.revokeObjectURL(url);
    setCopied("txt"); setTimeout(() => setCopied(null), 2000);
  };

  const exportEmail = () => {
    const subject = encodeURIComponent(`Alloy Index: ${brand.name} × ${talentName} — ${result.overall_verdict} (${result.overall_score}/100)`);
    const body = encodeURIComponent([
      `ALLOY INDEX ASSESSMENT`,`Brand: ${brand.name}  |  Talent: ${talentName}`,``,
      `VERDICT: ${result.overall_verdict}  |  SCORE: ${result.overall_score}/100`,``,
      `"${result.deal_headline}"`,``,result.exec_summary,``,
      `ACTIVATION: ${result.recommended_activation}`,``,
      result.risk_flag ? `⚠ RISK: ${result.risk_flag}` : "",``,
      `SCORES:`,
      ...DIMS.map(d=>{ const dim=result.scores?.[d.key]; return dim?`${d.label}: ${dim.score}/100`:""; }),
      ``,`Deal Type: ${result.deal_type_recommendation}`,
      `Markets: ${(result.ideal_markets||[]).join(", ")}`,
    ].filter(Boolean).join("\n"));
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const printPdf = () => window.print();

  // ─── Render ────────────────────────────────────────────────────────────────

  if (!brandLoaded) return null;

  const vcfg = result ? (VERDICT_CFG[result.overall_verdict] || VERDICT_CFG["BORDERLINE"]) : null;
  const isLight = theme === "light";

  const divider = <div style={{ height: 1, background: "var(--border)", margin: "20px 0" }} />;

  // Export bar (reused in both mobile bottom bar and desktop)
  const ExportBar = () => result ? (
    <div className="export-bar" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {[
        { key: "copy",  icon: "⎘", label: "COPY",  done: "✓ COPIED"  },
        { key: "txt",   icon: "↓", label: "TXT",   done: "✓ SAVED"   },
        { key: "email", icon: "✉", label: "EMAIL", done: "OPENED"    },
        { key: "pdf",   icon: "⎙", label: "PDF",   done: "PRINTING…" },
      ].map(({ key, icon, label, done }) => {
        const fn = { copy: copyMemo, txt: downloadTxt, email: exportEmail, pdf: printPdf }[key];
        const active = copied === key;
        return (
          <button key={key} onClick={fn} style={{
            padding: "8px 14px", borderRadius: "var(--radius-sm)", cursor: "pointer",
            background: active ? "rgba(34,197,94,0.1)" : "var(--tag-bg)",
            border: `1px solid ${active ? "rgba(34,197,94,0.3)" : "var(--border)"}`,
            color: active ? "#22c55e" : "var(--text2)",
            fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700,
            letterSpacing: "0.1em", transition: "all 0.2s", whiteSpace: "nowrap",
          }}>
            {icon} {active ? done : label}
          </button>
        );
      })}
    </div>
  ) : null;

  // ── Left panel contents ───────────────────────────────────────────────────
  const LeftPanel = () => (
    <div className="left-panel" style={{
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: "var(--radius)", padding: 24,
      position: "sticky", top: 20,
    }}>
      <ProfileManager
        current={brand}
        onLoad={b => setBrand({ ...EMPTY_BRAND, ...b })}
      />

      <BrandPanel brand={brand} onChange={handleBrandChange} savedFlash={savedFlash} />

      {divider}

      {/* Talent */}
      <div style={{ marginBottom: 16 }}>
        <label style={LABEL_STYLE}>TALENT / PARTNER *</label>
        <input value={talentName} onChange={e => setTalentName(e.target.value)}
          placeholder="e.g. Sabrina Carpenter, LeBron James…"
          style={getInputStyle()}
          onFocus={e => e.target.style.borderColor = "var(--red-border)"}
          onBlur={e => e.target.style.borderColor = "var(--border)"} />
      </div>

      {/* Type */}
      <div style={{ marginBottom: 16 }}>
        <label style={LABEL_STYLE}>PARTNER TYPE *</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {TALENT_TYPES.map(t => {
            const active = talentType === t.id;
            return (
              <button key={t.id} onClick={() => setTalentType(t.id)} style={{
                padding: "8px 10px", borderRadius: "var(--radius-sm)", cursor: "pointer",
                textAlign: "left", transition: "all 0.15s",
                background: active ? "var(--red-soft)" : "var(--tag-bg)",
                border: `1px solid ${active ? "var(--red-border)" : "var(--border)"}`,
                color: active ? "var(--text)" : "var(--muted)",
                fontFamily: "var(--font-body)", fontSize: 12,
              }}>
                <span style={{ marginRight: 5 }}>{t.icon}</span>{t.id}
              </button>
            );
          })}
        </div>
      </div>

      {/* Campaigns */}
      <div style={{ marginBottom: 16 }}>
        <label style={LABEL_STYLE}>CAMPAIGN CONTEXT</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {CAMPAIGN_TAGS.map(tag => (
            <Chip key={tag} label={tag} active={campaigns.includes(tag)}
              onClick={() => toggleCampaign(tag)} small />
          ))}
        </div>
      </div>

      {/* Notes */}
      <div style={{ marginBottom: 20 }}>
        <label style={LABEL_STYLE}>NOTES</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Budget range, existing relationships, deal flags…"
          rows={2} style={{ ...getInputStyle(), resize: "vertical", lineHeight: 1.55 }} />
      </div>

      {/* Score button */}
      <button onClick={handleScore} disabled={!canScore || loading} style={{
        width: "100%", padding: "13px 20px",
        background: canScore && !loading ? "var(--red)" : "var(--tag-bg)",
        border: `1px solid ${canScore && !loading ? "var(--red)" : "var(--border)"}`,
        borderRadius: "var(--radius-sm)", color: canScore && !loading ? "#fff" : "var(--muted)",
        fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 800,
        letterSpacing: "0.14em", cursor: canScore && !loading ? "pointer" : "not-allowed",
        transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
      }}>
        {loading ? (
          <>
            <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)",
              borderTopColor: "#fff", borderRadius: "50%", display: "inline-block",
              animation: "spin 0.7s linear infinite" }} />
            {phase === "searching" ? "RESEARCHING…" : "ANALYZING…"}
          </>
        ) : "RUN ASSESSMENT"}
      </button>

      {error && (
        <div style={{ marginTop: 12, padding: "10px 14px",
          background: "rgba(200,16,46,0.07)", border: "1px solid rgba(200,16,46,0.2)",
          borderRadius: "var(--radius-sm)", color: "var(--red)", fontSize: 12,
          fontFamily: "var(--font-body)", lineHeight: 1.5 }}>
          {error}
        </div>
      )}
    </div>
  );

  // ── Results panel ─────────────────────────────────────────────────────────
  const ResultsPanel = () => (
    <div ref={resultRef}>
      {!result && !loading && (
        <div style={{
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", minHeight: 480,
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: 12, padding: 40, textAlign: "center",
        }}>
          <div style={{ fontSize: 36, opacity: 0.1, fontFamily: "var(--font-display)", letterSpacing: "0.2em" }}>◎</div>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 12, letterSpacing: "0.14em", color: "var(--muted)" }}>
            AWAITING ASSESSMENT
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--muted2)", maxWidth: 280, lineHeight: 1.65 }}>
            Fill in brand and talent details, then run an assessment to see scored results with live research.
          </p>
        </div>
      )}

      {loading && (
        <div style={{
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", minHeight: 480,
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: 20, padding: 40,
        }}>
          <div style={{ width: 36, height: 36, border: "2px solid var(--border2)",
            borderTopColor: "var(--red)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-display)", fontSize: 13, letterSpacing: "0.14em",
              color: "var(--text2)", marginBottom: 6 }}>
              {phase === "searching" ? "RESEARCHING TALENT" : "SCORING PARTNERSHIP FIT"}
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
              {phase === "searching"
                ? `Pulling live intel on ${talentName}…`
                : "Synthesizing research into scored analysis…"}
            </p>
          </div>
        </div>
      )}

      {result && (
        <div style={{ display: "grid", gap: 14, animation: "fadeUp 0.5s ease" }}>

          {/* ── Verdict bar ─────────────────────────────────────────────── */}
          <div style={{
            background: vcfg.bg, border: `1px solid ${vcfg.border}`,
            borderRadius: "var(--radius)", padding: "20px 24px",
          }}>
            <div className="verdict-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div className="verdict-stats" style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 9, letterSpacing: "0.16em", color: "var(--muted)", marginBottom: 3 }}>VERDICT</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 900, color: vcfg.color, letterSpacing: "0.03em", lineHeight: 1 }}>
                    {result.overall_verdict}
                  </div>
                </div>
                <div style={{ width: 1, height: 36, background: "var(--border)" }} />
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 9, letterSpacing: "0.16em", color: "var(--muted)", marginBottom: 3 }}>SCORE</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 38, fontWeight: 900, color: vcfg.color, lineHeight: 1 }}>
                    {result.overall_score}<span style={{ fontSize: 14, color: "var(--muted)", fontWeight: 400 }}>/100</span>
                  </div>
                </div>
                <div style={{ width: 1, height: 36, background: "var(--border)" }} />
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 9, letterSpacing: "0.16em", color: "var(--muted)", marginBottom: 3 }}>DEAL TYPE</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700, color: "var(--text)", letterSpacing: "0.02em" }}>
                    {result.deal_type_recommendation}
                  </div>
                </div>
              </div>
              <ExportBar />
            </div>
          </div>

          {/* ── Headline + Summary ───────────────────────────────────────── */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "20px 24px" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, letterSpacing: "0.02em", color: "var(--text)", marginBottom: 10 }}>
              "{result.deal_headline}"
            </div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", lineHeight: 1.7, marginBottom: 14 }}>
              {result.exec_summary}
            </p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 9, letterSpacing: "0.14em", color: "var(--muted)", marginBottom: 4 }}>ACTIVATION</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text2)", lineHeight: 1.55 }}>{result.recommended_activation}</div>
              </div>
              {result.risk_flag && (
                <div style={{ padding: "8px 14px", background: "rgba(249,115,22,0.07)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: "var(--radius-sm)", flexShrink: 0 }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 9, letterSpacing: "0.12em", color: "#f97316", marginRight: 6 }}>⚠ RISK</span>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#c2782f" }}>{result.risk_flag}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Radar + Dimensions ───────────────────────────────────────── */}
          <div className="radar-dim-grid" style={{ display: "grid", gridTemplateColumns: "270px 1fr", gap: 14 }}>

            {/* Radar */}
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "18px 12px" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 9, letterSpacing: "0.14em", color: "var(--muted)", textAlign: "center", marginBottom: 8 }}>
                DIMENSION RADAR
              </div>
              <RadarChart scores={Object.fromEntries(DIMS.map(d => [d.key, result.scores?.[d.key]?.score||0]))} theme={theme} />
              <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px" }}>
                {DIMS.map(d => {
                  const s = result.scores?.[d.key]?.score || 0;
                  return (
                    <div key={d.key} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: 9, letterSpacing: "0.06em", color: "var(--muted)" }}>
                        {d.label.split(" ")[0].toUpperCase()}
                      </span>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 800, color: scoreColor(s) }}>{s}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dimension cards */}
            <div className="dim-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, alignContent: "start" }}>
              {DIMS.map(d => {
                const dim = result.scores?.[d.key]; if (!dim) return null;
                const c = scoreColor(dim.score);
                return (
                  <div key={d.key} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: 9, letterSpacing: "0.1em", color: "var(--muted)" }}>{d.icon} {d.label.toUpperCase()}</span>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 900, color: c, lineHeight: 1 }}>{dim.score}</span>
                    </div>
                    <ScoreBar score={dim.score} />
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 700, color: "var(--text)", margin: "8px 0 5px", lineHeight: 1.3 }}>
                      {dim.headline}
                    </div>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text2)", lineHeight: 1.6, marginBottom: 8 }}>
                      {dim.analysis}
                    </p>
                    {(dim.strengths||[]).map((s,i) => (
                      <div key={i} style={{ fontSize: 10, color: "#22c55e", fontFamily: "var(--font-body)", marginBottom: 2 }}>↑ {s}</div>
                    ))}
                    {(dim.watchouts||[]).map((w,i) => (
                      <div key={i} style={{ fontSize: 10, color: "#f97316", fontFamily: "var(--font-body)", marginBottom: 2 }}>↓ {w}</div>
                    ))}
                  </div>
                );
              })}

              {/* Bottom row: comparables + markets */}
              <div style={{ gridColumn: "1 / -1", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "14px 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 9, letterSpacing: "0.12em", color: "var(--muted)", marginBottom: 8 }}>COMPARABLE DEALS</div>
                  {(result.comparable_deals||[]).map((deal,i) => (
                    <div key={i} style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text2)", marginBottom: 5, paddingLeft: 10, borderLeft: "2px solid var(--border2)", lineHeight: 1.4 }}>{deal}</div>
                  ))}
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 9, letterSpacing: "0.12em", color: "var(--muted)", marginBottom: 8 }}>IDEAL MARKETS</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {(result.ideal_markets||[]).map((m,i) => (
                      <span key={i} style={{ padding: "3px 10px", borderRadius: 20, background: "var(--red-soft)", border: "1px solid var(--red-border)", fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 700, color: "var(--red)" }}>{m}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: 80 }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header data-print-hide style={{
        borderBottom: "1px solid var(--border)",
        background: "var(--card)",
        position: "sticky", top: 0, zIndex: 100,
        backdropFilter: "blur(12px)",
      }}>
        <div className="header-inner" style={{
          maxWidth: 1300, margin: "0 auto",
          padding: "14px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {/* Wordmark */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: "var(--red)", display: "inline-block",
                boxShadow: "0 0 10px rgba(200,16,46,0.5)",
              }} />
              <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 900, letterSpacing: "0.06em", color: "var(--text)" }}>
                ALLOY INDEX
              </span>
            </div>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--muted)", letterSpacing: "0.01em" }}>
              a brand partnership assessment tool
            </span>
          </div>

          {/* Right controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 9, letterSpacing: "0.12em", color: "var(--muted)", textAlign: "right", lineHeight: 1.8 }}>
              <div>TAVILY RESEARCH</div>
              <div>GEMINI ANALYSIS</div>
            </div>
            {/* Theme toggle */}
            <button onClick={toggleTheme} title="Toggle light/dark" style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "var(--tag-bg)", border: "1px solid var(--border)",
              cursor: "pointer", fontSize: 16, display: "flex",
              alignItems: "center", justifyContent: "center", transition: "all 0.2s",
              color: "var(--text)",
            }}>
              {isLight ? "☽" : "☀"}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile tab bar ────────────────────────────────────────────────── */}
      <div className="mobile-tab-bar" data-print-hide style={{
        position: "sticky", top: 61, zIndex: 90,
        background: "var(--card)", borderBottom: "1px solid var(--border)",
        display: "flex",
      }}>
        {["input","results"].map(tab => (
          <button key={tab} onClick={() => setMobileTab(tab)} style={{
            flex: 1, padding: "12px", border: "none", cursor: "pointer",
            background: mobileTab === tab ? "var(--red-soft)" : "transparent",
            borderBottom: `2px solid ${mobileTab === tab ? "var(--red)" : "transparent"}`,
            color: mobileTab === tab ? "var(--red)" : "var(--muted)",
            fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 700,
            letterSpacing: "0.1em", transition: "all 0.2s",
          }}>
            {tab === "input" ? "◈ INPUTS" : `◉ RESULTS${result ? ` · ${result.overall_score}` : ""}`}
          </button>
        ))}
      </div>

      {/* ── Main grid ─────────────────────────────────────────────────────── */}
      <div className="main-grid" style={{
        maxWidth: 1300, margin: "0 auto", padding: "24px 20px",
        display: "grid", gridTemplateColumns: "390px 1fr", gap: 20, alignItems: "start",
      }}>
        {/* Left */}
        <div className={`left-panel ${mobileTab === "results" ? "mobile-hide" : ""}`}>
          <LeftPanel />
        </div>

        {/* Right */}
        <div className={mobileTab === "input" ? "mobile-hide" : ""}>
          <ResultsPanel />
        </div>
      </div>
    </div>
  );
}
