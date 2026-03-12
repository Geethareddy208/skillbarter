// ─────────────────────────────────────────────
//  SkillBarter — Topbar (real user, no mock notifs)
// ─────────────────────────────────────────────
import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import { notificationsAPI } from "../services/api";

export default function Topbar() {
    const t = useTheme();
    const app = useApp();
    const [showNotif, setShowNotif] = useState(false);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (app.user) {
            notificationsAPI.list()
                .then(res => setNotifications(res.notifications || []))
                .catch(console.error);
        }
    }, [app.user]);

    // Close dropdown on outside click
    useEffect(() => {
        if (!showNotif) return;
        const handler = () => setShowNotif(false);
        document.addEventListener("click", handler);
        return () => document.removeEventListener("click", handler);
    }, [showNotif]);

    const pageTitles = {
        home: "Dashboard", marketplace: "Marketplace", skilldetail: "Skill Detail",
        profile: "My Profile", wallet: "Wallet", messages: "Messages",
        booking: "Book Session", admin: "Admin Panel",
    };

    return (
        <div style={{
            height: 64, background: t.navBg,
            borderBottom: `1px solid ${t.cardBorder}`,
            display: "flex", alignItems: "center",
            padding: "0 32px", gap: 16, flexShrink: 0,
        }}>
            {/* Page title */}
            <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 700, fontSize: 16, color: t.textPrimary, marginRight: "auto" }}>
                {pageTitles[app.page] || "SkillBarter"}
            </div>

            {/* Search bar */}
            <div className="glow-focus" style={{
                display: "flex", alignItems: "center", gap: 10,
                background: t.dark ? "rgba(255,255,255,0.05)" : "#F3F3EE",
                borderRadius: 12, padding: "8px 16px", width: 300,
                border: `1px solid ${t.cardBorder}`,
            }}>
                <span style={{ color: t.textSecondary, fontSize: 14 }}>🔍</span>
                <input
                    placeholder="Search skills, mentors..."
                    style={{ background: "transparent", fontSize: 13, color: t.textPrimary, flex: 1 }}
                    onKeyDown={e => {
                        if (e.key === "Enter") app.navigate("marketplace");
                    }}
                />
            </div>

            {/* XP chip */}
            {app.user && (
                <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "rgba(245,158,11,0.1)",
                    border: "1px solid rgba(245,158,11,0.2)",
                    borderRadius: 99, padding: "6px 14px",
                }}>
                    <span style={{ fontSize: 14 }}>⚡</span>
                    <span style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 700, fontSize: 13, color: "#F59E0B" }}>
                        {(app.user.xp || 0).toLocaleString()} XP
                    </span>
                </div>
            )}

            {/* Notifications */}
            <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
                <button
                    onClick={() => setShowNotif(p => !p)}
                    style={{
                        background: showNotif ? "rgba(255,214,0,0.12)" : (t.dark ? "rgba(255,255,255,0.06)" : "#F3F3EE"),
                        border: `1px solid ${showNotif ? "rgba(255,214,0,0.3)" : t.cardBorder}`,
                        borderRadius: 10, width: 40, height: 40,
                        cursor: "pointer", fontSize: 18, position: "relative",
                        transition: "all 0.2s",
                    }}
                >
                    🔔
                    {notifications.filter(n => !n.read).length > 0 && (
                        <div style={{
                            position: "absolute", top: -4, right: -4,
                            background: "#EF4444", color: "white", fontSize: 10, fontWeight: 700,
                            borderRadius: "50%", width: 18, height: 18,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            border: `2px solid ${t.navBg}`,
                        }}>
                            {notifications.filter(n => !n.read).length}
                        </div>
                    )}
                </button>

                {showNotif && (
                    <div style={{
                        position: "absolute", top: 48, right: 0, width: 320,
                        background: t.navBg, border: `1px solid ${t.cardBorder}`,
                        borderRadius: 18, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", zIndex: 999,
                        overflow: "hidden",
                    }}>
                        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${t.cardBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontWeight: 700, fontSize: 14, color: t.textPrimary }}>Notifications</span>
                            {notifications.some(n => !n.read) && (
                                <span onClick={() => {
                                    notificationsAPI.markAllRead().then(() => {
                                        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                                    }).catch(console.error);
                                }} style={{ fontSize: 11, color: "#FFD600", fontWeight: 600, cursor: "pointer" }}>Mark all read</span>
                            )}
                        </div>
                        {notifications.length === 0 ? (
                            <div style={{ padding: "32px 20px", textAlign: "center" }}>
                                <div style={{ fontSize: 36, marginBottom: 10 }}>🔔</div>
                                <div style={{ color: t.textSecondary, fontSize: 13 }}>No new notifications</div>
                            </div>
                        ) : (
                            <div style={{ maxHeight: 300, overflowY: "auto" }}>
                                {notifications.map(n => (
                                    <div key={n._id} style={{
                                        padding: "12px 20px",
                                        borderBottom: `1px solid ${t.cardBorder}`,
                                        background: n.read ? "transparent" : (t.dark ? "rgba(255,214,0,0.05)" : "rgba(255,214,0,0.05)"),
                                        display: "flex", gap: 12, alignItems: "flex-start"
                                    }}>
                                        <div style={{ fontSize: 18, marginTop: 2 }}>{n.type === 'success' ? '🥳' : '🔔'}</div>
                                        <div>
                                            <div style={{ fontSize: 13, color: t.textPrimary, lineHeight: 1.4, fontWeight: n.read ? 400 : 600 }}>{n.message}</div>
                                            <div style={{ fontSize: 11, color: t.textSecondary, marginTop: 4 }}>
                                                {new Date(n.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Dark-mode toggle */}
            <button
                onClick={t.toggle}
                style={{
                    background: t.dark ? "rgba(255,255,255,0.06)" : "#F3F3EE",
                    border: `1px solid ${t.cardBorder}`,
                    borderRadius: 10, width: 40, height: 40, cursor: "pointer", fontSize: 18,
                    transition: "all 0.2s",
                }}
                title={t.dark ? "Switch to light mode" : "Switch to dark mode"}
            >
                {t.dark ? "☀️" : "🌙"}
            </button>
        </div>
    );
}
