// ─────────────────────────────────────────────
//  SkillBarter — Home Dashboard (API-driven)
// ─────────────────────────────────────────────
import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import { usersAPI, bookingsAPI } from "../services/api";
import { StatCard, SectionHeading, ProgressBar } from "../components/UI";

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function HomePage() {
    const t = useTheme();
    const app = useApp();

    const [dashboard, setDashboard] = useState(null);
    const [upcoming, setUpcoming] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [dash, bookRes] = await Promise.all([
                    usersAPI.dashboard(),
                    bookingsAPI.mine(),
                ]);
                setDashboard(dash);
                // Upcoming: first 3 pending/confirmed bookings
                const upcomingList = (bookRes.bookings || [])
                    .filter(b => b.status === "pending" || b.status === "confirmed")
                    .slice(0, 3);
                setUpcoming(upcomingList);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const user = app.user;
    const stats = dashboard?.stats || {};
    const progress = dashboard?.progress || [];
    const streak = dashboard?.streak || 0;
    const initials = user?.avatar || user?.name?.substring(0, 2).toUpperCase() || "??";

    const STAT_CARDS = [
        { icon: "💰", value: (stats.credits ?? 0).toFixed(1), label: "Credit Balance", sub: "Available to spend", accentColor: "#FFD600" },
        { icon: "✅", value: stats.sessions ?? 0, label: "Sessions Done", sub: "As mentor", accentColor: "#10B981" },
        { icon: "📚", value: stats.teachingCount ?? 0, label: "Skills Teaching", sub: "Active listings", accentColor: "#3B82F6" },
        { icon: "⚡", value: (stats.xp ?? 0).toLocaleString(), label: "XP Points", sub: "Keep learning!", accentColor: "#F59E0B" },
    ];

    if (loading) return (
        <div style={{ padding: "32px 40px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 32 }}>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="shimmer" style={{ height: 110, borderRadius: 20, background: t.cardBg, border: `1px solid ${t.cardBorder}` }} />
                ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
                <div className="shimmer" style={{ height: 320, borderRadius: 20, background: t.cardBg, border: `1px solid ${t.cardBorder}` }} />
                <div className="shimmer" style={{ height: 320, borderRadius: 20, background: t.cardBg, border: `1px solid ${t.cardBorder}` }} />
            </div>
        </div>
    );

    return (
        <div style={{ padding: "32px 40px" }}>
            {/* Greeting */}
            <div style={{ marginBottom: 32, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                    <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 800, fontSize: 30, color: t.textPrimary, letterSpacing: "-0.01em" }}>
                        Good{getGreeting()}, {user?.name?.split(' ')[0] || 'there'} 👋
                    </div>
                    <div style={{ color: t.textSecondary, fontSize: 15, marginTop: 4 }}>
                        {upcoming.length > 0
                            ? `You have ${upcoming.length} upcoming session${upcoming.length > 1 ? 's' : ''} · Keep the streak going!`
                            : "No upcoming sessions · Browse the marketplace to book one!"}
                    </div>
                </div>
                {streak > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,214,0,0.1)", border: "1px solid rgba(255,214,0,0.2)", borderRadius: 99, padding: "8px 18px" }}>
                        <span style={{ fontSize: 22 }}>🔥</span>
                        <span style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 700, fontSize: 18, color: "#FFD600" }}>{streak}</span>
                        <span style={{ fontSize: 13, color: t.textSecondary, fontWeight: 500 }}>Day Streak</span>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 32 }}>
                {STAT_CARDS.map((s) => <StatCard key={s.label} {...s} />)}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>

                {/* ── Left column ── */}
                <div>
                    {/* Upcoming sessions */}
                    <SectionHeading>Upcoming Sessions</SectionHeading>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
                        {upcoming.length === 0 ? (
                            <EmptyState
                                icon="📅"
                                title="No upcoming sessions"
                                sub="Head to the marketplace to book your first session"
                                t={t}
                            />
                        ) : (
                            <>
                                {upcoming.some(b => isMissed(b.date, b.time)) && (
                                    <div style={{
                                        background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                                        borderRadius: 12, padding: "12px 16px", color: "#EF4444",
                                        fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 10
                                    }}>
                                        <span>⚠️</span>
                                        <span>You missed a scheduled session. Meeting access is no longer available.</span>
                                    </div>
                                )}
                                {upcoming.map((b) => {
                                    const missed = isMissed(b.date, b.time);
                                    const joinable = isJoinable(b.date, b.time);
                                    
                                    // Determine if current user is the mentor for this booking
                                    const isMentoring = b.mentor?._id === user?._id || b.mentor === user?._id;
                                    const otherName = isMentoring ? (b.learner?.name || "Learner") : (b.mentor?.name || b.mentorName);
                                    const otherAvatar = isMentoring ? (b.learner?.avatar || "??") : (b.mentor?.avatar || b.mentorAvatar || "??");

                                    return (
                                        <div key={b._id} style={{
                                            background: t.cardBg,
                                            border: `1px solid ${t.cardBorder}`,
                                            borderRadius: 16,
                                            padding: "18px 24px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            transition: "all 0.25s",
                                            opacity: missed ? 0.7 : 1
                                        }}
                                            onMouseEnter={e => !missed && (e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.12)`)}
                                            onMouseLeave={e => !missed && (e.currentTarget.style.boxShadow = "none")}
                                        >
                                            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                                <div style={{
                                                    width: 46, height: 46, borderRadius: "50%",
                                                    background: missed ? "#6B7280" : "linear-gradient(135deg,#FFD600,#F0C800)",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontWeight: 700, fontSize: 14, color: missed ? "#FFF" : "#0A0A0A",
                                                    boxShadow: missed ? "none" : "0 4px 12px rgba(255,214,0,0.3)",
                                                }}>
                                                    {otherAvatar}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: t.textPrimary, fontSize: 15 }}>{b.skillName}</div>
                                                    <div style={{ fontSize: 13, color: t.textSecondary }}>{isMentoring ? "Teaching" : "Learning with"} {otherName}</div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <div style={{ fontWeight: 600, color: t.textPrimary, fontSize: 14 }}>{b.date} · {b.time}</div>
                                                <div style={{ fontSize: 12, color: missed ? t.textSecondary : "#FFD600", fontWeight: 600, marginTop: 2 }}>{b.sessionType}</div>
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginLeft: 16, alignItems: "flex-end" }}>
                                                <span style={{
                                                    padding: "4px 12px", borderRadius: 99, textAlign: "center",
                                                    background: missed ? "rgba(239,68,68,0.12)" : (b.status === "confirmed" ? "rgba(16,185,129,0.12)" : "rgba(255,214,0,0.12)"),
                                                    color: missed ? "#EF4444" : (b.status === "confirmed" ? "#10B981" : "#FFD600"),
                                                    fontSize: 11, fontWeight: 700, textTransform: "capitalize",
                                                }}>
                                                    {missed ? "Missed" : b.status}
                                                </span>
                                                {b.meetingId && !missed && (
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                                        <button
                                                            onClick={() => joinable && app.navigate(`call/${b.meetingId}`)}
                                                            className={joinable ? "btn-yellow" : "btn-outline"}
                                                            disabled={!joinable}
                                                            style={{
                                                                padding: "6px 12px", borderRadius: 8, fontSize: 12,
                                                                fontWeight: 600, border: "none", 
                                                                cursor: joinable ? "pointer" : "not-allowed",
                                                                opacity: joinable ? 1 : 0.5,
                                                                background: joinable ? "#FFD600" : (t.dark ? "#2A2A2A" : "#E8E8E0"),
                                                                color: joinable ? "#0A0A0A" : t.textSecondary
                                                            }}
                                                        >
                                                            {joinable ? "Join Meeting" : "Scheduled"}
                                                        </button>
                                                        {!joinable && (
                                                            <div style={{ fontSize: 9, color: t.textSecondary, textAlign: "center" }}>
                                                                Available at {b.time}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>

                    {/* Learning Progress */}
                    <SectionHeading>Learning Progress</SectionHeading>
                    <div style={{
                        background: t.cardBg,
                        border: `1px solid ${t.cardBorder}`,
                        borderRadius: 20,
                        padding: 28,
                        display: "flex",
                        flexDirection: "column",
                        gap: 20,
                    }}>
                        {progress.length === 0 ? (
                            <EmptyState icon="📊" title="No learning progress yet" sub="Book a session to start tracking your progress" t={t} />
                        ) : progress.map((p) => {
                            const pct = Math.min(100, (p.sessions / 6) * 100);
                            return (
                                <div key={p.skill}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                        <span style={{ fontWeight: 600, color: t.textPrimary, fontSize: 14 }}>{p.skill}</span>
                                        <span style={{ fontSize: 12, color: t.textSecondary }}>{p.sessions} sessions · {Math.round(pct)}%</span>
                                    </div>
                                    <ProgressBar value={pct} />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Right column — Streak card ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div style={{
                        background: "linear-gradient(135deg, #FFD600 0%, #F0C800 100%)",
                        borderRadius: 24,
                        padding: "28px 24px",
                        textAlign: "center",
                        boxShadow: "0 12px 40px rgba(255,214,0,0.3)",
                        position: "relative",
                        overflow: "hidden",
                    }}>
                        <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(0,0,0,0.05)" }} />
                        <div style={{ fontSize: 52, marginBottom: 4, position: "relative" }}>🔥</div>
                        <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 800, fontSize: 52, color: "#0A0A0A", lineHeight: 1, position: "relative" }}>
                            {streak}
                        </div>
                        <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 700, fontSize: 18, color: "#0A0A0A", marginBottom: 4 }}>
                            Day Streak!
                        </div>
                        <div style={{ fontSize: 12, color: "#3A3000", marginBottom: 24 }}>
                            {streak > 0 ? "Keep it up — you're on fire! 🏅" : "Start your first session to begin!"}
                        </div>
                        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
                            {DAYS_OF_WEEK.map((d, i) => (
                                <div key={d} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                                    <div style={{
                                        width: 32, height: 32, borderRadius: "50%",
                                        background: i < streak ? "#0A0A0A" : "rgba(0,0,0,0.15)",
                                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                                        transition: "all 0.3s",
                                    }}>
                                        {i < streak ? "🔥" : ""}
                                    </div>
                                    <div style={{ fontSize: 10, fontWeight: 600, color: "#3A3000" }}>{d}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ height: 1, background: "rgba(0,0,0,0.1)", marginBottom: 20 }} />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                            {[
                                { label: "Current", value: streak },
                                { label: "Sessions", value: stats.sessions ?? 0 },
                                { label: "Credits", value: (stats.credits ?? 0).toFixed(1) },
                            ].map((s) => (
                                <div key={s.label} style={{ background: "rgba(0,0,0,0.08)", borderRadius: 12, padding: "10px 6px" }}>
                                    <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 800, fontSize: 20, color: "#0A0A0A" }}>{s.value}</div>
                                    <div style={{ fontSize: 10, color: "#5A4800", fontWeight: 600 }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 20, padding: "20px 24px" }}>
                        <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 700, fontSize: 15, color: t.textPrimary, marginBottom: 14 }}>
                            ⚡ Quick Actions
                        </div>
                        {[
                            { label: "Browse Marketplace", icon: "🛒", page: "marketplace" },
                            { label: "Book a Session", icon: "📅", page: "booking" },
                            { label: "View Wallet", icon: "💰", page: "wallet" },
                        ].map(a => (
                            <button
                                key={a.page}
                                className="btn-outline"
                                onClick={() => app.navigate(a.page)}
                                style={{ width: "100%", padding: "10px 16px", borderRadius: 12, fontSize: 13, marginBottom: 8, textAlign: "left", display: "flex", gap: 10, alignItems: "center" }}
                            >
                                <span>{a.icon}</span><span>{a.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function isJoinable(dateStr, timeStr) {
    try {
        const combined = `${dateStr} ${timeStr}`;
        const sessionDate = new Date(combined);
        const now = new Date();
        const diffMins = (sessionDate - now) / (1000 * 60);
        return diffMins <= 15 && diffMins >= -90;
    } catch (e) {
        return false;
    }
}

function isMissed(dateStr, timeStr) {
    try {
        const combined = `${dateStr} ${timeStr}`;
        const sessionDate = new Date(combined);
        const now = new Date();
        const diffMins = (sessionDate - now) / (1000 * 60);
        return diffMins < -90;
    } catch (e) {
        return false;
    }
}

function EmptyState({ icon, title, sub, t }) {
    return (
        <div style={{ textAlign: "center", padding: "40px 24px", background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 16 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
            <div style={{ fontWeight: 600, color: t.textPrimary, fontSize: 15, marginBottom: 6 }}>{title}</div>
            <div style={{ fontSize: 13, color: t.textSecondary }}>{sub}</div>
        </div>
    );
}

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return " morning";
    if (h < 17) return " afternoon";
    return " evening";
}
