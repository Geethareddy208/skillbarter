// ─────────────────────────────────────────────
//  SkillBarter — Skill Marketplace (API-driven)
// ─────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import { skillsAPI } from "../services/api";

const LEVELS = ["All", "Beginner", "Intermediate", "Advanced", "All Levels"];

// Pure helper — no mockData needed
function badgeColor(b) {
    if (b === "Top Teacher") return "#FF6B35";
    if (b === "Trusted Mentor") return "#10B981";
    if (b === "Community Expert") return "#8B5CF6";
    return "#6B7280";
}

export default function MarketplacePage() {
    const t = useTheme();
    const app = useApp();

    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [categories, setCategories] = useState(["All"]);

    const [cat, setCat] = useState("All");
    const [level, setLevel] = useState("All");
    const [q, setQ] = useState("");

    // Fetch categories from DB on mount
    useEffect(() => {
        skillsAPI.categories()
            .then(d => setCategories(d.categories || ["All"]))
            .catch(() => setCategories(["All", "Programming", "Design", "Languages", "Music", "Photography", "Fitness", "Marketing"]));
    }, []);

    const fetchSkills = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await skillsAPI.list({ category: cat, level, q });
            setSkills(data.skills || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [cat, level, q]);

    useEffect(() => { fetchSkills(); }, [cat, level]);

    const filtered = q
        ? skills.filter(s =>
            s.name.toLowerCase().includes(q.toLowerCase()) ||
            (s.mentorName || "").toLowerCase().includes(q.toLowerCase())
        )
        : skills;

    return (
        <div style={{ padding: "32px 40px" }}>
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 800, fontSize: 28, color: t.textPrimary, letterSpacing: "-0.01em" }}>
                    Skill Marketplace
                </div>
                <div style={{ color: t.textSecondary, fontSize: 14, marginTop: 4 }}>
                    Discover expert mentors · Exchange skills · Grow together
                </div>
            </div>

            {/* Search + level filter */}
            <div style={{ display: "flex", gap: 12, marginBottom: 24, alignItems: "center" }}>
                <div className="glow-focus" style={{
                    flex: 1, display: "flex", alignItems: "center", gap: 10,
                    background: t.cardBg, border: `1px solid ${t.cardBorder}`,
                    borderRadius: 14, padding: "12px 18px", transition: "all 0.25s",
                }}>
                    <span style={{ color: t.textSecondary, fontSize: 16 }}>🔍</span>
                    <input
                        value={q}
                        onChange={e => setQ(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && fetchSkills()}
                        placeholder="Search skills or mentors..."
                        style={{ flex: 1, background: "transparent", fontSize: 14, color: t.textPrimary }}
                    />
                    {q && (
                        <button onClick={() => { setQ(""); fetchSkills(); }}
                            style={{ background: "none", border: "none", cursor: "pointer", color: t.textSecondary, fontSize: 16 }}>✕</button>
                    )}
                </div>
                <select
                    value={level}
                    onChange={e => setLevel(e.target.value)}
                    style={{
                        background: t.cardBg, border: `1px solid ${t.cardBorder}`,
                        borderRadius: 14, padding: "12px 18px", fontSize: 14,
                        color: t.textPrimary, cursor: "pointer", outline: "none",
                    }}
                >
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
            </div>

            {/* Category pills */}
            <div style={{ display: "flex", gap: 8, marginBottom: 32, overflowX: "auto", paddingBottom: 4 }}>
                {categories.map(c => (
                    <div key={c} onClick={() => setCat(c)} className="cat-pill" style={{
                        padding: "8px 18px", borderRadius: 99, whiteSpace: "nowrap",
                        border: `1.5px solid ${cat === c ? "#FFD600" : t.cardBorder}`,
                        background: cat === c ? "linear-gradient(135deg,#FFD600,#F0C800)" : t.cardBg,
                        color: cat === c ? "#0A0A0A" : t.textSecondary,
                        fontSize: 13, fontWeight: cat === c ? 700 : 400,
                        boxShadow: cat === c ? "0 4px 12px rgba(255,214,0,0.25)" : "none",
                    }}>
                        {c}
                    </div>
                ))}
            </div>

            {/* Results */}
            {error && (
                <div style={{ textAlign: "center", padding: 40, color: "#EF4444", background: "rgba(239,68,68,0.08)", borderRadius: 16 }}>
                    ⚠️ {error}
                </div>
            )}
            {loading && !error && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="shimmer" style={{
                            background: t.cardBg, border: `1px solid ${t.cardBorder}`,
                            borderRadius: 20, height: 240,
                        }} />
                    ))}
                </div>
            )}
            {!loading && !error && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
                    {filtered.length === 0 ? (
                        <div style={{
                            gridColumn: "span 3", textAlign: "center", padding: 80,
                            color: t.textSecondary, background: t.cardBg,
                            border: `1px solid ${t.cardBorder}`, borderRadius: 20,
                        }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                            <div style={{ fontWeight: 600, fontSize: 18, color: t.textPrimary, marginBottom: 8 }}>No skills found</div>
                            <div style={{ fontSize: 14 }}>Try a different search or category</div>
                        </div>
                    ) : (
                        filtered.map(s => (
                            <SkillCard key={s._id} skill={s} t={t} onOpen={() => app.navigate("skilldetail", s)} />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

function SkillCard({ skill: s, t, onOpen }) {
    const badge = s.badge || "Beginner Mentor";
    const bc = badgeColor(badge);
    return (
        <div className="skill-card" onClick={onOpen} style={{
            background: t.cardBg, border: `1px solid ${t.cardBorder}`,
            borderRadius: 20, padding: "24px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: "50%",
                        background: "linear-gradient(135deg,#FFD600,#F0C800)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700, fontSize: 15, color: "#0A0A0A",
                        boxShadow: "0 4px 12px rgba(255,214,0,0.3)",
                    }}>
                        {s.mentorAvatar || "??"}
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: t.textPrimary }}>{s.mentorName}</div>
                        <div style={{ fontSize: 12, color: t.textSecondary }}>{s.mentorLocation || "Online"}</div>
                    </div>
                </div>
                <span className="badge-pill" style={{ background: `${bc}18`, color: bc, border: `1px solid ${bc}30` }}>
                    {badge}
                </span>
            </div>
            <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 700, fontSize: 17, color: t.textPrimary, marginBottom: 8 }}>
                {s.name}
            </div>
            <div style={{ fontSize: 13, color: t.textSecondary, marginBottom: 14, lineHeight: 1.5 }}>
                {s.mentorBio}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                {(s.tags || []).map(tag => (
                    <span key={tag} style={{
                        background: t.dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                        color: t.textSecondary, fontSize: 11, padding: "3px 10px", borderRadius: 99,
                    }}>{tag}</span>
                ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: `1px solid ${t.cardBorder}` }}>
                <span style={{ fontSize: 13, color: t.textPrimary }}>
                    ⭐ <strong>{s.rating || "New"}</strong>
                    <span style={{ color: t.textSecondary }}> ({s.reviewCount || 0})</span>
                </span>
                <div style={{
                    fontFamily: "'Playfair Display',sans-serif", fontWeight: 800, fontSize: 16,
                    background: "linear-gradient(135deg,#FFD600,#F0C800)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                    {s.credits} cr/hr
                </div>
            </div>
        </div>
    );
}
