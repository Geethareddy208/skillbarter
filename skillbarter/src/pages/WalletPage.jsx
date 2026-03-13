import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { walletAPI, usersAPI } from "../services/api";

export default function WalletPage() {
    const t = useTheme();
    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Transfer State
    const [showTransfer, setShowTransfer] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const [targetUser, setTargetUser] = useState("");
    const [amount, setAmount] = useState("");
    const [transferLoading, setTransferLoading] = useState(false);
    const [msg, setMsg] = useState({ type: "", text: "" });

    useEffect(() => { loadWallet(); }, []);
    useEffect(() => { loadTransactions(); }, [page]); // eslint-disable-line

    const loadWallet = async () => {
        try {
            const data = await walletAPI.overview();
            setWallet(data.wallet);
        } catch (err) { console.error(err); }
    };

    const loadTransactions = async () => {
        setLoading(true);
        try {
            const data = await walletAPI.transactions(page);
            setTransactions(data.transactions);
            setTotalPages(data.pages);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleClaimBonus = async () => {
        try {
            await walletAPI.bonus();
            loadWallet();
            loadTransactions();
            setMsg({ type: "success", text: "5 Bonus Credits added to your wallet!" });
        } catch (err) {
            setMsg({ type: "error", text: err.message });
        }
    };

    const handleTransfer = async (e) => {
        e.preventDefault();
        if (!targetUser || !amount) return;
        setTransferLoading(true);
        try {
            await walletAPI.transfer(targetUser, parseFloat(amount), "Manual Transfer");
            setMsg({ type: "success", text: `Sent ${amount} credits successfully!` });
            setShowTransfer(false);
            loadWallet();
            loadTransactions();
        } catch (err) {
            setMsg({ type: "error", text: err.message });
        } finally {
            setTransferLoading(false);
        }
    };

    const openTransfer = async () => {
        setShowTransfer(true);
        try {
            const data = await usersAPI.all();
            setAllUsers(data.users);
        } catch (err) { console.error(err); }
    };

    const txIcon = (type) => {
        if (type === "earned") return "↑";
        if (type === "spent") return "↓";
        if (type === "bonus") return "★";
        if (type === "transfer") return "↔";
        return "↔";
    };
    const txColor = (type) => {
        if (type === "earned") return "#10B981";
        if (type === "spent") return "#EF4444";
        if (type === "bonus") return "#FFD600";
        if (type === "transfer") return "#3B82F6";
        return "#6B7280";
    };

    return (
        <div style={{ padding: "32px 40px" }}>
            {/* Header */}
            <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                    <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 800, fontSize: 28, color: t.textPrimary, letterSpacing: "-0.01em" }}>
                        Skill Wallet
                    </div>
                    <div style={{ color: t.textSecondary, fontSize: 14, marginTop: 4 }}>
                        Your credit economy at a glance
                    </div>
                </div>
                {msg.text && (
                    <div style={{ 
                        padding: "8px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600,
                        background: msg.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                        color: msg.type === "success" ? "#10B981" : "#EF4444",
                        border: `1px solid ${msg.type === "success" ? "#10B98130" : "#EF444430"}`
                    }}>
                        {msg.text}
                    </div>
                )}
            </div>

            {/* Beta Bonus Banner */}
            {wallet && wallet.balance < 1 && (
                <div style={{
                    background: "rgba(255,214,0,0.1)", border: "2px dashed #FFD600",
                    borderRadius: 20, padding: "20px 24px", marginBottom: 24,
                    display: "flex", alignItems: "center", gap: 20
                }}>
                    <div style={{ fontSize: 32 }}>🎁</div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: t.textPrimary, fontSize: 16 }}>Running low on credits?</div>
                        <div style={{ fontSize: 13, color: t.textSecondary }}>As a Beta Tester, you can claim a 5-credit bonus to keep the swapping going!</div>
                    </div>
                    <button onClick={handleClaimBonus} className="btn-yellow" style={{ padding: "10px 20px", borderRadius: 12, fontWeight: 700 }}>
                        Claim Bonus
                    </button>
                </div>
            )}

            {/* Balance hero */}
            <div style={{
                background: "linear-gradient(135deg, #FFD600 0%, #F0C800 50%, #E8B800 100%)",
                borderRadius: 28, padding: "36px 40px", marginBottom: 24,
                display: "flex", justifyContent: "space-between", alignItems: "center",
                boxShadow: "0 16px 48px rgba(255,214,0,0.3)",
                position: "relative", overflow: "hidden",
            }}>
                {/* Decorative circles */}
                <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(0,0,0,0.06)" }} />
                <div style={{ position: "absolute", bottom: -20, right: 100, width: 100, height: 100, borderRadius: "50%", background: "rgba(0,0,0,0.04)" }} />
                <div style={{ position: "relative" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#5A4800", marginBottom: 8, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                        Available Balance
                    </div>
                    <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 800, fontSize: 56, color: "#0A0A0A", lineHeight: 1 }}>
                        {wallet?.balance?.toFixed(1) ?? "—"}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#5A4800", marginTop: 8 }}>
                        Credits · 1 credit = 1 hour of teaching
                    </div>
                </div>
                <div style={{ display: "flex", gap: 12, position: "relative" }}>
                    <button 
                        onClick={openTransfer}
                        style={{
                            background: "#0A0A0A", color: "#FFD600", border: "none",
                            borderRadius: 14, padding: "13px 26px", fontWeight: 700,
                            fontSize: 14, cursor: "pointer", transition: "all 0.2s",
                            fontFamily: "'Source Sans 3', sans-serif",
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                        onMouseLeave={e => e.currentTarget.style.transform = "none"}
                    >
                        ↑ Send Credits
                    </button>
                </div>
            </div>

            {/* Transfer Modal */}
            {showTransfer && (
                <div style={{
                    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
                    background: "rgba(0,0,0,0.6)", zIndex: 1000,
                    display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)"
                }}>
                    <div style={{
                        background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 24,
                        width: 400, padding: 32, boxShadow: "0 24px 64px rgba(0,0,0,0.3)"
                    }}>
                        <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 700, fontSize: 22, color: t.textPrimary, marginBottom: 8 }}>Send Credits</div>
                        <div style={{ color: t.textSecondary, fontSize: 13, marginBottom: 24 }}>Share your credits with a friend</div>
                        
                        <form onSubmit={handleTransfer}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: "block", fontSize: 12, color: t.textSecondary, marginBottom: 6, fontWeight: 600 }}>Recipient</label>
                                <select 
                                    value={targetUser} 
                                    onChange={(e) => setTargetUser(e.target.value)}
                                    style={{ 
                                        width: "100%", padding: "12px", borderRadius: 12, 
                                        background: t.dark ? "#2A2A2A" : "#F3F3EE", 
                                        border: "none", color: t.textPrimary, outline: "none"
                                    }}
                                    required
                                >
                                    <option value="">Select a user...</option>
                                    {allUsers.map(u => (
                                        <option key={u._id} value={u._id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: "block", fontSize: 12, color: t.textSecondary, marginBottom: 6, fontWeight: 600 }}>Amount (Credits)</label>
                                <input 
                                    type="number" step="0.1" value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="e.g. 1.0"
                                    style={{ 
                                        width: "100%", padding: "12px", borderRadius: 12, 
                                        background: t.dark ? "#2A2A2A" : "#F3F3EE", 
                                        border: "none", color: t.textPrimary, outline: "none"
                                    }}
                                    required
                                />
                            </div>
                            <div style={{ display: "flex", gap: 12 }}>
                                <button type="button" onClick={() => setShowTransfer(false)} className="btn-outline" style={{ flex: 1, padding: "12px", borderRadius: 12 }}>Cancel</button>
                                <button type="submit" disabled={transferLoading} className="btn-yellow" style={{ flex: 1, padding: "12px", borderRadius: 12, fontWeight: 700 }}>
                                    {transferLoading ? "Sending..." : "Confirm Send"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 28 }}>
                {[
                    { label: "Total Earned", value: wallet?.totalEarned?.toFixed(1) ?? "—", icon: "↑", color: "#10B981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)" },
                    { label: "Total Spent", value: wallet?.totalSpent?.toFixed(1) ?? "—", icon: "↓", color: "#EF4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)" },
                    { label: "Bonus Credits", value: wallet?.totalBonus?.toFixed(1) ?? "—", icon: "★", color: "#FFD600", bg: "rgba(255,214,0,0.1)", border: "rgba(255,214,0,0.2)" },
                ].map(s => (
                    <div key={s.label} style={{
                        background: t.cardBg, border: `1px solid ${t.cardBorder}`,
                        borderRadius: 20, padding: "24px",
                        position: "relative", overflow: "hidden",
                        transition: "all 0.25s",
                    }}
                        onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}
                        onMouseLeave={e => e.currentTarget.style.transform = "none"}
                    >
                        <div style={{
                            position: "absolute", top: 0, right: 0,
                            width: 80, height: 80, borderRadius: "0 0 0 100%",
                            background: s.bg,
                        }} />
                        <div style={{
                            width: 44, height: 44, borderRadius: 14,
                            background: s.bg, border: `1px solid ${s.border}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 22, fontWeight: 700, color: s.color, marginBottom: 14,
                        }}>
                            {s.icon}
                        </div>
                        <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 800, fontSize: 28, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 13, color: t.textSecondary, marginTop: 4, fontWeight: 500 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Transaction history */}
            <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 24, padding: "28px 32px" }}>
                <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 700, fontSize: 18, color: t.textPrimary, marginBottom: 24 }}>
                    Transaction History
                </div>
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="shimmer" style={{ height: 64, borderRadius: 14, marginBottom: 10, background: t.dark ? "rgba(255,255,255,0.04)" : "#F3F3EE" }} />
                    ))
                ) : transactions.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 0", color: t.textSecondary }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
                        <div style={{ fontWeight: 600, color: t.textPrimary, marginBottom: 6 }}>No transactions yet</div>
                        <div style={{ fontSize: 13 }}>Complete a session to see your first transaction</div>
                    </div>
                ) : (
                    transactions.map((tx, i) => (
                        <div key={tx._id} style={{
                            display: "flex", alignItems: "center", gap: 16,
                            padding: "16px 0",
                            borderBottom: i < transactions.length - 1 ? `1px solid ${t.cardBorder}` : "none",
                        }}>
                            <div style={{
                                width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                                background: `${txColor(tx.type)}15`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 20, fontWeight: 700, color: txColor(tx.type),
                                border: `1px solid ${txColor(tx.type)}25`,
                            }}>
                                {txIcon(tx.type)}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: 14, color: t.textPrimary }}>{tx.description}</div>
                                <div style={{ fontSize: 12, color: t.textSecondary, marginTop: 2 }}>
                                    {new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </div>
                            </div>
                            <div style={{
                                fontFamily: "'Playfair Display',sans-serif", fontWeight: 800, fontSize: 17,
                                color: txColor(tx.type),
                            }}>
                                {tx.credits > 0 ? "+" : ""}{tx.credits}
                            </div>
                        </div>
                    ))
                )}

                {totalPages > 1 && (
                    <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 20, paddingTop: 16, borderTop: `1px solid ${t.cardBorder}` }}>
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                            className="btn-outline" style={{ padding: "8px 18px", borderRadius: 10, fontSize: 13 }}>← Prev</button>
                        <span style={{ color: t.textSecondary, padding: "8px 12px", fontSize: 13 }}>Page {page} of {totalPages}</span>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                            className="btn-outline" style={{ padding: "8px 18px", borderRadius: 10, fontSize: 13 }}>Next →</button>
                    </div>
                )}
            </div>
        </div>
    );
}
