// ─────────────────────────────────────────────
//  SkillBarter — Admin Dashboard
//  Fetches real stats from API
// ─────────────────────────────────────────────
import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import { adminAPI } from "../services/api";
import { ProgressBar } from "../components/UI";

export default function AdminPage() {
    const t = useTheme();
    const app = useApp();

    const [stats, setStats] = useState(null);
    const [popularSkills, setPopularSkills] = useState([]);
    const [approvals, setApprovals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [sRes, aRes] = await Promise.all([adminAPI.stats(), adminAPI.approvals()]);
            setStats(sRes.stats);
            setPopularSkills(sRes.popularSkills || []);
            setApprovals(aRes.approvals || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApproval = async (id, status) => {
        try {
            await adminAPI.updateSkill(id, status);
            setApprovals((prev) => prev.filter((a) => a._id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    if (app.user?.role !== "admin") {
        return (
            <div style={{ padding: "60px 40px", textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
                <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 800, fontSize: 24, color: t.textPrimary }}>Admin Access Required</div>
                <div style={{ color: t.textSecondary, marginTop: 8 }}>You don't have permission to view this page.</div>
            </div>
        );
    }

    const STAT_ICONS = { totalUsers: "👥", activeToday: "🟢", totalSkills: "📚", totalSessions: "✅" };
    const STAT_LABELS = { totalUsers: "Total Users", activeToday: "Active Today", totalSkills: "Skills Listed", totalSessions: "Sessions Confirmed" };
    const STAT_COLORS = { totalUsers: "#3B82F6", activeToday: "#10B981", totalSkills: "#FFD600", totalSessions: "#F59E0B" };

    return (
        <div style={{ padding: "32px 40px" }}>
            <div style={{ marginBottom: 28 }}>
                <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 800, fontSize: 26, color: t.textPrimary }}>Admin Dashboard</div>
                <div style={{ color: t.textSecondary, fontSize: 14, marginTop: 4 }}>Platform analytics and management</div>
            </div>

            {loading ? (
                <div style={{ color: t.textSecondary }}>Loading stats…</div>
            ) : (
                <>
                    {/* Stats */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 28 }}>
                        {stats && Object.entries(stats).map(([key, val]) => (
                            <div key={key} style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 16, padding: "24px" }}>
                                <div style={{ fontSize: 26, marginBottom: 10 }}>{STAT_ICONS[key]}</div>
                                <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 800, fontSize: 26, color: t.textPrimary }}>{val?.toLocaleString()}</div>
                                <div style={{ fontSize: 13, color: t.textSecondary }}>{STAT_LABELS[key]}</div>
                                <div style={{ fontSize: 12, color: STAT_COLORS[key], fontWeight: 600, marginTop: 4 }}>Live data ↑</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                        {/* Pending approvals */}
                        <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 20, padding: "28px" }}>
                            <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 700, fontSize: 18, color: t.textPrimary, marginBottom: 16 }}>
                                Pending Skill Approvals
                                {approvals.length > 0 && <span style={{ marginLeft: 8, background: "#EF4444", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99 }}>{approvals.length}</span>}
                            </div>
                            {approvals.length === 0 ? (
                                <div style={{ color: t.textSecondary, fontSize: 14 }}>✅ All caught up!</div>
                            ) : (
                                approvals.map((a, i) => (
                                    <div key={a._id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: i < approvals.length - 1 ? `1px solid ${t.cardBorder}` : "none" }}>
                                        <div style={{ width: 38, height: 38, borderRadius: "50%", background: t.dark ? "#2A2A2A" : "#F3F3EE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: t.textPrimary }}>
                                            {a.mentor?.avatar || "??"}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, color: t.textPrimary, fontSize: 14 }}>{a.name}</div>
                                            <div style={{ fontSize: 12, color: t.textSecondary }}>{a.mentor?.name} · {a.category}</div>
                                        </div>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <button onClick={() => handleApproval(a._id, "approved")} style={{ background: "#10B98115", color: "#10B981", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Approve</button>
                                            <button onClick={() => handleApproval(a._id, "rejected")} style={{ background: "#EF444415", color: "#EF4444", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Reject</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Popular skills */}
                        <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 20, padding: "28px" }}>
                            <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 700, fontSize: 18, color: t.textPrimary, marginBottom: 16 }}>Popular Skills</div>
                            {popularSkills.length === 0 ? (
                                <div style={{ color: t.textSecondary, fontSize: 14 }}>No session data yet.</div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    {popularSkills.map((s) => (
                                        <div key={s.skill}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                                <span style={{ fontSize: 14, fontWeight: 500, color: t.textPrimary }}>{s.skill}</span>
                                                <span style={{ fontSize: 12, color: t.textSecondary }}>{s.count}</span>
                                            </div>
                                            <ProgressBar value={s.pct} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
