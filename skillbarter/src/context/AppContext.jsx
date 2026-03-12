// ─────────────────────────────────────────────
//  SkillBarter — App Context (auth, nav, chat)
//  Now wired to real backend API
// ─────────────────────────────────────────────
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI, messagesAPI } from "../services/api";

const AppContext = createContext();

export function AppProvider({ children }) {
    const [loggedIn, setLoggedIn] = useState(false);
    const [user, setUser] = useState(null);          // real user object from DB
    const [page, setPage] = useState("home");
    const [selectedSkill, setSelectedSkill] = useState(null);
    const [activeChat, setActiveChat] = useState(null);
    const [chats, setChats] = useState({});           // userId → messages[]
    const [loading, setLoading] = useState(true);     // initial auth check
    const [error, setError] = useState(null);

    // ── Auto-login from stored token ───────────
    useEffect(() => {
        const restoreSession = async () => {
            const token = localStorage.getItem("sb_token");
            if (!token) { setLoading(false); return; }
            try {
                const data = await authAPI.me();
                setUser(data.user);
                setLoggedIn(true);
            } catch {
                localStorage.removeItem("sb_token");
            } finally {
                setLoading(false);
            }
        };
        restoreSession();
    }, []);

    // ── Register ───────────────────────────────
    const register = async (name, email, password) => {
        setError(null);
        try {
            const data = await authAPI.register(name, email, password);
            localStorage.setItem("sb_token", data.token);
            setUser(data.user);
            setLoggedIn(true);
            return { success: true };
        } catch (err) {
            setError(err.message);
            return { success: false, message: err.message };
        }
    };

    // ── Login ──────────────────────────────────
    const login = async (email, password) => {
        setError(null);
        try {
            const data = await authAPI.login(email, password);
            localStorage.setItem("sb_token", data.token);
            setUser(data.user);
            setLoggedIn(true);
            return { success: true };
        } catch (err) {
            setError(err.message);
            return { success: false, message: err.message };
        }
    };

    // ── Logout ─────────────────────────────────
    const logout = () => {
        localStorage.removeItem("sb_token");
        setLoggedIn(false);
        setUser(null);
        setPage("home");
        setChats({});
    };

    // ── Navigation ─────────────────────────────
    const navigate = (p, skill = null) => {
        if (skill) setSelectedSkill(skill);
        setPage(p);
    };

    // ── Send message (local + API) ─────────────
    const sendMessage = useCallback(async (text, receiverId) => {
        if (!text.trim() || !receiverId) return;
        const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        // Optimistically add to local state
        const optimistic = { from: "me", text, time, _id: Date.now() };
        setChats((prev) => ({
            ...prev,
            [receiverId]: [...(prev[receiverId] || []), optimistic],
        }));

        try {
            await messagesAPI.send(receiverId, text);
        } catch (err) {
            console.error("Send message failed:", err.message);
        }
    }, []);

    // ── Update local user (e.g. after profile edit) ─
    const updateUser = (updates) => {
        setUser((prev) => ({ ...prev, ...updates }));
    };

    return (
        <AppContext.Provider value={{
            loggedIn, user, loading, error,
            register, login, logout,
            page, navigate,
            selectedSkill,
            chats, setChats,
            activeChat, setActiveChat,
            sendMessage,
            updateUser,
        }}>
            {children}
        </AppContext.Provider>
    );
}

export const useApp = () => useContext(AppContext);
