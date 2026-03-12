// ─────────────────────────────────────────────
//  SkillBarter — Login / Signup Page
//  Wired to real API: register + login
// ─────────────────────────────────────────────
import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import logo from "../logo.png";

export default function LoginPage() {
    const t = useTheme();
    const app = useApp();

    const [isLogin, setIsLogin] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [localError, setLocalError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

    const handleSubmit = async () => {
        setLocalError("");
        if (!form.email || !form.password || (!isLogin && !form.name)) {
            setLocalError("Please fill in all fields.");
            return;
        }
        setSubmitting(true);
        const result = isLogin
            ? await app.login(form.email, form.password)
            : await app.register(form.name, form.email, form.password);
        setSubmitting(false);
        if (!result.success) setLocalError(result.message);
    };

    const errMsg = localError || app.error;

    return (
        <div style={{
            minHeight: "100vh", background: t.bg,
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative", overflow: "hidden",
        }}>
            {/* Decorative circles */}
            <div style={{ position: "absolute", top: -120, right: -120, width: 480, height: 480, borderRadius: "50%", background: "rgba(255,214,0,0.08)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -80, left: -80, width: 320, height: 320, borderRadius: "50%", background: "rgba(255,214,0,0.06)", pointerEvents: "none" }} />

            <div style={{ display: "flex", width: 960, minHeight: 560, borderRadius: 24, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.18)" }}>

                {/* ── Left yellow panel ── */}
                <div style={{ width: 420, background: "#FFD600", padding: "60px 48px", display: "flex", flexDirection: "column", justifyContent: "flex-start", gap: 24 }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
                                <img src={logo} alt="SkillBarter Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </div>
                            <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 800, fontSize: 32, color: "#0A0A0A" }}>SkillBarter</div>
                        </div>
                        <div style={{ fontSize: 14, color: "#5A4800", marginBottom: 16 }}>Exchange Skills. Build Futures.</div>
                        <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 700, fontSize: 28, color: "#0A0A0A", marginBottom: 12 }}>
                            Connect,<br />Share Skills &<br />Grow.
                        </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {[
                            ["🎯", "No money needed", "Exchange your skills for others"],
                            ["🌍", "Global community", "Connect with learners in 80+ countries"],
                            ["⭐", "Verified mentors", "Trust-based rating system"],
                        ].map(([ic, t1, t2]) => (
                            <div key={t1} style={{ display: "flex", gap: 14, alignItems: "center" }}>
                                <div style={{ fontSize: 22 }}>{ic}</div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 14, color: "#0A0A0A" }}>{t1}</div>
                                    <div style={{ fontSize: 12, color: "#5A4800" }}>{t2}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Right auth panel ── */}
                <div style={{ flex: 1, background: t.cardBg, padding: "60px 48px", display: "flex", flexDirection: "column", justifyContent: "center" }}>

                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
                        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#FFD600", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                            <img src={logo} alt="SkillBarter Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                        <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 800, fontSize: 22, color: t.textPrimary }}>
                            {isLogin ? "Welcome Back" : "Create Account"}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: "flex", gap: 24, marginBottom: 32, borderBottom: `1px solid ${t.cardBorder}`, paddingBottom: 12 }}>
                        {[["Log In", true], ["Sign Up", false]].map(([label, val]) => (
                            <span key={label} onClick={() => { setIsLogin(val); setLocalError(""); }}
                                style={{
                                    fontSize: 16, fontWeight: 700, cursor: "pointer",
                                    color: isLogin === val ? t.textPrimary : t.textSecondary,
                                    fontFamily: "'Playfair Display',sans-serif",
                                    paddingBottom: 12,
                                    borderBottom: isLogin === val ? "2.5px solid #FFD600" : "2.5px solid transparent",
                                }}>
                                {label}
                            </span>
                        ))}
                    </div>

                    {/* Error banner */}
                    {errMsg && (
                        <div style={{ background: "#EF444415", border: "1px solid #EF4444", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#EF4444" }}>
                            ⚠️ {errMsg}
                        </div>
                    )}

                    {!isLogin && <Field label="Full Name" value={form.name} onChange={set("name")} placeholder="Aryan Mehta" t={t} />}
                    <Field label="Email" value={form.email} onChange={set("email")} placeholder="you@example.com" t={t} />
                    <Field label="Password" value={form.password} onChange={set("password")} placeholder="••••••••" type="password" t={t} />

                    <button className="btn-yellow" onClick={handleSubmit} disabled={submitting}
                        style={{ width: "100%", padding: "14px", borderRadius: 12, fontSize: 16, marginTop: 8, opacity: submitting ? 0.7 : 1, cursor: submitting ? "wait" : "pointer" }}>
                        {submitting ? "Please wait…" : isLogin ? "Log In →" : "Create My Account →"}
                    </button>

                    <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: t.textSecondary }}>
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <span style={{ color: "#FFD600", cursor: "pointer", fontWeight: 600 }} onClick={() => { setIsLogin(!isLogin); setLocalError(""); }}>
                            {isLogin ? "Sign Up" : "Log In"}
                        </span>
                    </div>
                </div>
            </div>

            <button onClick={t.toggle} style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", cursor: "pointer", fontSize: 20 }}>
                {t.dark ? "☀️" : "🌙"}
            </button>
        </div>
    );
}

function Field({ label, value, onChange, placeholder, type = "text", t }) {
    return (
        <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: t.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>{label}</label>
            <input
                type={type} value={value} onChange={onChange} placeholder={placeholder}
                style={{ width: "100%", background: t.inputBg, borderRadius: 10, padding: "12px 16px", fontSize: 15, color: t.textPrimary, marginTop: 6 }}
            />
        </div>
    );
}
