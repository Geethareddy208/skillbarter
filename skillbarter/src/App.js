// ─────────────────────────────────────────────
//  SkillBarter — App.js  (Root Router)
// ─────────────────────────────────────────────
import "./styles/global.css";

import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { AppProvider, useApp } from "./context/AppContext";

import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import MarketplacePage from "./pages/MarketplacePage";
import SkillDetailPage from "./pages/SkillDetailPage";
import ProfilePage from "./pages/ProfilePage";
import WalletPage from "./pages/WalletPage";
import MessagesPage from "./pages/MessagesPage";
import BookingPage from "./pages/BookingPage";
import AdminPage from "./pages/AdminPage";
import VideoCallPage from "./pages/VideoCallPage";

const PAGES = {
    home: HomePage,
    marketplace: MarketplacePage,
    skilldetail: SkillDetailPage,
    profile: ProfilePage,
    wallet: WalletPage,
    messages: MessagesPage,
    booking: BookingPage,
    admin: AdminPage,
    call: VideoCallPage,
};

// ── Loading splash ─────────────────────────────
function LoadingSplash() {
    const t = useTheme();
    return (
        <div style={{
            minHeight: "100vh", background: t.bg,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 16,
        }}>
            <div style={{
                width: 56, height: 56, borderRadius: "50%",
                border: "4px solid #FFD600", borderTopColor: "transparent",
                animation: "spin 0.8s linear infinite",
            }} />
            <div style={{ color: t.textSecondary, fontSize: 14 }}>Loading SkillBarter…</div>
        </div>
    );
}

// ── Shell (authenticated layout) ───────────────
function Shell() {
    const t = useTheme();
    const app = useApp();
    
    let CurrentPage = PAGES[app.page] || HomePage;
    let pageProps = {};

    const isCall = app.page.startsWith("call/");
    if (isCall) {
        CurrentPage = PAGES["call"];
        pageProps = { meetingId: app.page.split("call/")[1] };
        return (
            <div style={{ height: "100vh", background: "#000", overflow: "hidden" }}>
                <CurrentPage {...pageProps} />
            </div>
        );
    }

    return (
        <div style={{ display: "flex", height: "100vh", background: t.bg, overflow: "hidden" }}>
            <Sidebar />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <Topbar />
                <div style={{ flex: 1, overflowY: "auto" }}>
                    <CurrentPage {...pageProps} />
                </div>
            </div>
        </div>
    );
}

// ── Root ───────────────────────────────────────
function Root() {
    const app = useApp();
    if (app.loading) return <LoadingSplash />;
    return app.loggedIn ? <Shell /> : <LoginPage />;
}

export default function App() {
    return (
        <ThemeProvider>
            <AppProvider>
                <Root />
            </AppProvider>
        </ThemeProvider>
    );
}
