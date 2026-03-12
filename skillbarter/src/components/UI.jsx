// ─────────────────────────────────────────────
//  SkillBarter — Shared UI Components (Premium)
// ─────────────────────────────────────────────
import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";

/* ── Stat card ── */
export function StatCard({ icon, value, label, sub, accentColor }) {
    const t = useTheme();
    return (
        <div className="stat-card" style={{
            background: t.cardBg,
            border: `1px solid ${t.cardBorder}`,
            borderRadius: 20, padding: "24px",
            position: "relative", overflow: "hidden",
            color: accentColor,
        }}>
            <div style={{
                position: "absolute", top: -20, right: -20,
                width: 90, height: 90, borderRadius: "50%",
                background: `${accentColor}12`,
            }} />
            <div style={{ fontSize: 30, marginBottom: 10 }}>{icon}</div>
            <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 800, fontSize: 28, color: t.textPrimary, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 13, color: t.textSecondary, marginTop: 6, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 11, color: accentColor, fontWeight: 600 }}>{sub}</div>
        </div>
    );
}

/* ── Avatar bubble ── */
export function Avatar({ initials, size = 44 }) {
    return (
        <div style={{
            width: size, height: size, borderRadius: "50%",
            background: "linear-gradient(135deg,#FFD600,#F0C800)",
            flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: size * 0.3, color: "#0A0A0A",
            boxShadow: "0 4px 12px rgba(255,214,0,0.28)",
        }}>
            {initials}
        </div>
    );
}

/* ── Badge chip ── */
export function BadgeChip({ label, color }) {
    return (
        <span className="badge-pill" style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
            {label}
        </span>
    );
}

/* ── Section heading ── */
export function SectionHeading({ children, action }) {
    const t = useTheme();
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 700, fontSize: 17, color: t.textPrimary }}>
                {children}
            </div>
            {action}
        </div>
    );
}

/* ── Progress bar ── */
export function ProgressBar({ value }) {
    const t = useTheme();
    return (
        <div className="progress-bar" style={{ background: t.dark ? "rgba(255,255,255,0.08)" : "#E8E8E0" }}>
            <div className="progress-fill" style={{ width: `${Math.min(100, value)}%` }} />
        </div>
    );
}

/* ── Sidebar nav link ── */
export function NavItem({ id, label, icon }) {
    const t = useTheme();
    const app = useApp();
    const active = app.page === id;
    return (
        <div
            onClick={() => app.navigate(id)}
            className={`nav-link ${active ? "active" : ""}`}
            style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 12, cursor: "pointer",
                color: active ? "#FFD600" : t.textSecondary,
                background: active
                    ? (t.dark ? "rgba(255,214,0,0.1)" : "rgba(255,214,0,0.08)")
                    : "transparent",
                fontWeight: active ? 600 : 400, fontSize: 14,
                transition: "all 0.2s",
                borderLeft: active ? "2px solid #FFD600" : "2px solid transparent",
                marginLeft: -2,
            }}
        >
            <span style={{ fontSize: 18, minWidth: 22, textAlign: "center" }}>{icon}</span>
            <span>{label}</span>
        </div>
    );
}
