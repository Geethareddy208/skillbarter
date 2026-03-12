// ─────────────────────────────────────────────
//  SkillBarter — Messages / Chat (API-driven)
// ─────────────────────────────────────────────
import { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import { messagesAPI } from "../services/api";

export default function MessagesPage() {
    const t = useTheme();
    const app = useApp();

    const [contacts, setContacts] = useState([]);
    const [loadingContacts, setLoadingContacts] = useState(true);
    const [activeChatUser, setActiveChatUser] = useState(null); // { _id, name, avatar }
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [sending, setSending] = useState(false);
    const chatRef = useRef(null);

    // Load inbox (conversations list)
    useEffect(() => {
        messagesAPI.inbox()
            .then(d => {
                const convs = d.conversations || [];
                setContacts(convs);
                if (convs.length > 0 && !activeChatUser) {
                    openChat(convs[0].user);
                }
            })
            .catch(console.error)
            .finally(() => setLoadingContacts(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openChat = useCallback(async (user) => {
        setActiveChatUser(user);
        try {
            const data = await messagesAPI.history(user._id);
            const msgs = (data.messages || []).map(m => ({
                _id: m._id,
                from: m.sender._id === app.user?._id ? "me" : m.sender.name,
                text: m.text,
                time: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            }));
            setMessages(msgs);
        } catch (err) {
            console.error(err);
        }
    }, [app.user]);

    useEffect(() => {
        if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, [messages]);

    const send = async () => {
        if (!input.trim() || !activeChatUser || sending) return;
        const text = input.trim();
        setInput("");
        setSending(true);

        // Optimistic update
        const optimistic = { _id: Date.now(), from: "me", text, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
        setMessages(prev => [...prev, optimistic]);

        try {
            await messagesAPI.send(activeChatUser._id, text);
        } catch (err) {
            console.error(err);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (isoStr) => {
        const d = new Date(isoStr);
        const now = new Date();
        const diff = now - d;
        if (diff < 60000) return "<1m";
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
        return `${Math.floor(diff / 86400000)}d`;
    };

    return (
        <div style={{ display: "flex", height: "calc(100vh - 64px)", overflow: "hidden" }}>

            {/* ── Contact list ── */}
            <div style={{ width: 300, borderRight: `1px solid ${t.cardBorder}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
                <div style={{ padding: "20px 20px 12px", borderBottom: `1px solid ${t.cardBorder}` }}>
                    <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 700, fontSize: 18, color: t.textPrimary, marginBottom: 12 }}>
                        Messages
                    </div>
                    <div className="glow-focus" style={{
                        display: "flex", alignItems: "center", gap: 8,
                        background: t.dark ? "rgba(255,255,255,0.05)" : "#F3F3EE",
                        borderRadius: 12, padding: "9px 14px",
                        border: `1px solid ${t.cardBorder}`,
                    }}>
                        <span style={{ color: t.textSecondary, fontSize: 14 }}>🔍</span>
                        <input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search conversations..." 
                            style={{ background: "transparent", fontSize: 13, color: t.textPrimary, flex: 1 }} 
                        />
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: "auto" }}>
                    {loadingContacts ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="shimmer" style={{ margin: "10px 16px", height: 56, borderRadius: 12, background: t.cardBg }} />
                        ))
                    ) : contacts.filter(c => c.user.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                        <div style={{ padding: "40px 20px", textAlign: "center", color: t.textSecondary, fontSize: 13 }}>
                            <div style={{ fontSize: 32, marginBottom: 10 }}>💬</div>
                            No conversations yet.<br />Book a session to start chatting!
                        </div>
                    ) : (
                        contacts.filter(c => c.user.name.toLowerCase().includes(searchQuery.toLowerCase())).map(c => (
                            <div
                                key={c.user._id}
                                className="msg-row"
                                onClick={() => openChat(c.user)}
                                style={{
                                    padding: "14px 20px", cursor: "pointer",
                                    background: activeChatUser?._id === c.user._id
                                        ? (t.dark ? "rgba(255,214,0,0.08)" : "rgba(255,214,0,0.06)")
                                        : "transparent",
                                    borderLeft: activeChatUser?._id === c.user._id ? "3px solid #FFD600" : "3px solid transparent",
                                    transition: "all 0.2s",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <div style={{ position: "relative" }}>
                                        <div style={{
                                            width: 42, height: 42, borderRadius: "50%",
                                            background: "linear-gradient(135deg,#FFD600,#F0C800)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontWeight: 700, fontSize: 13, color: "#0A0A0A",
                                        }}>
                                            {c.user.avatar || c.user.name?.substring(0, 2).toUpperCase()}
                                        </div>
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                                            <span style={{ fontWeight: 600, fontSize: 14, color: t.textPrimary }}>{c.user.name}</span>
                                            <span style={{ fontSize: 11, color: t.textSecondary }}>{formatTime(c.lastTime)}</span>
                                        </div>
                                        <div style={{ fontSize: 12, color: t.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {c.lastMessage}
                                        </div>
                                    </div>
                                    {c.unread > 0 && (
                                        <div style={{
                                            background: "linear-gradient(135deg,#FFD600,#F0C800)",
                                            color: "#0A0A0A", borderRadius: "50%",
                                            width: 20, height: 20,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: 11, fontWeight: 700, flexShrink: 0,
                                        }}>{c.unread}</div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ── Chat area ── */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {activeChatUser ? (
                    <>
                        {/* Header */}
                        <div style={{
                            padding: "16px 24px", borderBottom: `1px solid ${t.cardBorder}`,
                            display: "flex", alignItems: "center", gap: 14, flexShrink: 0,
                        }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: "50%",
                                background: "linear-gradient(135deg,#FFD600,#F0C800)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontWeight: 700, fontSize: 13, color: "#0A0A0A",
                                boxShadow: "0 4px 12px rgba(255,214,0,0.25)",
                            }}>
                                {activeChatUser.avatar || activeChatUser.name?.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, color: t.textPrimary, fontSize: 15 }}>{activeChatUser.name}</div>
                                <div style={{ fontSize: 12, color: "#10B981", display: "flex", alignItems: "center", gap: 4 }}>
                                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
                                    Active now
                                </div>
                            </div>
                            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                                {["📞", "🎥"].map(ic => (
                                    <button key={ic} style={{
                                        background: t.dark ? "rgba(255,255,255,0.06)" : "#F3F3EE",
                                        border: `1px solid ${t.cardBorder}`,
                                        borderRadius: 10, width: 38, height: 38, cursor: "pointer", fontSize: 16,
                                        transition: "all 0.2s",
                                    }}>{ic}</button>
                                ))}
                            </div>
                        </div>

                        {/* Messages */}
                        <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
                            {messages.length === 0 && (
                                <div style={{ textAlign: "center", color: t.textSecondary, fontSize: 13, padding: 40 }}>
                                    <div style={{ fontSize: 40, marginBottom: 12 }}>👋</div>
                                    Start a conversation with {activeChatUser.name}!
                                </div>
                            )}
                            {messages.map(m => (
                                <div key={m._id} style={{ display: "flex", justifyContent: m.from === "me" ? "flex-end" : "flex-start" }}>
                                    <div className={m.from === "me" ? "chat-msg-me" : "chat-msg-other"}
                                        style={{
                                            maxWidth: "62%", padding: "12px 16px", fontSize: 14, lineHeight: 1.6,
                                            background: m.from !== "me" ? (t.dark ? "rgba(255,255,255,0.08)" : "#F3F3EE") : undefined,
                                            color: m.from !== "me" ? t.textPrimary : undefined,
                                        }}>
                                        {m.text}
                                        <div style={{ fontSize: 10, color: m.from === "me" ? "rgba(0,0,0,0.4)" : t.textSecondary, marginTop: 4, textAlign: "right" }}>{m.time}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input */}
                        <div style={{
                            padding: "14px 20px", borderTop: `1px solid ${t.cardBorder}`,
                            display: "flex", gap: 12, alignItems: "center", flexShrink: 0,
                        }}>
                            <div className="glow-focus" style={{
                                flex: 1, background: t.dark ? "rgba(255,255,255,0.06)" : "#F3F3EE",
                                borderRadius: 14, padding: "11px 16px", display: "flex", gap: 8,
                                border: `1px solid ${t.cardBorder}`,
                            }}>
                                <input
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                                    placeholder="Type a message..."
                                    style={{ flex: 1, background: "transparent", fontSize: 14, color: t.textPrimary }}
                                />
                            </div>
                            <button
                                className="btn-yellow"
                                onClick={send}
                                disabled={sending || !input.trim()}
                                style={{
                                    padding: "11px 22px", borderRadius: 12, fontSize: 14,
                                    opacity: (!input.trim() || sending) ? 0.6 : 1,
                                }}
                            >
                                {sending ? "..." : "Send →"}
                            </button>
                        </div>
                    </>
                ) : (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: t.textSecondary }}>
                        <div style={{ fontSize: 64, marginBottom: 20 }}>💬</div>
                        <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 700, fontSize: 20, color: t.textPrimary, marginBottom: 8 }}>
                            Select a conversation
                        </div>
                        <div style={{ fontSize: 14 }}>Choose a contact from the left to start messaging</div>
                    </div>
                )}
            </div>
        </div>
    );
}
