// ─────────────────────────────────────────────
//  SkillBarter — Top Navbar (with Streak Calendar)
// ─────────────────────────────────────────────
import { useState } from "react";
import { useTheme } from "../context/ThemeContext";

// Days in March 2026 where user was active (streak days)
const STREAK_DATES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export default function Topbar() {
    const t = useTheme();
    const [showNotif, setShowNotif] = useState(false);
    const [showStreak, setShowStreak] = useState(false);

    const NOTIFS = [
        { icon: "✅", text: "Session with Sofia confirmed for Mar 11" },
        { icon: "💰", text: "You earned 2 credits from Rahul's session" },
        { icon: "⭐", text: "New review from Emma White: 5 stars!" },
    ];

    // Build calendar for March 2026
    // March 1, 2026 starts on Sunday (day index 0)
    const totalDays = 31;
    const startIndex = 0; // Sunday
    const calDays = Array.from({ length: totalDays }, (_, i) => i + 1);

    return (
        <div style={{
            height: 64, background: t.navBg, borderBottom: `1px solid ${t.cardBorder}`,
            display: "flex", alignItems: "center", justifyContent: "flex-end",
            padding: "0 32px", gap: 16, flexShrink: 0,
        }}>
            {/* Search bar */}
            <div style={{
                flex: 1, display: "flex", alignItems: "center", gap: 10,
                background: t.dark ? "#1A1A1A" : "#F3F3EE",
                borderRadius: 10, padding: "8px 16px", maxWidth: 340,
            }}>
                <span style={{ color: t.textSecondary, fontSize: 14 }}>🔍</span>
                <input
                    placeholder="Search skills, mentors, topics..."
                    style={{ background: "transparent", fontSize: 13, color: t.textPrimary, flex: 1 }}
                />
            </div>

            {/* ── Streak ── */}
            <div style={{ position: "relative" }}>
                <div
                    onMouseEnter={() => setShowStreak(true)}
                    onMouseLeave={() => setShowStreak(false)}
                    style={{
                        display: "flex", alignItems: "center", gap: 6,
                        background: t.dark ? "#2A2A2A" : "#F3F3EE",
                        borderRadius: 10, padding: "8px 14px", cursor: "pointer",
                    }}
                >
                    <span style={{ fontSize: 18 }}>🔥</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: "#FFD600" }}>7</span>
                    <span style={{ fontSize: 12, color: t.textSecondary }}>Days</span>
                </div>

                {/* Streak Calendar Popup */}
                {showStreak && (
                    <div
                        onMouseEnter={() => setShowStreak(true)}
                        onMouseLeave={() => setShowStreak(false)}
                        style={{
                            position: "absolute", top: 52, right: 0, width: 320,
                            background: t.cardBg, border: `1px solid ${t.cardBorder}`,
                            borderRadius: 20, boxShadow: "0 16px 48px rgba(0,0,0,0.16)",
                            zIndex: 999, padding: "20px",
                        }}
                    >
                        {/* Header */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                            <div>
                                <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 800, fontSize: 18, color: t.textPrimary }}>
                                    🔥 7 Day Streak!
                                </div>
                                <div style={{ fontSize: 12, color: t.textSecondary, marginTop: 2 }}>
                                    March 2026
                                </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: 11, color: t.textSecondary }}>Best Streak</div>
                                <div style={{ fontWeight: 700, color: "#FFD600", fontSize: 16 }}>🔥 14 days</div>
                            </div>
                        </div>

                        {/* Day labels */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
                            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                                <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 600, color: t.textSecondary, padding: "2px 0" }}>
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Calendar grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                            {/* Empty cells for offset */}
                            {Array(startIndex).fill(null).map((_, i) => (
                                <div key={`empty-${i}`} />
                            ))}

                            {/* Day cells */}
                            {calDays.map((day) => {
                                const isStreak = STREAK_DATES.includes(day);
                                const isToday = day === 11;
                                return (
                                    <div key={day} style={{
                                        width: "100%", aspectRatio: "1",
                                        borderRadius: 8,
                                        background: isStreak
                                            ? "#FFD600"
                                            : isToday
                                                ? t.dark ? "#2A2A2A" : "#F3F3EE"
                                                : "transparent",
                                        border: isToday && !isStreak ? `1.5px solid #FFD600` : "1.5px solid transparent",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: isStreak ? 14 : 11,
                                        color: isStreak ? "#0A0A0A" : t.textSecondary,
                                        fontWeight: isStreak ? 700 : 400,
                                        cursor: "default",
                                    }}>
                                        {isStreak ? "🔥" : day}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Divider */}
                        <div style={{ height: 1, background: t.cardBorder, margin: "16px 0" }} />

                        {/* Stats row */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                            {[
                                { label: "Current", value: "7 🔥" },
                                { label: "Best", value: "14 🏆" },
                                { label: "Total", value: "42 📅" },
                            ].map((s) => (
                                <div key={s.label} style={{
                                    background: t.dark ? "#2A2A2A" : "#F8F8F4",
                                    borderRadius: 10, padding: "10px 8px", textAlign: "center",
                                }}>
                                    <div style={{ fontWeight: 700, fontSize: 14, color: t.textPrimary }}>{s.value}</div>
                                    <div style={{ fontSize: 10, color: t.textSecondary, marginTop: 2 }}>{s.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Next badge */}
                        <div style={{ marginTop: 14, background: t.dark ? "#2A2A2A" : "#F8F8F4", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ fontSize: 28 }}>🛡️</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: t.textPrimary }}>10-Day Badge — 3 days left!</div>
                                <div style={{ marginTop: 6, height: 5, background: t.cardBorder, borderRadius: 99, overflow: "hidden" }}>
                                    <div style={{ width: "70%", height: "100%", background: "#FFD600", borderRadius: 99 }} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Notifications */}
            <div style={{ position: "relative" }}>
                <button
                    onClick={() => setShowNotif((p) => !p)}
                    style={{
                        background: t.dark ? "#2A2A2A" : "#F3F3EE", border: "none",
                        borderRadius: 10, width: 40, height: 40, cursor: "pointer", fontSize: 18,
                    }}
                >🔔</button>
                <div className="notif-dot" />

                {showNotif && (
                    <div style={{
                        position: "absolute", top: 48, right: 0, width: 300,
                        background: t.cardBg, border: `1px solid ${t.cardBorder}`,
                        borderRadius: 16, boxShadow: "0 16px 48px rgba(0,0,0,0.16)", zIndex: 999,
                    }}>
                        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${t.cardBorder}`, fontWeight: 700, fontSize: 14, color: t.textPrimary }}>
                            Notifications
                        </div>
                        {NOTIFS.map((n, i) => (
                            <div key={i} style={{
                                padding: "12px 18px",
                                borderBottom: i < NOTIFS.length - 1 ? `1px solid ${t.cardBorder}` : "none",
                                fontSize: 13, color: t.textSecondary, display: "flex", gap: 10,
                            }}>
                                <span>{n.icon}</span><span>{n.text}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Dark-mode toggle */}
            <button
                onClick={t.toggle}
                style={{
                    background: t.dark ? "#2A2A2A" : "#F3F3EE", border: "none",
                    borderRadius: 10, width: 40, height: 40, cursor: "pointer", fontSize: 18,
                }}
            >
                {t.dark ? "☀️" : "🌙"}
            </button>
        </div>
    );
}
