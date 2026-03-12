// ─────────────────────────────────────────────
//  SkillBarter — Skill Detail Page (API-driven)
// ─────────────────────────────────────────────
import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import { skillsAPI } from "../services/api";

// Inline pure helper — no mockData dependency
function badgeColor(b) {
    if (b === "Top Teacher") return "#FF6B35";
    if (b === "Trusted Mentor") return "#10B981";
    if (b === "Community Expert") return "#8B5CF6";
    return "#6B7280";
}

const LEARNS = [
    "Core fundamentals and best practices",
    "Hands-on projects with real feedback",
    "Industry techniques used by professionals",
    "Portfolio-worthy work you can showcase",
    "One-on-one doubt resolution sessions",
    "Access to curated learning materials",
];

export default function SkillDetailPage() {
    const t = useTheme();
    const app = useApp();
    const s = app.selectedSkill;

    const [skillData, setSkillData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!s?._id) return;
        setLoading(true);
        skillsAPI.get(s._id)
            .then(d => setSkillData(d.skill))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [s?._id]);

    if (!s) return null;

    const skill = skillData || s;
    const reviews = (skillData?.reviews || []);
    const badge = skill.badge || "Beginner Mentor";
    const bc = badgeColor(badge);

    return (
        <div style={{ padding: "32px 40px" }}>
            <button onClick={() => app.navigate("marketplace")} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#FFD600", fontWeight: 600, fontSize: 14, marginBottom: 24,
                display: "flex", alignItems: "center", gap: 6,
                transition: "all 0.2s",
            }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
                ← Back to Marketplace
            </button>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 28 }}>

                {/* ── Main content ── */}
                <div>
                    {/* Mentor header */}
                    <div style={{
                        background: t.cardBg, border: `1px solid ${t.cardBorder}`,
                        borderRadius: 24, padding: "32px", marginBottom: 20,
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24 }}>
                            <div style={{
                                width: 80, height: 80, borderRadius: "50%",
                                background: "linear-gradient(135deg,#FFD600,#F0C800)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontWeight: 800, fontSize: 24, color: "#0A0A0A",
                                boxShadow: "0 8px 24px rgba(255,214,0,0.35)",
                            }}>
                                {skill.mentorAvatar || skill.avatar || "??"}
                            </div>
                            <div>
                                <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 800, fontSize: 24, color: t.textPrimary }}>
                                    {skill.mentorName || skill.mentor}
                                </div>
                                <div style={{ fontSize: 14, color: t.textSecondary, marginTop: 2 }}>
                                    {skill.mentorLocation || skill.location} · {skill.category}
                                </div>
                                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                                    <span className="badge-pill" style={{ background: `${bc}18`, color: bc, border: `1px solid ${bc}30` }}>{badge}</span>
                                    <span style={{ background: t.dark ? "rgba(255,255,255,0.08)" : "#F3F3EE", color: t.textSecondary, fontSize: 12, padding: "4px 12px", borderRadius: 99 }}>
                                        {skill.format}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 800, fontSize: 26, color: t.textPrimary, marginBottom: 12 }}>
                            {skill.name}
                        </div>
                        <p style={{ fontSize: 14, color: t.textSecondary, lineHeight: 1.8, marginBottom: 24 }}>
                            Learn <strong>{skill.name}</strong> from an expert mentor with hands-on projects, live feedback, and a structured curriculum. {skill.mentorBio || skill.bio}. Perfect for those at the <em>{skill.level?.toLowerCase()}</em> level looking to go further.
                        </p>

                        {/* Quick stats */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
                            {[["⭐", skill.rating || "New", "Rating"], ["📝", skill.reviewCount || reviews.length || 0, "Reviews"], ["✅", skill.sessions || 0, "Sessions"], ["🏅", skill.level, "Level"]].map(([ic, v, l]) => (
                                <div key={l} style={{
                                    textAlign: "center",
                                    background: t.dark ? "rgba(255,255,255,0.05)" : "#F8F8F4",
                                    borderRadius: 16, padding: "16px 10px",
                                    border: `1px solid ${t.cardBorder}`,
                                }}>
                                    <div style={{ fontSize: 22, marginBottom: 6 }}>{ic}</div>
                                    <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 700, color: t.textPrimary, fontSize: 17 }}>{v}</div>
                                    <div style={{ fontSize: 11, color: t.textSecondary, fontWeight: 500 }}>{l}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* What you'll learn */}
                    <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 20, padding: "28px", marginBottom: 20 }}>
                        <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 700, fontSize: 18, color: t.textPrimary, marginBottom: 18 }}>
                            💡 What You'll Learn
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            {LEARNS.map(item => (
                                <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                    <span style={{
                                        width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                                        background: "rgba(255,214,0,0.15)", color: "#FFD600",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 11, fontWeight: 700, marginTop: 1,
                                    }}>✓</span>
                                    <span style={{ fontSize: 13, color: t.textSecondary, lineHeight: 1.6 }}>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Reviews */}
                    <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 20, padding: "28px" }}>
                        <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 700, fontSize: 18, color: t.textPrimary, marginBottom: 18 }}>
                            ⭐ Reviews {reviews.length > 0 && <span style={{ fontSize: 13, color: t.textSecondary, fontWeight: 400 }}>({reviews.length})</span>}
                        </div>
                        {loading ? (
                            [1, 2].map(i => <div key={i} className="shimmer" style={{ height: 70, borderRadius: 12, marginBottom: 12, background: t.dark ? "rgba(255,255,255,0.04)" : "#F3F3EE" }} />)
                        ) : reviews.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "32px 0", color: t.textSecondary }}>
                                <div style={{ fontSize: 32, marginBottom: 8 }}>⭐</div>
                                No reviews yet — be the first to review!
                            </div>
                        ) : (
                            reviews.map((r, i) => (
                                <div key={r._id || i} style={{
                                    padding: "18px 0",
                                    borderBottom: i < reviews.length - 1 ? `1px solid ${t.cardBorder}` : "none",
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div style={{
                                                width: 32, height: 32, borderRadius: "50%",
                                                background: t.dark ? "rgba(255,255,255,0.1)" : "#F3F3EE",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontSize: 12, fontWeight: 700, color: t.textPrimary,
                                            }}>
                                                {r.user?.avatar || r.user?.name?.substring(0, 2).toUpperCase() || "??"}
                                            </div>
                                            <div style={{ fontWeight: 600, fontSize: 14, color: t.textPrimary }}>
                                                {r.user?.name || "Anonymous"}
                                            </div>
                                        </div>
                                        <div style={{ color: "#FFD600", fontSize: 14 }}>{"★".repeat(r.rating)}<span style={{ color: t.cardBorder }}>{"★".repeat(5 - r.rating)}</span></div>
                                    </div>
                                    <div style={{ fontSize: 13, color: t.textSecondary, lineHeight: 1.7 }}>{r.text}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* ── Booking sidebar ── */}
                <div style={{ position: "sticky", top: 20 }}>
                    <div style={{
                        background: t.cardBg, border: `1px solid ${t.cardBorder}`,
                        borderRadius: 24, padding: "28px",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                    }}>
                        <div style={{
                            fontFamily: "'Playfair Display',sans-serif", fontWeight: 800, fontSize: 30,
                            background: "linear-gradient(135deg,#FFD600,#F0C800)",
                            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                            marginBottom: 4,
                        }}>
                            {skill.credits} Credits/hr
                        </div>
                        <div style={{ fontSize: 13, color: t.textSecondary, marginBottom: 24 }}>
                            1 credit = 1 hour of teaching
                        </div>
                        <button className="btn-yellow" onClick={() => app.navigate("booking")}
                            style={{ width: "100%", padding: "15px", borderRadius: 14, fontSize: 16, marginBottom: 10, fontWeight: 700 }}>
                            📅 Book a Session
                        </button>
                        <button className="btn-outline" onClick={() => app.navigate("messages")}
                            style={{ width: "100%", padding: "14px", borderRadius: 14, fontSize: 15, marginBottom: 24 }}>
                            💬 Message Mentor
                        </button>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 16, borderTop: `1px solid ${t.cardBorder}` }}>
                            {[["📅", "Flexible scheduling"], ["🎥", "Video + offline options"], ["💬", "Chat support between sessions"], ["🛡️", "Verified mentor"]].map(([ic, txt]) => (
                                <div key={txt} style={{ display: "flex", gap: 10, fontSize: 13, color: t.textSecondary, alignItems: "center" }}>
                                    <span style={{ fontSize: 16 }}>{ic}</span><span>{txt}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
