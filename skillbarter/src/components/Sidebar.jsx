// ─────────────────────────────────────────────
//  SkillBarter — Sidebar Navigation (real user)
// ─────────────────────────────────────────────
import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import { NavItem } from "./UI";

const NAV_LINKS = [
    { id: "home", label: "Dashboard", icon: "🏠" },
    { id: "marketplace", label: "Marketplace", icon: "🛒" },
    { id: "messages", label: "Messages", icon: "💬" },
    { id: "wallet", label: "Wallet", icon: "💰" },
    { id: "booking", label: "Book Session", icon: "📅" },
    { id: "profile", label: "My Profile", icon: "👤" },
];

export default function Sidebar() {
    const t = useTheme();
    const app = useApp();
    const user = app.user;

    return (
        <div style={{
            width: 228, background: t.navBg,
            borderRight: `1px solid ${t.cardBorder}`,
            display: "flex", flexDirection: "column",
            padding: "0 14px", flexShrink: 0,
            position: "relative",
        }}>
            {/* Subtle top glow */}
            <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 2,
                background: "linear-gradient(90deg, transparent, #FFD600, transparent)",
                opacity: 0.4,
            }} />

            {/* Logo */}
            <div style={{ padding: "22px 10px 16px", borderBottom: `1px solid ${t.cardBorder}`, marginBottom: 12 }}>
                <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 800, fontSize: 22, color: t.textPrimary, letterSpacing: "-0.02em" }}>
                    Skill<span style={{
                        background: "linear-gradient(135deg,#FFD600,#F0C800)",
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    }}>Barter</span>
                </div>
                <div style={{ fontSize: 11, color: t.textSecondary, marginTop: 3, letterSpacing: "0.03em" }}>
                    Exchange Skills · Build Futures
                </div>
            </div>

            {/* Nav links */}
            <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
                {NAV_LINKS.map(l => <NavItem key={l.id} {...l} />)}
                <div style={{ height: 1, background: t.cardBorder, margin: "10px 0" }} />
                {user?.role === "admin" && <NavItem id="admin" label="Admin Panel" icon="⚙️" />}
            </nav>

            {/* User strip */}
            <div style={{ padding: "14px 10px 18px", borderTop: `1px solid ${t.cardBorder}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 38, height: 38, borderRadius: "50%",
                        background: "linear-gradient(135deg,#FFD600,#F0C800)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700, fontSize: 13, color: "#0A0A0A", flexShrink: 0,
                        boxShadow: "0 2px 8px rgba(255,214,0,0.3)",
                    }}>
                        {user?.avatar || user?.name?.substring(0, 2).toUpperCase() || "??"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {user?.name || "Loading..."}
                        </div>
                        <div style={{
                            fontSize: 11, fontWeight: 600,
                            background: "linear-gradient(135deg,#FFD600,#F0C800)",
                            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                        }}>
                            {(user?.credits ?? 0).toFixed(1)} Credits
                        </div>
                    </div>
                    <button
                        onClick={() => app.logout()}
                        style={{
                            background: "none", border: "none", cursor: "pointer",
                            fontSize: 14, color: t.textSecondary, padding: 4, borderRadius: 6,
                            transition: "all 0.2s", flexShrink: 0,
                        }}
                        title="Logout"
                        onMouseEnter={e => e.currentTarget.style.color = "#EF4444"}
                        onMouseLeave={e => e.currentTarget.style.color = t.textSecondary}
                    >
                        ⏏
                    </button>
                </div>
            </div>
        </div>
    );
}
