// ─────────────────────────────────────────────
//  SkillBarter — My Profile (API-driven)
// ─────────────────────────────────────────────
import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import { usersAPI, skillsAPI } from "../services/api";

// Inline pure helper — no mockData dependency
function badgeColor(b) {
    if (b === "Top Teacher") return "#FF6B35";
    if (b === "Trusted Mentor") return "#10B981";
    if (b === "Community Expert") return "#8B5CF6";
    return "#6B7280";
}

const DEFAULT_BADGES = [
    { name: "First Session", icon: "🎯", desc: "Completed your first session" },
    { name: "Trusted Mentor", icon: "🛡️", desc: "Received 10 five-star reviews" },
    { name: "Streak Master", icon: "🔥", desc: "7-day learning streak" },
    { name: "Top Teacher", icon: "🏆", desc: "Teach 50+ sessions" },
    { name: "Community Expert", icon: "🌐", desc: "Join 5 learning rooms" },
    { name: "Skill Collector", icon: "💎", desc: "Learn 10 different skills" },
];

export default function ProfilePage() {
    const t = useTheme();
    const app = useApp();

    const [profile, setProfile] = useState(app.user);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState({ bio: "", location: "", learningSkillsStr: "" });
    const [saving, setSaving] = useState(false);
    const [addingSkill, setAddingSkill] = useState(false);
    const [skillForm, setSkillForm] = useState({ name: "", category: "Programming", level: "Beginner", credits: 1, format: "Online" });
    const [creatingSkill, setCreatingSkill] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const [pRes, lRes] = await Promise.all([usersAPI.me(), usersAPI.leaderboard()]);
                setProfile(pRes.user);
                setLeaderboard(lRes.leaderboard);
                setEditForm({ 
                    bio: pRes.user.bio || "", 
                    location: pRes.user.location || "",
                    learningSkillsStr: (pRes.user.learningSkills || []).join(", ")
                });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const saveProfile = async () => {
        setSaving(true);
        try {
            const learningSkills = editForm.learningSkillsStr.split(",").map(s => s.trim()).filter(s => s);
            const updated = await usersAPI.update({ 
                bio: editForm.bio, 
                location: editForm.location,
                learningSkills
            });
            setProfile(updated.user);
            app.updateUser({ bio: editForm.bio, location: editForm.location, learningSkills });
            setEditMode(false);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleCreateSkill = async () => {
        if (!skillForm.name) return;
        setCreatingSkill(true);
        try {
            const res = await skillsAPI.create(skillForm);
            setProfile(p => ({
                ...p,
                teachingSkills: [...(p.teachingSkills || []), res.skill]
            }));
            setAddingSkill(false);
            setSkillForm({ name: "", category: "Programming", level: "Beginner", credits: 1, format: "Online" });
        } catch (err) {
            console.error(err);
            alert("Failed to create skill: " + err.message);
        } finally {
            setCreatingSkill(false);
        }
    };

    if (loading) return (
        <div style={{ padding: "32px 40px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 28 }}>
                {[1, 2].map(i => <div key={i} className="shimmer" style={{ height: 400, borderRadius: 20, background: t.cardBg, border: `1px solid ${t.cardBorder}` }} />)}
            </div>
        </div>
    );
    if (!profile) return null;

    const userBadges = DEFAULT_BADGES.map(b => ({
        ...b,
        earned: (profile.badges || []).some(ub => ub.name === b.name),
    }));
    const myRank = leaderboard.findIndex(l => l._id === profile._id) + 1;

    return (
        <div style={{ padding: "32px 40px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 28 }}>

                {/* ── Sidebar ── */}
                <div>
                    {/* Profile card */}
                    <div style={{
                        background: t.cardBg, border: `1px solid ${t.cardBorder}`,
                        borderRadius: 24, padding: "32px 24px",
                        textAlign: "center", marginBottom: 20,
                        background: t.dark
                            ? "linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))"
                            : "linear-gradient(145deg, #FFFFFF, #FAFAF5)",
                    }}>
                        {/* Avatar */}
                        <div style={{
                            width: 100, height: 100, borderRadius: "50%",
                            background: "linear-gradient(135deg, #FFD600, #F0C800)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 800, fontSize: 30, color: "#0A0A0A",
                            margin: "0 auto 18px",
                            boxShadow: "0 8px 24px rgba(255,214,0,0.35)",
                        }}>
                            {profile.avatar || profile.name?.substring(0, 2).toUpperCase()}
                        </div>
                        <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 800, fontSize: 22, color: t.textPrimary, marginBottom: 4 }}>
                            {profile.name}
                        </div>
                        {myRank > 0 && (
                            <div style={{ fontSize: 12, color: "#FFD600", fontWeight: 600, marginBottom: 8 }}>
                                🏆 Rank #{myRank} on Leaderboard
                            </div>
                        )}

                        {editMode ? (
                            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                                <input
                                    value={editForm.location}
                                    onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))}
                                    placeholder="Your location"
                                    style={{
                                        width: "100%", padding: "9px 12px", borderRadius: 10,
                                        background: t.dark ? "rgba(255,255,255,0.06)" : "#F3F3EE",
                                        color: t.textPrimary, fontSize: 13,
                                        border: `1px solid ${t.cardBorder}`,
                                    }}
                                />
                                <textarea
                                    value={editForm.bio}
                                    onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))}
                                    placeholder="Short bio"
                                    rows={3}
                                    style={{
                                        width: "100%", padding: "9px 12px", borderRadius: 10,
                                        background: t.dark ? "rgba(255,255,255,0.06)" : "#F3F3EE",
                                        color: t.textPrimary, fontSize: 13,
                                        border: `1px solid ${t.cardBorder}`, resize: "none",
                                    }}
                                />
                                <input
                                    value={editForm.learningSkillsStr}
                                    onChange={e => setEditForm(p => ({ ...p, learningSkillsStr: e.target.value }))}
                                    placeholder="Skills you're learning (comma separated)"
                                    style={{
                                        width: "100%", padding: "9px 12px", borderRadius: 10,
                                        background: t.dark ? "rgba(255,255,255,0.06)" : "#F3F3EE",
                                        color: t.textPrimary, fontSize: 13,
                                        border: `1px solid ${t.cardBorder}`,
                                    }}
                                />
                            </div>
                        ) : (
                            <div style={{ fontSize: 13, color: t.textSecondary, marginTop: 4, lineHeight: 1.5 }}>
                                {profile.bio || "No bio yet"}
                                {profile.location && <> · <span>📍 {profile.location}</span></>}
                            </div>
                        )}

                        {/* Stats row */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 20 }}>
                            {[[profile.sessions || 0, "Sessions"], [profile.rating ? profile.rating.toFixed(1) : "New", "Rating"], [(profile.credits || 0).toFixed(1), "Credits"]].map(([v, l]) => (
                                <div key={l} style={{
                                    background: t.dark ? "rgba(255,255,255,0.06)" : "#F3F3EE",
                                    borderRadius: 12, padding: "12px 8px",
                                }}>
                                    <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 700, fontSize: 18, color: t.textPrimary }}>{v}</div>
                                    <div style={{ fontSize: 11, color: t.textSecondary }}>{l}</div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                            {editMode ? (
                                <>
                                    <button className="btn-yellow" onClick={saveProfile} disabled={saving}
                                        style={{ flex: 1, padding: "10px", borderRadius: 12, fontSize: 13 }}>
                                        {saving ? "Saving..." : "Save"}
                                    </button>
                                    <button className="btn-outline" onClick={() => setEditMode(false)}
                                        style={{ flex: 1, padding: "10px", borderRadius: 12, fontSize: 13 }}>
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <button className="btn-yellow" onClick={() => setEditMode(true)}
                                    style={{ width: "100%", padding: "12px", borderRadius: 12, fontSize: 14 }}>
                                    ✏️ Edit Profile
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Badges */}
                    <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 20, padding: "24px" }}>
                        <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 700, fontSize: 16, color: t.textPrimary, marginBottom: 16 }}>
                            🏅 My Badges
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                            {userBadges.map(b => (
                                <div key={b.name} title={b.desc} style={{
                                    textAlign: "center", padding: "14px 6px", borderRadius: 14,
                                    background: b.earned
                                        ? (t.dark ? "rgba(255,214,0,0.12)" : "rgba(255,214,0,0.1)")
                                        : "transparent",
                                    opacity: b.earned ? 1 : 0.3,
                                    border: `1px solid ${b.earned ? "rgba(255,214,0,0.3)" : t.cardBorder}`,
                                    transition: "all 0.25s",
                                    cursor: "default",
                                }}>
                                    <div style={{ fontSize: 26, marginBottom: 4 }}>{b.icon}</div>
                                    <div style={{ fontSize: 9, color: t.textSecondary, lineHeight: 1.3, fontWeight: 600 }}>{b.name}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Main ── */}
                <div>
                    {/* Teaching Skills */}
                    <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 20, padding: "28px", marginBottom: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 700, fontSize: 18, color: t.textPrimary }}>
                                📚 Skills I Teach
                            </div>
                            <button onClick={() => setAddingSkill(!addingSkill)} style={{ background: "transparent", border: "none", color: "#FFD600", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                                {addingSkill ? "Cancel" : "+ Add Skill"}
                            </button>
                        </div>

                        {addingSkill && (
                            <div style={{ background: t.dark ? "rgba(255,255,255,0.03)" : "#FAFAF5", padding: 16, borderRadius: 12, marginBottom: 16, border: `1px solid ${t.cardBorder}` }}>
                                <input placeholder="Skill Name (e.g. React.js)" value={skillForm.name} onChange={e => setSkillForm(p => ({...p, name: e.target.value}))} 
                                    style={{ width: "100%", padding: "9px 12px", borderRadius: 10, background: t.dark ? "rgba(255,255,255,0.06)" : "#F3F3EE", color: t.textPrimary, fontSize: 13, border: `1px solid ${t.cardBorder}`, marginBottom: 8 }} />
                                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                                    <select value={skillForm.category} onChange={e => setSkillForm(p => ({...p, category: e.target.value}))} 
                                        style={{ flex: 1, padding: "9px 12px", borderRadius: 10, background: t.dark ? "rgba(255,255,255,0.06)" : "#F3F3EE", color: t.textPrimary, fontSize: 13, border: `1px solid ${t.cardBorder}` }}>
                                        <option value="Programming">Programming</option>
                                        <option value="Design">Design</option>
                                        <option value="Languages">Languages</option>
                                        <option value="Music">Music</option>
                                        <option value="Marketing">Marketing</option>
                                        <option value="Fitness">Fitness</option>
                                        <option value="Photography">Photography</option>
                                    </select>
                                    <select value={skillForm.level} onChange={e => setSkillForm(p => ({...p, level: e.target.value}))} 
                                        style={{ flex: 1, padding: "9px 12px", borderRadius: 10, background: t.dark ? "rgba(255,255,255,0.06)" : "#F3F3EE", color: t.textPrimary, fontSize: 13, border: `1px solid ${t.cardBorder}` }}>
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                        <option value="All Levels">All Levels</option>
                                    </select>
                                </div>
                                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                                    <input type="number" step="0.5" placeholder="Credits/hr" value={skillForm.credits} onChange={e => setSkillForm(p => ({...p, credits: Number(e.target.value)}))} 
                                        style={{ flex: 1, padding: "9px 12px", borderRadius: 10, background: t.dark ? "rgba(255,255,255,0.06)" : "#F3F3EE", color: t.textPrimary, fontSize: 13, border: `1px solid ${t.cardBorder}` }} />
                                    <select value={skillForm.format} onChange={e => setSkillForm(p => ({...p, format: e.target.value}))} 
                                        style={{ flex: 1, padding: "9px 12px", borderRadius: 10, background: t.dark ? "rgba(255,255,255,0.06)" : "#F3F3EE", color: t.textPrimary, fontSize: 13, border: `1px solid ${t.cardBorder}` }}>
                                        <option value="Online">Online</option>
                                        <option value="Offline">Offline</option>
                                    </select>
                                </div>
                                <button className="btn-yellow" disabled={creatingSkill} onClick={handleCreateSkill} style={{ width: "100%", padding: 10, borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
                                    {creatingSkill ? "Saving..." : "Save Skill"}
                                </button>
                            </div>
                        )}
                        {(profile.teachingSkills || []).length === 0 ? (
                            <div style={{ color: t.textSecondary, fontSize: 14, padding: "20px 0", textAlign: "center" }}>
                                <div style={{ fontSize: 32, marginBottom: 8 }}>✨</div>
                                No skills listed yet. Add your first skill!
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {(profile.teachingSkills).map(s => (
                                    <div key={s._id} style={{
                                        display: "flex", justifyContent: "space-between", alignItems: "center",
                                        padding: "16px 20px", borderRadius: 14,
                                        border: `1px solid ${t.cardBorder}`,
                                        transition: "all 0.25s",
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.background = t.dark ? "rgba(255,255,255,0.03)" : "#FAFAF5"}
                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 600, color: t.textPrimary, fontSize: 15 }}>{s.name}</div>
                                            <div style={{ fontSize: 12, color: t.textSecondary, marginTop: 2 }}>
                                                ⭐ {s.rating || "New"} · {s.sessions || 0} sessions
                                            </div>
                                        </div>
                                        <div style={{
                                            fontFamily: "'Playfair Display',sans-serif", fontWeight: 800,
                                            background: "linear-gradient(135deg,#FFD600,#F0C800)",
                                            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                                            fontSize: 16,
                                        }}>
                                            {s.credits} cr/hr
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Learning interests */}
                    <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 20, padding: "28px", marginBottom: 20 }}>
                        <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 700, fontSize: 18, color: t.textPrimary, marginBottom: 16 }}>
                            🧠 Skills I'm Learning
                        </div>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            {(profile.learningSkills || []).length === 0 ? (
                                <div style={{ color: t.textSecondary, fontSize: 14 }}>Nothing added yet.</div>
                            ) : (
                                (profile.learningSkills).map(s => (
                                    <div key={s} style={{
                                        background: t.dark ? "rgba(255,255,255,0.08)" : "#F3F3EE",
                                        borderRadius: 99, padding: "8px 18px",
                                        fontSize: 13, color: t.textPrimary, fontWeight: 500,
                                        border: `1px solid ${t.cardBorder}`,
                                    }}>{s}</div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Leaderboard */}
                    <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 20, padding: "28px" }}>
                        <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 700, fontSize: 18, color: t.textPrimary, marginBottom: 16 }}>
                            ⚡ Global Leaderboard
                        </div>
                        {leaderboard.length === 0 ? (
                            <div style={{ color: t.textSecondary, fontSize: 14 }}>No data yet.</div>
                        ) : leaderboard.map((l, i) => {
                            const isMe = l._id === profile._id;
                            const rankEmoji = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
                            return (
                                <div key={l._id} className="leaderboard-row" style={{
                                    display: "flex", alignItems: "center", gap: 16,
                                    padding: "12px 16px", borderRadius: 14, marginBottom: 4,
                                    background: isMe ? "rgba(255,214,0,0.08)" : "transparent",
                                    border: `1px solid ${isMe ? "rgba(255,214,0,0.25)" : "transparent"}`,
                                }}>
                                    <div style={{
                                        fontFamily: "'Playfair Display',sans-serif", fontWeight: 800, fontSize: 16,
                                        width: 30, textAlign: "center",
                                        color: i < 3 ? "#FFD600" : t.textSecondary,
                                    }}>
                                        {rankEmoji || `#${i + 1}`}
                                    </div>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: "50%",
                                        background: isMe ? "linear-gradient(135deg,#FFD600,#F0C800)" : (t.dark ? "rgba(255,255,255,0.08)" : "#F3F3EE"),
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 13, fontWeight: 700, color: isMe ? "#0A0A0A" : t.textPrimary,
                                        boxShadow: isMe ? "0 4px 12px rgba(255,214,0,0.3)" : "none",
                                    }}>
                                        {l.avatar || l.name?.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: isMe ? 700 : 500, color: t.textPrimary, fontSize: 14 }}>
                                            {l.name}{isMe ? " (You)" : ""}
                                        </div>
                                        <div style={{ fontSize: 11, color: l.badges?.[0] ? badgeColor(l.badges[0].name) : t.textSecondary }}>
                                            {l.badges?.[0]?.name || "Member"}
                                        </div>
                                    </div>
                                    <div style={{
                                        fontFamily: "'Playfair Display',sans-serif", fontWeight: 700, fontSize: 14,
                                        background: "linear-gradient(135deg,#FFD600,#F0C800)",
                                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                                    }}>
                                        ⚡ {(l.xp || 0).toLocaleString()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
