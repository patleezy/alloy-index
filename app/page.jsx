"use client";
import { useState, useEffect, useCallback, useRef } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const PROFILES_KEY  = "alloy_profiles";
const THEME_KEY     = "alloy_theme";
const FAVORITES_KEY = "alloy_favorites";
const HISTORY_KEY   = "alloy_history";

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


const RISK_PROFILE_CFG = {
  LOW:      { color: "#22c55e", bg: "rgba(34,197,94,0.06)",    border: "rgba(34,197,94,0.2)",    label: "LOW RISK" },
  MEDIUM:   { color: "#f59e0b", bg: "rgba(245,158,11,0.06)",   border: "rgba(245,158,11,0.2)",   label: "MEDIUM RISK" },
  HIGH:     { color: "#f97316", bg: "rgba(249,115,22,0.07)",   border: "rgba(249,115,22,0.25)",  label: "HIGH RISK" },
  CRITICAL: { color: "#C8102E", bg: "rgba(200,16,46,0.08)",    border: "rgba(200,16,46,0.3)",    label: "CRITICAL RISK" },
};

const SEV_CFG = {
  LOW:    { color: "#22c55e", icon: "◎" },
  MEDIUM: { color: "#f59e0b", icon: "⚠" },
  HIGH:   { color: "#f97316", icon: "▲" },
};

const VERDICT_CFG = {
  "STRONG PASS":      { color: "#22c55e", bg: "rgba(34,197,94,0.07)",   border: "rgba(34,197,94,0.2)" },
  "PASS":             { color: "#84cc16", bg: "rgba(132,204,18,0.07)",  border: "rgba(132,204,18,0.2)" },
  "CONDITIONAL PASS": { color: "#f59e0b", bg: "rgba(245,158,11,0.07)",  border: "rgba(245,158,11,0.2)" },
  "BORDERLINE":       { color: "#f97316", bg: "rgba(249,115,22,0.07)",  border: "rgba(249,115,22,0.2)" },
  "NO PASS":          { color: "#C8102E", bg: "rgba(200,16,46,0.07)",   border: "rgba(200,16,46,0.2)" },
};

const INDUSTRY_PROFILES = {
  "Consumer Electronics": {
    name: "Apple",
    values: "Innovation, simplicity, privacy, premium design, human creativity",
    audience: "Tech enthusiasts, creatives, professionals, students, Gen Z and Millennials, Apple ecosystem loyalists",
    context: "Think Different. World's most valuable consumer tech brand. Key products: iPhone, Mac, iPad, AirPods, Apple Watch. Deep investment in creative culture, music, film, and sports storytelling.",
  },
  "Audio / Music Tech": {
    name: "Beats",
    values: "Authentic self-expression, premium sound, cultural credibility, sport and music intersection",
    audience: "Music fans, athletes, Gen Z, Millennials, sneaker and streetwear culture, creatives",
    context: "Beats. The cultural intersection of music, sport, and style. Key products: Studio Pro, Solo 4, Powerbeats Pro 2, Beats Pill. Heavy investment in athlete and artist partnerships, cultural moments, and premium audio positioning under Apple.",
  },
  "Sportswear / Athletic": {
    name: "Nike",
    values: "Inspiring, innovative, authentic, performance-driven, inclusive",
    audience: "Athletes, Gen Z, Millennials, fitness enthusiasts, sneaker culture",
    context: "Just Do It. World's leading athletic footwear and apparel brand. Key products: Air Max, Jordan, React. Heavy investment in athlete storytelling and cultural moments.",
  },
  "Fashion / Apparel": {
    name: "Abercrombie & Fitch",
    values: "Confidence, inclusivity, self-expression, modern American style, quality",
    audience: "Gen Z, Millennials, 18-30 demographic, college culture, fashion-forward consumers",
    context: "Abercrombie & Fitch. Reinvented American fashion brand with a successful Gen Z pivot away from its controversial 2000s era. Key categories: denim, casual wear, occasion dressing. Heavy investment in body inclusivity, diverse casting, and social-first marketing.",
  },
  "Beauty / Personal Care": {
    name: "Glossier",
    values: "Effortless beauty, community-driven, skin first, authenticity, real people",
    audience: "Millennial and Gen Z women, beauty enthusiasts, skincare-first consumers, community-driven shoppers",
    context: "Glossier. The original D2C beauty brand built from a blog. Key products: Boy Brow, Cloud Paint, Balm Dotcom, Futuredew. Community and UGC-led marketing, minimal aesthetic, strong cult following. Recently expanding wholesale after years direct-only.",
  },
  "Food & Beverage": {
    name: "PepsiCo",
    values: "Positive choices, sustainability, fun, cultural relevance, diversity",
    audience: "Broad mass market, Gen Z and Millennials for flagship brands, athletes and health-conscious consumers for Gatorade and Quaker",
    context: "PepsiCo. Global food and beverage portfolio including Pepsi, Gatorade, Lay's, Doritos, Quaker. Major investor in music and sports sponsorships, Super Bowl advertising, and pop culture moments. Increasingly focused on health and sustainability positioning.",
  },
  "Automotive": {
    name: "Volvo",
    values: "Safety, sustainability, Scandinavian design, innovation, responsible luxury",
    audience: "Affluent professionals, families, environmentally conscious consumers, design-forward buyers, 35-55 demographic",
    context: "Volvo Cars. Premium Swedish automotive brand synonymous with safety and clean design. Committed to full electrification by 2030. Key models: XC90, XC60, EX90. Strong positioning around life, family, and responsible ownership.",
  },
  "Financial Services": {
    name: "Chase",
    values: "Empowerment, trust, financial confidence, access, community investment",
    audience: "Mass affluent consumers, Millennials and Gen Z building wealth, small business owners, sports and travel enthusiasts",
    context: "Chase. America's largest consumer bank and part of JPMorgan Chase. Key products: Sapphire credit cards, Chase Freedom, business banking. Major sports sponsorship portfolio including NBA, NFL, MLB venues. Strong investment in cultural and community programming.",
  },
  "Gaming": {
    name: "PlayStation",
    values: "Play has no limits, immersive storytelling, innovation, community, pushing boundaries",
    audience: "Core gamers 18-35, Gen Z, esports fans, entertainment seekers, global gaming community",
    context: "PlayStation by Sony. The world's leading gaming platform. Key products: PS5, PS5 Pro, PlayStation Network, PlayStation Studios exclusives including God of War, Spider-Man, and The Last of Us. Deep investment in narrative-driven games, esports, and gaming culture. Strong entertainment crossover with film and TV.",
  },
  "Streaming / Media": {
    name: "Disney",
    values: "Storytelling, imagination, family, magic, optimism, inclusivity",
    audience: "Families, children, nostalgic Millennials, franchise superfans, global audiences",
    context: "The Walt Disney Company. World's most powerful entertainment brand. Key properties: Disney+, Marvel, Star Wars, Pixar, ESPN, ABC. Unmatched IP portfolio driving theme parks, merchandise, and streaming. Strong focus on franchise storytelling, family entertainment, and emotional brand connection.",
  },
};

const INDUSTRIES = [
  ...Object.keys(INDUSTRY_PROFILES),
  "Other",
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
  const cx = 120, cy = 120, r = 76;
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
    <svg width="240" height="240" viewBox="0 0 240 240" style={{ display: "block", margin: "0 auto", width: "100%", maxWidth: 240 }}>
      {[0.25, 0.5, 0.75, 1].map(ring => {
        const rp = keys.map((_, i) => {
          const a = -Math.PI / 2 + i * step;
          return `${cx + r * ring * Math.cos(a)},${cy + r * ring * Math.sin(a)}`;
        }).join(" ");
        return <polygon key={ring} points={rp} fill="none"
          stroke={isLight ? (ring === 1 ? "#c8c3ba" : "#dedad3") : (ring === 1 ? "#2e2e2e" : "#232323")}
          strokeWidth="1" />;
      })}
      {[25, 50, 75].map(val => (
        <text key={val} x={cx + 3} y={cy - r * (val / 100) + 4}
          style={{ fill: isLight ? "#bbb" : "#2e2e2e", fontSize: 6, fontFamily: "monospace" }}>{val}</text>
      ))}
      {keys.map((_, i) => {
        const a = -Math.PI / 2 + i * step;
        return <line key={i} x1={cx} y1={cy}
          x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)}
          stroke={isLight ? "#d4cfc5" : "#222"} strokeWidth="1" />;
      })}
      <defs>
        <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#C8102E" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#C8102E" stopOpacity="0.04" />
        </radialGradient>
      </defs>
      <polygon points={poly} fill="url(#radarFill)" stroke="#C8102E" strokeWidth="1.5" strokeLinejoin="round" />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#C8102E" stroke={isLight ? "#faf8f4" : "#0d0d0d"} strokeWidth="1.5" />)}
      {labels.map((label, i) => {
        const a = -Math.PI / 2 + i * step;
        return (
          <text key={i} x={cx + (r + 20) * Math.cos(a)} y={cy + (r + 20) * Math.sin(a)}
            textAnchor="middle" dominantBaseline="middle"
            style={{ fill: isLight ? "#7a7570" : "#555", fontSize: 8,
              fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.08em", fontWeight: 600 }}>
            {label}
          </text>
        );
      })}
    </svg>
  );
}


// ─── Animated Score ───────────────────────────────────────────────────────────

function AnimatedScore({ target, color, fontSize = 38, duration = 900 }) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return (
    <span style={{ fontSize, fontWeight: 600, color, lineHeight: 1, fontFamily: "var(--font-display)", fontVariantNumeric: "tabular-nums" }}>
      {display}
    </span>
  );
}


// ─── Score Info Modal ─────────────────────────────────────────────────────────

const SCORE_INFO = {
  verdict: {
    title: "How Verdicts Are Generated",
    desc: "Scores are AI-generated — not a hard formula. Tavily pulls live web research on the talent, which is fed into Gemini alongside your brand profile. Gemini applies brand partnership expertise to reason across 5 dimensions. Think of it as a structured opinion from a well-informed analyst — always validate with your own team.",
    range: [
      { label: "80–100 · STRONG PASS / PASS", color: "#22c55e", note: "Strong alignment — proceed" },
      { label: "65–79 · CONDITIONAL PASS", color: "#f59e0b", note: "Solid fit with guardrails" },
      { label: "50–64 · BORDERLINE", color: "#f97316", note: "Significant conditions required" },
      { label: "0–49 · NO PASS", color: "#C8102E", note: "Do not proceed without major changes" },
    ]
  },
  roster: {
    title: "Roster vs. Active Promotion",
    desc: "Not all DO NOT PROCEED or PAUSE situations mean terminating a partnership. Brands sometimes maintain a talent on their sponsored roster without active promotion — keeping the contractual relationship intact while pausing campaigns until a legal or reputational situation resolves.",
    range: [
      { label: "PROCEED", color: "#22c55e", note: "Active campaign — safe to run" },
      { label: "PAUSE & MONITOR", color: "#f59e0b", note: "Maintain roster/contract, suspend active promotion. Reassess when situation resolves." },
      { label: "DO NOT PROCEED", color: "#C8102E", note: "Exit or do not enter — risk outweighs the relationship value" },
    ],
    examples: "Nike kept Kobe Bryant on roster during his 2003 Colorado case without active promotion, then resumed. Tiger Woods' sponsors paused campaigns after his 2009 incident while maintaining contracts. These decisions are strategic, not binary."
  },
  overall: {
    title: "Overall Score",
    desc: "A weighted composite of all 5 dimensions. 80–100 = strong strategic fit with manageable risk. 60–79 = solid fit with conditions. Below 60 = meaningful friction requiring mitigation.",
    range: [
      { label: "80–100 · STRONG PASS / PASS", color: "#22c55e", note: "Proceed — strong alignment" },
      { label: "65–79 · CONDITIONAL PASS", color: "#f59e0b", note: "Proceed with guardrails" },
      { label: "50–64 · BORDERLINE", color: "#f97316", note: "Significant conditions required" },
      { label: "0–49 · NO PASS", color: "#C8102E", note: "Do not proceed without major changes" },
    ]
  },
  cultural: { title: "Cultural Alignment", desc: "How well the talent's public persona, values, and cultural associations reinforce your brand identity. High scores mean the talent's image and story amplify your brand message organically." },
  audience: { title: "Audience Demographics", desc: "Overlap between the talent's fanbase and your target consumer. Considers age, income, geography, and psychographic fit. High scores mean the talent reaches exactly who you're trying to reach." },
  platform: { title: "Platform Reach", desc: "Total addressable reach across social, broadcast, press, and live. Considers follower counts, engagement rates, earned media value, and content virality potential." },
  safety: { title: "Brand Safety", desc: "Risk assessment of controversies, past incidents, associations, and reputational exposure. High scores mean clean, predictable brand behavior with low litigation or PR risk." },
  international: { title: "International Reach", desc: "Strength of the talent's profile in your key global markets. High scores mean genuine recognition and cultural relevance beyond their home market." },
};

function ScoreInfoModal({ dim, onClose }) {
  const info = SCORE_INFO[dim] || SCORE_INFO.overall;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
      <div onClick={e => e.stopPropagation()} style={{
        position: "relative", background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: "var(--radius)", padding: "24px 28px", maxWidth: 420, width: "100%",
        boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        animation: "fadeUp 0.2s ease",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 800, letterSpacing: "0.06em", color: "var(--text)" }}>
            {info.title.toUpperCase()}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 16, padding: "0 4px", fontFamily: "var(--font-display)" }}>✕</button>
        </div>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", lineHeight: 1.7, marginBottom: info.range ? 16 : 0 }}>
          {info.desc}
        </p>
        {info.range && (
          <div style={{ display: "grid", gap: 8, marginBottom: info.examples ? 14 : 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 9, letterSpacing: "0.12em", color: "var(--muted)", marginBottom: 2 }}>
              {info.title === "Roster vs. Active Promotion" ? "DECISION FRAMEWORK" : "VERDICT SCALE"}
            </div>
            {info.range.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 3, height: 28, background: r.color, borderRadius: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700, color: r.color, letterSpacing: "0.04em" }}>{r.label}</div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--muted)" }}>{r.note}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {info.examples && (
          <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", marginTop: 4 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 9, letterSpacing: "0.1em", color: "var(--muted)", marginBottom: 5 }}>PRECEDENTS</div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text2)", lineHeight: 1.65, margin: 0 }}>{info.examples}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoBtn({ dim, onOpen }) {
  return (
    <button onClick={() => onOpen(dim)} style={{
      width: 16, height: 16, borderRadius: "50%", border: "1px solid var(--border2)",
      background: "var(--tag-bg)", color: "var(--muted)", cursor: "pointer",
      fontFamily: "var(--font-body)", fontSize: 9, fontWeight: 700,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, transition: "all 0.15s", lineHeight: 1,
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--red-border)"; e.currentTarget.style.color = "var(--red)"; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.color = "var(--muted)"; }}
    >i</button>
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

// ─── Input / Label styles ────────────────────────────────────────────────────

const INPUT_STYLE = {
  width: "100%", background: "var(--input-bg)", border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)", padding: "9px 12px",
  color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 13,
  outline: "none", transition: "border-color 0.2s",
};

const getInputStyle = () => INPUT_STYLE;

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
              style={{ ...INPUT_STYLE, fontSize: 12 }}
              onKeyDown={e => e.key === "Enter" && save()}
            />
            <button onClick={save} style={{
              padding: "0 14px", background: "var(--red)", border: "none",
              borderRadius: "var(--radius-sm)", color: "#fff",
              fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700,
              letterSpacing: "0.08em", cursor: "pointer", whiteSpace: "nowrap",
            }}>SAVE</button>
          </div>

          {/* Example profiles */}
          <div style={{ fontFamily: "var(--font-display)", fontSize: 9, letterSpacing: "0.1em", color: "var(--muted)", marginBottom: 4 }}>
            EXAMPLES — select industry to auto-fill
          </div>
          {Object.entries(INDUSTRY_PROFILES).map(([industry, data]) => (
            <div key={industry} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "7px 10px", background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
            }}>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{data.name}</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "var(--muted)" }}>{industry}</div>
              </div>
              <button onClick={() => { onLoad({ ...data, industry, markets: [] }); setOpen(false); }} style={{
                padding: "4px 10px", background: "var(--red-soft)", border: "1px solid var(--red-border)",
                borderRadius: 4, color: "var(--red)", fontFamily: "var(--font-display)",
                fontSize: 10, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
              }}>LOAD</button>
            </div>
          ))}

          {/* Custom saved profiles */}
          {Object.keys(profiles).length > 0 && (
            <>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 9, letterSpacing: "0.1em", color: "var(--muted)", marginTop: 8, marginBottom: 4 }}>
                CUSTOM
              </div>
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
            </>
          )}
          {Object.keys(profiles).length === 0 && (
            <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--muted)", fontStyle: "italic", marginTop: 8 }}>
              No custom profiles yet — fill in your brand details and hit SAVE above.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Brand Panel ──────────────────────────────────────────────────────────────

function BrandPanel({ brand, onChange, savedFlash }) {
  const onChangeName     = useCallback((e) => onChange("name",     e.target.value), [onChange]);
  const onChangeIndustry = useCallback((e) => {
    const industry = e.target.value;
    onChange("industry", industry);
    // Auto-fill brand profile if a preset exists for this industry
    if (industry && INDUSTRY_PROFILES[industry]) {
      const preset = INDUSTRY_PROFILES[industry];
      onChange("name",     preset.name);
      onChange("values",   preset.values);
      onChange("audience", preset.audience);
      onChange("context",  preset.context);
    }
  }, [onChange]);
  const onChangeValues   = useCallback((e) => onChange("values",   e.target.value), [onChange]);
  const onChangeAudience = useCallback((e) => onChange("audience", e.target.value), [onChange]);
  const onChangeContext  = useCallback((e) => onChange("context",  e.target.value), [onChange]);

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
            <input value={brand.name || ""} onChange={onChangeName} style={INPUT_STYLE} placeholder="e.g. Nike" />
          </div>
          <div>
            <label style={LABEL_STYLE}>Industry</label>
            <select value={brand.industry || ""} onChange={onChangeIndustry}
              style={{ ...INPUT_STYLE, cursor: "pointer" }}>
              <option value="">Select…</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label style={LABEL_STYLE}>Brand Values</label>
          <input value={brand.values || ""} onChange={onChangeValues} style={INPUT_STYLE} placeholder="e.g. Inspiring, innovative, performance-driven" />
        </div>

        <div>
          <label style={LABEL_STYLE}>Target Audience</label>
          <input value={brand.audience || ""} onChange={onChangeAudience} style={INPUT_STYLE} placeholder="e.g. Gen Z, Millennials, athletes" />
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
          <textarea value={brand.context || ""} onChange={onChangeContext}
            placeholder="Products, recent campaigns, positioning notes…"
            rows={2} style={{ ...INPUT_STYLE, resize: "vertical", lineHeight: 1.55 }} />
        </div>
      </div>
    </div>
  );
}


// ─── Favorites Drawer ─────────────────────────────────────────────────────────

function FavoritesDrawer({ open, onClose, onLoad, currentResult, currentInputs }) {
  const [favs, setFavs]       = useState([]);
  const [history, setHistory] = useState([]);
  const [drawerTab, setDrawerTab] = useState("saved"); // "saved" | "recent"

  useEffect(() => {
    if (!open) return;
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) setFavs(JSON.parse(stored));
    } catch {}
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch {}
  }, [open]);

  const saveCurrent = () => {
    if (!currentResult) return;
    const entry = {
      id: Date.now(),
      savedAt: new Date().toISOString(),
      talentName: currentInputs.talentName,
      talentType: currentInputs.talentType,
      brandName: currentInputs.brandName,
      verdict: currentResult.overall_verdict,
      score: currentResult.overall_score,
      dealHeadline: currentResult.deal_headline,
      result: currentResult,
      inputs: currentInputs,
    };
    const next = [entry, ...favs].slice(0, 50);
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(next)); } catch {}
    setFavs(next);
  };

  const remove = (id) => {
    const next = favs.filter(f => f.id !== id);
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(next)); } catch {}
    setFavs(next);
  };

  const vcfgColor = (v) => {
    const map = { "STRONG PASS": "#22c55e", "PASS": "#84cc16", "CONDITIONAL PASS": "#f59e0b", "BORDERLINE": "#f97316", "NO PASS": "#C8102E" };
    return map[v] || "#888";
  };

  if (!open) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      display: "flex", justifyContent: "flex-end",
    }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} />

      {/* Panel */}
      <div style={{
        position: "relative", width: 380, maxWidth: "95vw",
        background: "var(--card)", borderLeft: "1px solid var(--border)",
        height: "100vh", overflowY: "auto", zIndex: 1,
        display: "flex", flexDirection: "column",
        boxShadow: "-8px 0 32px rgba(0,0,0,0.3)",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 20px 16px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "var(--grad-header)", position: "sticky", top: 0, zIndex: 1,
          backdropFilter: "blur(12px)",
        }}>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { key: "saved", label: `◎ SAVED (${favs.length})` },
              { key: "recent", label: `⏱ RECENT (${history.length})` },
            ].map(t => (
              <button key={t.key} onClick={() => setDrawerTab(t.key)} style={{
                padding: "6px 12px", borderRadius: "var(--radius-sm)", cursor: "pointer", border: "none",
                background: drawerTab === t.key ? "var(--red-soft)" : "var(--tag-bg)",
                borderBottom: `2px solid ${drawerTab === t.key ? "var(--red)" : "transparent"}`,
                color: drawerTab === t.key ? "var(--red)" : "var(--muted)",
                fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
              }}>{t.label}</button>
            ))}
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: "50%", border: "1px solid var(--border)",
            background: "var(--tag-bg)", cursor: "pointer", color: "var(--text2)",
            fontFamily: "var(--font-display)", fontSize: 14, display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        {/* Save current button */}
        {currentResult && (
          <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)" }}>
            <button onClick={saveCurrent} style={{
              width: "100%", padding: "10px 16px",
              background: "var(--red-soft)", border: "1px solid var(--red-border)",
              borderRadius: "var(--radius-sm)", color: "var(--red)",
              fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 700,
              letterSpacing: "0.1em", cursor: "pointer", transition: "all 0.2s",
            }}>
              + SAVE CURRENT ASSESSMENT
            </button>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "var(--muted)", marginTop: 6, textAlign: "center" }}>
              {currentInputs.brandName} x {currentInputs.talentName}
            </div>
          </div>
        )}

        {/* List */}
        <div style={{ flex: 1, padding: "12px 16px", display: "grid", gap: 8 }}>

          {/* ── Recent tab ─── */}
          {drawerTab === "recent" && history.length === 0 && (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 28, opacity: 0.15, marginBottom: 12 }}>⏱</div>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 11, letterSpacing: "0.12em", color: "var(--muted)" }}>NO RECENT SEARCHES</p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--muted)", marginTop: 6, lineHeight: 1.55 }}>
                Completed assessments appear here automatically.
              </p>
            </div>
          )}
          {drawerTab === "recent" && history.map(entry => (
            <div key={entry.id} style={{
              background: "var(--tag-bg)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)", padding: "12px 14px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 800, color: "var(--text)", letterSpacing: "0.02em" }}>
                    {entry.talentName}
                  </div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "var(--muted)", marginTop: 1 }}>
                    {entry.brandName} · {entry.talentType}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, color: vcfgColor(entry.verdict) }}>
                    {entry.score}
                  </div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 8, color: "var(--muted)", letterSpacing: "0.06em" }}>
                    {new Date(entry.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </div>
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", color: vcfgColor(entry.verdict), marginBottom: 8 }}>
                {entry.verdict}
              </div>
              <button onClick={() => { onLoad(entry); onClose(); }} style={{
                width: "100%", padding: "7px", background: "var(--red-soft)",
                border: "1px solid var(--red-border)", borderRadius: 4,
                color: "var(--red)", fontFamily: "var(--font-display)",
                fontSize: 10, fontWeight: 700, cursor: "pointer", letterSpacing: "0.08em",
              }}>LOAD RESULT</button>
            </div>
          ))}

          {/* ── Saved tab ─── */}
          {drawerTab === "saved" && favs.length === 0 && (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 28, opacity: 0.15, marginBottom: 12 }}>◎</div>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 11, letterSpacing: "0.12em", color: "var(--muted)" }}>NO SAVED ASSESSMENTS</p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--muted)", marginTop: 6, lineHeight: 1.55 }}>
                Run an assessment then click Save to build your wishlist.
              </p>
            </div>
          )}
          {drawerTab === "saved" && favs.map(fav => (
            <div key={fav.id} style={{
              background: "var(--tag-bg)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)", padding: "12px 14px",
              transition: "border-color 0.15s",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 800, color: "var(--text)", letterSpacing: "0.02em" }}>
                    {fav.talentName}
                  </div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "var(--muted)", marginTop: 1 }}>
                    {fav.brandName} · {fav.talentType}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{
                    fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600,
                    color: vcfgColor(fav.verdict), lineHeight: 1,
                  }}>{fav.score}</span>
                  <button onClick={() => remove(fav.id)} style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--muted)", fontSize: 11, padding: "2px 4px",
                    fontFamily: "var(--font-display)",
                  }}>✕</button>
                </div>
              </div>
              <div style={{
                fontFamily: "var(--font-display)", fontSize: 9, fontWeight: 700,
                letterSpacing: "0.08em", color: vcfgColor(fav.verdict), marginBottom: 6,
              }}>{fav.verdict}</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "var(--text2)", lineHeight: 1.45, marginBottom: 8 }}>
                "{fav.dealHeadline}"
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => { onLoad(fav); onClose(); }} style={{
                  flex: 1, padding: "6px 10px",
                  background: "var(--red-soft)", border: "1px solid var(--red-border)",
                  borderRadius: 4, color: "var(--red)",
                  fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 700,
                  letterSpacing: "0.08em", cursor: "pointer",
                }}>LOAD RESULTS</button>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 9, color: "var(--muted)", display: "flex", alignItems: "center" }}>
                  {new Date(fav.savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
              </div>
            </div>
          ))}
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
  const [brandLoaded, setBLoaded]   = useState(true);
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
  const [mobileTab, setMobileTab]   = useState("brand"); // "brand" | "results"
  const [favsOpen, setFavsOpen]       = useState(false);
  const [infoModal, setInfoModal]     = useState(null); // dim key or null
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
    setBrand(prev => ({ ...prev, [field]: value }));
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setBrand(current => {
        try {
          localStorage.setItem("alloy_current_brand", JSON.stringify(current));
          clearTimeout(flashTimer.current);
          setSavedFlash(true);
          flashTimer.current = setTimeout(() => setSavedFlash(false), 2000);
        } catch {}
        return current;
      });
    }, 600);
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
      // ── Phase 1: Tavily web research ──────────────────────────────────────
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

      // ── Phase 2: Score + Controversy in parallel ───────────────────────────
      setPhase("scoring");
      const marketsStr = Array.isArray(brand.markets) ? brand.markets.join(", ") : brand.markets;
      const sharedPayload = { talentName, talentType, brandProfile: { ...brand, markets: marketsStr }, researchContext };

      const [scoreRes, controversyRes] = await Promise.all([
        fetch("/api/score", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...sharedPayload, campaigns, notes }),
        }),
        fetch("/api/controversy", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sharedPayload),
        }),
      ]);

      const scoreData = await scoreRes.json();
      if (!scoreRes.ok) throw new Error(scoreData.error || "Scoring failed");

      // Controversy is non-blocking — if it fails, degrade gracefully
      let controversyFlags = null;
      if (controversyRes.ok) {
        const controversyData = await controversyRes.json();
        controversyFlags = controversyData.result || null;
      } else {
        console.warn("Controversy analysis failed — proceeding without flags");
      }

      // Merge controversy into result
      const baseResult = scoreData.result;
      const rec = controversyFlags?.recommendation || "PROCEED";

      // Apply score + verdict cap if PAUSE or DO_NOT_PROCEED
      let cappedScore = baseResult.overall_score;
      let cappedVerdict = baseResult.overall_verdict;
      let scoreWasCapped = false;
      const originalScore = baseResult.overall_score;

      if (rec === "DO_NOT_PROCEED" || rec === "PAUSE_AND_MONITOR") {
        const cap = 64; // Top of BORDERLINE
        if (cappedScore > cap) {
          cappedScore = cap;
          scoreWasCapped = true;
        }
        // Cap verdict to CONDITIONAL PASS at most
        const verdictOrder = ["STRONG PASS", "PASS", "CONDITIONAL PASS", "BORDERLINE", "NO PASS"];
        const currentIdx = verdictOrder.indexOf(cappedVerdict);
        const capIdx = verdictOrder.indexOf("CONDITIONAL PASS");
        if (currentIdx < capIdx) {
          cappedVerdict = "CONDITIONAL PASS";
          scoreWasCapped = true;
        }
      }

      const merged = {
        ...baseResult,
        overall_score: cappedScore,
        overall_verdict: cappedVerdict,
        score_was_capped: scoreWasCapped,
        original_score: originalScore,
        controversy_flags: controversyFlags
          ? { ...controversyFlags, recommendation: rec }
          : null,
      };

      setResult(merged);

      // Auto-save to search history (cap at 20)
      try {
        const histRaw = localStorage.getItem(HISTORY_KEY);
        const hist = histRaw ? JSON.parse(histRaw) : [];
        const entry = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          talentName,
          talentType,
          brandName: brand.name,
          industry: brand.industry,
          verdict: merged.overall_verdict,
          score: merged.overall_score,
          result: merged,
          inputs: { talentName, talentType, brand: { ...brand } },
        };
        const next = [entry, ...hist].slice(0, 20);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {}

      setMobileTab("results");
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("503") || msg.includes("overloaded") || msg.includes("busy")) {
        setError("Gemini is temporarily busy — please try again in a moment.");
      } else if (msg.includes("timed out") || msg.includes("504")) {
        setError("Analysis took too long — please try again. It usually works on the second attempt.");
      } else if (msg.includes("Search failed")) {
        setError("Live research failed — check your Tavily API key or try again.");
      } else {
        setError(msg || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false); setPhase("");
    }
  };

  // ── Memo builder ──────────────────────────────────────────────────────────
  const SEP = "─".repeat(52);

  const buildMemo = () => {
    if (!result) return "";
    const markets = Array.isArray(brand.markets) ? brand.markets.join(", ") : brand.markets;
    const cf = result.controversy_flags;
    const flagLines = cf?.flags?.length
      ? [
          ``,
          `CONTROVERSY FLAGS  [${cf.risk_profile} RISK]`,
          SEP,
          cf.risk_profile_rationale,
          ``,
          ...(cf.flags || []).flatMap(f => [
            `[${f.severity}] ${f.category.toUpperCase()} — ${f.title}`,
            f.detail,
            `Brand impact: ${f.brand_impact}`,
            f.mitigations?.length ? `Mitigations: ${f.mitigations.join("; ")}` : "",
            ``,
          ]).filter(Boolean),
          `Risk-Averse Note: ${cf.brand_risk_averse_note}`,
        ]
      : [``, `CONTROVERSY FLAGS`, SEP, `No significant flags identified.`];

    const lines = [
      `ALLOY INDEX — PARTNERSHIP ASSESSMENT`,
      SEP,
      `Brand:    ${brand.name}`,
      `Talent:   ${talentName}`,
      `Type:     ${talentType}`,
      `Date:     ${new Date().toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" })}`,
      ``,
      `VERDICT`,
      SEP,
      `${result.overall_verdict}  |  ${result.overall_score}/100`,
      `Deal Type: ${result.deal_type_recommendation}`,
      ``,
      `"${result.deal_headline}"`,
      ``,
      `EXECUTIVE SUMMARY`,
      SEP,
      result.exec_summary,
      ``,
      `RECOMMENDED ACTIVATION`,
      SEP,
      result.recommended_activation,
      result.risk_flag ? `\n⚠  KEY RISK: ${result.risk_flag}` : "",
      ``,
      `DIMENSION SCORES`,
      SEP,
      ...DIMS.flatMap(d => {
        const dim = result.scores?.[d.key]; if (!dim) return [];
        return [
          ``,
          `${d.label.toUpperCase()}  —  ${dim.score}/100`,
          dim.headline,
          dim.analysis,
          (dim.strengths||[]).map(s => `  ↑ ${s}`).join("\n"),
          (dim.watchouts||[]).map(w => `  ↓ ${w}`).join("\n"),
        ].filter(Boolean);
      }),
      ...flagLines,
      ``,
      `MARKETS & COMPARABLE DEALS`,
      SEP,
      `Ideal Markets: ${(result.ideal_markets||[]).join(", ")}`,
      ``,
      `Comparable Deals:`,
      ...(result.comparable_deals||[]).map(d => `  • ${d}`),
      ``,
      SEP,
      `Generated by Alloy Index`,
      `For directional purposes only. Not professional advice.`,
    ];
    return lines.filter(l => l !== undefined && l !== null).join("\n");
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
    const cf = result.controversy_flags;
    // Use \r\n for email client compatibility; keep body concise to avoid URL length limits
    const NL = "\r\n";
    const lines = [
      `ALLOY INDEX — PARTNERSHIP ASSESSMENT`,
      `Brand: ${brand.name}`,
      `Talent: ${talentName}  |  Type: ${talentType}`,
      `Date: ${new Date().toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" })}`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `VERDICT: ${result.overall_verdict}`,
      `SCORE: ${result.overall_score}/100`,
      `DEAL TYPE: ${result.deal_type_recommendation}`,
      ``,
      `"${result.deal_headline}"`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `EXECUTIVE SUMMARY`,
      result.exec_summary,
      ``,
      `ACTIVATION`,
      result.recommended_activation,
      result.risk_flag ? `\n⚠ KEY RISK: ${result.risk_flag}` : "",
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `DIMENSION SCORES`,
      ...DIMS.map(d => { const dim = result.scores?.[d.key]; return dim ? `${d.label}: ${dim.score}/100  — ${dim.headline}` : ""; }),
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `CONTROVERSY FLAGS: ${cf?.risk_profile || "N/A"} RISK`,
      cf?.flags?.length
        ? cf.flags.map(f => `[${f.severity}] ${f.title}`).join(NL)
        : `No significant flags identified.`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `IDEAL MARKETS: ${(result.ideal_markets||[]).join(", ")}`,
      ``,
      `COMPARABLE DEALS`,
      ...(result.comparable_deals||[]).map(d => `• ${d}`),
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Generated by Alloy Index. For directional purposes only.`,
    ].filter(l => l !== undefined && l !== null);

    const subject = encodeURIComponent(`Alloy Index: ${brand.name} × ${talentName} — ${result.overall_verdict} (${result.overall_score}/100)`);
    const body = encodeURIComponent(lines.join(NL));
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const printPdf = () => window.print();

  const downloadCsv = () => {
    if (!result) return;
    const rows = [
      ["Brand", "Talent", "Type", "Date", "Verdict", "Overall Score", "Deal Type", "Deal Headline", "Exec Summary", "Activation", "Risk Flag"],
      [brand.name, talentName, talentType, new Date().toLocaleDateString(), result.overall_verdict, result.overall_score, result.deal_type_recommendation, result.deal_headline, result.exec_summary, result.recommended_activation, result.risk_flag || ""],
      [],
      ["Dimension", "Score", "Headline", "Analysis", "Strengths", "Watchouts"],
      ...DIMS.map(d => {
        const dim = result.scores?.[d.key];
        return dim ? [d.label, dim.score, dim.headline, dim.analysis, (dim.strengths||[]).join("; "), (dim.watchouts||[]).join("; ")] : [];
      }),
      [],
      ["Ideal Markets", (result.ideal_markets||[]).join("; ")],
      [],
      ["CONTROVERSY FLAGS"],
      ["Risk Profile", result.controversy_flags?.risk_profile || "N/A"],
      ["Risk Profile Rationale", result.controversy_flags?.risk_profile_rationale || ""],
      ["Safe to Proceed", result.controversy_flags?.safe_to_proceed ? "Yes" : "No"],
      ["Brand Risk-Averse Note", result.controversy_flags?.brand_risk_averse_note || ""],
      [],
      ...(result.controversy_flags?.flags || []).map(f => [f.severity, f.category, f.title, f.detail, f.brand_impact, (f.mitigations||[]).join("; ")]),
      ["Comparable Deals", (result.comparable_deals||[]).join("; ")],
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const slug = `${brand.name}-${talentName}`.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"");
    a.href = url; a.download = `alloy-${slug}.csv`; a.click();
    URL.revokeObjectURL(url);
    setCopied("csv"); setTimeout(() => setCopied(null), 2000);
  };



  // ─── Render ────────────────────────────────────────────────────────────────

  // brandLoaded always true - localStorage is synchronous

  const vcfg = result ? (VERDICT_CFG[result.overall_verdict] || VERDICT_CFG["BORDERLINE"]) : null;
  const isLight = theme === "light";

  const divider = <div style={{ height: 1, background: "var(--border)", margin: "20px 0" }} />;

  // Export bar (reused in both mobile bottom bar and desktop)
  const exportBarJSX = result ? (
    <div className="export-bar" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {[
        { key: "copy",  icon: "⎘", label: "COPY",  done: "✓ COPIED"  },
        { key: "txt",   icon: "↓", label: "TXT",   done: "✓ SAVED"   },
        { key: "email", icon: "✉", label: "EMAIL", done: "OPENED"    },
        { key: "pdf",   icon: "⎙", label: "PDF",   done: "PRINTING…" },
        { key: "csv",   icon: "⬇", label: "CSV",   done: "✓ SAVED"   },
      ].map(({ key, icon, label, done }) => {
        const fn = { copy: copyMemo, txt: downloadTxt, email: exportEmail, pdf: printPdf, csv: downloadCsv }[key];
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
  const leftPanelJSX = (
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
          style={INPUT_STYLE} />
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
          rows={2} style={{ ...INPUT_STYLE, resize: "vertical", lineHeight: 1.55 }} />
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

      {/* Mobile loading banner — visible on brand tab while results tab is hidden */}
      {loading && (
        <div style={{
          marginTop: 12, padding: "12px 16px",
          background: "rgba(200,16,46,0.06)", border: "1px solid rgba(200,16,46,0.15)",
          borderRadius: "var(--radius-sm)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ width: 12, height: 12, border: "2px solid rgba(200,16,46,0.3)",
            borderTopColor: "var(--red)", borderRadius: "50%", display: "inline-block", flexShrink: 0,
            animation: "spin 0.7s linear infinite" }} />
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700,
              letterSpacing: "0.1em", color: "var(--red)", marginBottom: 2 }}>
              {phase === "searching" ? "RESEARCHING TALENT" : "SCORING + RISK ANALYSIS"}
            </div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--muted)", lineHeight: 1.4 }}>
              {phase === "searching"
                ? `Pulling live intel on ${talentName}…`
                : "Running parallel analysis — this takes ~10s…"}
            </div>
          </div>
        </div>
      )}

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
  const resultsPanelJSX = (
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
              {phase === "searching" ? "RESEARCHING TALENT" : "SCORING + RISK ANALYSIS"}
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
              {phase === "searching"
                ? `Pulling live intel on ${talentName}…`
                : "Running scoring & controversy analysis in parallel…"}
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
            backgroundImage: `linear-gradient(135deg, ${vcfg.bg} 0%, transparent 100%)`,
            boxShadow: `0 0 0 1px ${vcfg.border}, 0 0 32px ${vcfg.color}22, inset 0 1px 0 rgba(255,255,255,0.03)`,
          }}>
            <div className="verdict-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div className="verdict-stats" style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ fontFamily: "var(--font-display)", fontSize: 9, letterSpacing: "0.16em", color: "var(--muted)" }}>VERDICT</span><InfoBtn dim="verdict" onOpen={setInfoModal} /></div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, color: vcfg.color, letterSpacing: "0.03em", lineHeight: 1 }}>
                    {result.overall_verdict}
                  </div>
                </div>
                <div style={{ width: 1, height: 36, background: "var(--border)" }} />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ fontFamily: "var(--font-display)", fontSize: 9, letterSpacing: "0.16em", color: "var(--muted)" }}>SCORE</span><InfoBtn dim="overall" onOpen={setInfoModal} /></div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 38, fontWeight: 600, color: vcfg.color, lineHeight: 1 }}>
                    {result.overall_score}<span style={{ fontSize: 14, color: "var(--muted)", fontWeight: 400 }}>/100</span>
                  </div>
                  {result.score_was_capped && (
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "#f59e0b", marginTop: 2 }}>
                      ↓ adjusted from {result.original_score}
                    </div>
                  )}
                </div>
                <div style={{ width: 1, height: 36, background: "var(--border)" }} />
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 9, letterSpacing: "0.16em", color: "var(--muted)", marginBottom: 3 }}>DEAL TYPE</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700, color: "var(--text)", letterSpacing: "0.02em" }}>
                    {result.deal_type_recommendation}
                  </div>
                </div>
              </div>
              {exportBarJSX}
            </div>
          </div>

          {/* ── Headline + Summary ───────────────────────────────────────── */}
          <div style={{ background: "var(--grad-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "20px 24px", backgroundImage: "var(--grad-card)" }}>
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
                <div style={{
                  padding: "8px 14px", background: "rgba(249,115,22,0.07)",
                  border: "1px solid rgba(249,115,22,0.2)", borderRadius: "var(--radius-sm)",
                  width: "100%", boxSizing: "border-box",
                }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 9, letterSpacing: "0.12em", color: "#f97316", marginRight: 6 }}>⚠ RISK</span>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#c2782f",
                    wordBreak: "break-word", whiteSpace: "normal" }}>{result.risk_flag}</span>
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
                      <span style={{ fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 600, color: scoreColor(s) }}>{s}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dimension cards */}
            <div className="dim-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, alignContent: "start" }}>
              {DIMS.map((d, di) => {
                const dim = result.scores?.[d.key]; if (!dim) return null;
                const c = scoreColor(dim.score);
                return (
                  <div key={d.key} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "14px 16px", animation: `fadeUp 0.4s ease both`, animationDelay: `${di * 80}ms` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ fontFamily: "var(--font-display)", fontSize: 9, letterSpacing: "0.1em", color: "var(--muted)" }}>{d.icon} {d.label.toUpperCase()}</span><InfoBtn dim={d.key} onOpen={setInfoModal} /></span>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, color: c, lineHeight: 1 }}>{dim.score}</span>
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


          {/* ── Controversy Flags ────────────────────────────────────────── */}
          {result.controversy_flags && (() => {
            const cf = result.controversy_flags;
            const rcfg = RISK_PROFILE_CFG[cf.risk_profile] || RISK_PROFILE_CFG.MEDIUM;
            return (
              <div style={{
                background: rcfg.bg, border: `1px solid ${rcfg.border}`,
                borderRadius: "var(--radius)", padding: "20px 24px",
                boxShadow: cf.risk_profile === "CRITICAL" || cf.risk_profile === "HIGH"
                  ? `0 0 24px ${rcfg.color}18` : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 9, letterSpacing: "0.16em", color: "var(--muted)" }}>⚑ CONTROVERSY FLAGS</span>
                    <span style={{ padding: "2px 10px", borderRadius: 20, background: rcfg.border, fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 800, letterSpacing: "0.06em", color: rcfg.color }}>
                      {rcfg.label}
                    </span>
                    {cf.recommendation === "PAUSE_AND_MONITOR" && (
                      <span style={{ padding: "2px 10px", borderRadius: 20, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 800, letterSpacing: "0.06em", color: "#f59e0b" }}>
                        ⏸ PAUSE & MONITOR
                      </span>
                    )}
                    {cf.recommendation === "DO_NOT_PROCEED" && (
                      <span style={{ padding: "2px 10px", borderRadius: 20, background: "rgba(200,16,46,0.1)", border: "1px solid rgba(200,16,46,0.3)", fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 800, letterSpacing: "0.06em", color: "#C8102E" }}>
                        ⛔ DO NOT PROCEED
                      </span>
                    )}
                    <InfoBtn dim="roster" onOpen={setInfoModal} />
                  </div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: rcfg.color, fontStyle: "italic" }}>
                    {cf.flags?.length || 0} flag{cf.flags?.length !== 1 ? "s" : ""} identified
                  </div>
                </div>

                <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text2)", lineHeight: 1.65, marginBottom: cf.flags?.length ? 16 : 8 }}>
                  {cf.risk_profile_rationale}
                </p>

                {cf.flags?.length > 0 && (
                  <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
                    {cf.flags.map((flag, fi) => {
                      const sc = SEV_CFG[flag.severity] || SEV_CFG.MEDIUM;
                      return (
                        <div key={fi} style={{
                          background: "var(--card)", border: `1px solid ${sc.color}28`,
                          borderLeft: `3px solid ${sc.color}`,
                          borderRadius: "var(--radius-sm)", padding: "12px 16px",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                            <span style={{ fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 800, color: sc.color, letterSpacing: "0.04em" }}>
                              {sc.icon} {flag.severity}
                            </span>
                            <span style={{ fontFamily: "var(--font-display)", fontSize: 9, letterSpacing: "0.08em", color: "var(--muted)", textTransform: "uppercase" }}>
                              {flag.category}
                            </span>
                          </div>
                          <div style={{ fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 5 }}>
                            {flag.title}
                          </div>
                          <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text2)", lineHeight: 1.6, marginBottom: 6 }}>
                            {flag.detail}
                          </p>
                          <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: sc.color, marginBottom: flag.mitigations?.length ? 6 : 0 }}>
                            ⚡ Brand impact: {flag.brand_impact}
                          </div>
                          {flag.mitigations?.length > 0 && (
                            <div style={{ marginTop: 4 }}>
                              {flag.mitigations.map((m, mi) => (
                                <div key={mi} style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-body)", marginBottom: 2 }}>→ {m}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {cf.flags?.length === 0 && (
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#22c55e", padding: "10px 14px", background: "rgba(34,197,94,0.06)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(34,197,94,0.15)" }}>
                    ✓ No significant controversy flags identified for this talent.
                  </div>
                )}

                <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 9, letterSpacing: "0.1em", color: "var(--muted)", marginRight: 8 }}>RISK-AVERSE BRANDS:</span>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text2)" }}>{cf.brand_risk_averse_note}</span>
                </div>
              </div>
            );
          })()}

          {/* ── Disclaimer ───────────────────────────────────────────────── */}
          <div style={{
            padding: "14px 18px", borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            borderLeft: "3px solid var(--red-border)",
            background: "rgba(255,255,255,0.02)",
            marginTop: 4,
          }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 9, letterSpacing: "0.1em", color: "var(--text2)", flexShrink: 0, marginTop: 1 }}>ⓘ DISCLAIMER</span>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text2)", lineHeight: 1.7, margin: 0 }}>
                This tool is for <strong style={{ color: "var(--text)", fontWeight: 600 }}>educational and directional purposes only</strong>. Scores and analysis are AI-generated and do not constitute professional marketing, legal, or financial advice. Assessments reflect publicly available information at time of query and may be incomplete or inaccurate. Always conduct independent research, consult qualified advisors, and exercise your own judgment before making partnership decisions.
              </p>
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
              <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, letterSpacing: "0.06em", color: "var(--text)" }}>
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
            {/* Saved searches */}
            <button onClick={() => setFavsOpen(true)} title="Saved searches" style={{
              height: 36, padding: "0 14px", borderRadius: 18,
              background: "var(--tag-bg)", border: "1px solid var(--border)",
              cursor: "pointer", fontSize: 11, display: "flex", gap: 6,
              alignItems: "center", justifyContent: "center", transition: "all 0.2s",
              color: "var(--text2)", fontFamily: "var(--font-display)", fontWeight: 700,
              letterSpacing: "0.08em",
            }}>
              ◎ SAVED
            </button>
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
        {["brand","results"].map(tab => (
          <button key={tab} onClick={() => setMobileTab(tab)} style={{
            flex: 1, padding: "12px", border: "none", cursor: "pointer",
            background: mobileTab === tab ? "var(--red-soft)" : "transparent",
            borderBottom: `2px solid ${mobileTab === tab ? "var(--red)" : "transparent"}`,
            color: mobileTab === tab ? "var(--red)" : "var(--muted)",
            fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 700,
            letterSpacing: "0.1em", transition: "all 0.2s",
          }}>
            {tab === "brand" ? "✦ BRAND" : `◉ RESULTS${result ? ` · ${result.overall_score}` : ""}`}
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
          {leftPanelJSX}
        </div>

        {/* Right */}
        <div className={mobileTab === "brand" ? "mobile-hide" : ""}>
          {resultsPanelJSX}
        </div>
      </div>

      {infoModal && <ScoreInfoModal dim={infoModal} onClose={() => setInfoModal(null)} />}

      <FavoritesDrawer
        open={favsOpen}
        onClose={() => setFavsOpen(false)}
        currentResult={result}
        currentInputs={{ talentName, talentType, brandName: brand.name }}
        onLoad={(entry) => {
          setResult(entry.result);
          setTalentName(entry.inputs?.talentName || entry.talentName || "");
          setTalentType(entry.inputs?.talentType || entry.talentType || "");
          if (entry.inputs?.brand) setBrand({ ...EMPTY_BRAND, ...entry.inputs.brand });
          setMobileTab("results");
        }}
      />
    </div>
  );
}
