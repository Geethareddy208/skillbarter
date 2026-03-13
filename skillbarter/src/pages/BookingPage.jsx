// ─────────────────────────────────────────────
//  SkillBarter — Session Booking (4-step wizard)
//  Step 4 now posts real booking to API
// ─────────────────────────────────────────────
import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import { skillsAPI, bookingsAPI } from "../services/api";

const STEPS = ["Choose Mentor", "Pick Date & Time", "Session Type", "Confirm"];
const TIMES = ["9:00 AM", "10:00 AM", "11:00 AM", "2:00 PM", "3:00 PM", "4:00 PM", "6:00 PM", "7:00 PM"];
const TYPES = [
    { ic: "🎥", title: "1-on-1 Video Call", sub: "Private session via video", cr: 1 },
    { ic: "👥", title: "Group Session", sub: "Learn with 2–5 others", cr: 0.5 },
    { ic: "📍", title: "Offline Meetup", sub: "In-person at agreed location", cr: 1.5 },
    { ic: "⚡", title: "Emergency Help", sub: "Quick 20-min problem solving", cr: 0.3 },
];

export default function BookingPage() {
    const t = useTheme();
    const app = useApp();

    const [step, setStep] = useState(1);
    const [skills, setSkills] = useState([]);
    const [selected, setSelected] = useState(null);
    
    // Dynamic Date state
    const today = new Date();
    const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [selectedDate, setSelectedDate] = useState(null);
    
    const [time, setTime] = useState(null);
    const [sessionType, setSessionType] = useState(null);
    const [booking, setBooking] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        skillsAPI.list().then((d) => setSkills(d.skills)).catch(console.error);
    }, []);

    const confirm = async () => {
        if (!selected || !selectedDate || !time || !sessionType) return;
        setSubmitting(true);
        setError(null);
        try {
            const data = await bookingsAPI.create({
                skillId: selected._id,
                date: selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
                time,
                sessionType: sessionType.title,
            });
            setBooking(data.booking);
            setStep(4);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    // Calendar Helpers
    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
    
    const changeMonth = (offset) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
        setViewDate(newDate);
    };

    const isPastDay = (day) => {
        const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        return d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    };

    const isSelected = (day) => {
        return selectedDate && 
               selectedDate.getDate() === day && 
               selectedDate.getMonth() === viewDate.getMonth() && 
               selectedDate.getFullYear() === viewDate.getFullYear();
    };

    return (
        <div style={{ padding: "32px 40px", maxWidth: 800, margin: "0 auto" }}>
            <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 800, fontSize: 26, color: t.textPrimary, marginBottom: 8 }}>Book a Session</div>
            <div style={{ color: t.textSecondary, fontSize: 14, marginBottom: 32 }}>Schedule your learning session with your preferred mentor</div>

            {/* Steps indicator */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: 36 }}>
                {STEPS.map((s, i) => (
                    <div key={s} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                            <div style={{ width: 36, height: 36, borderRadius: "50%", transition: "all 0.3s", background: step > i + 1 ? "#10B981" : step === i + 1 ? "#FFD600" : (t.dark ? "#2A2A2A" : "#E8E8E0"), display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: step >= i + 1 ? "#0A0A0A" : t.textSecondary }}>
                                {step > i + 1 ? "✓" : i + 1}
                            </div>
                            <div style={{ fontSize: 11, color: step === i + 1 ? "#FFD600" : t.textSecondary, marginTop: 6, fontWeight: step === i + 1 ? 600 : 400, textAlign: "center" }}>{s}</div>
                        </div>
                        {i < 3 && <div style={{ height: 2, flex: 1, background: step > i + 1 ? "#FFD600" : (t.dark ? "#2A2A2A" : "#E8E8E0"), marginBottom: 20, transition: "all 0.3s" }} />}
                    </div>
                ))}
            </div>

            <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 20, padding: "32px" }}>

                {/* Step 1 */}
                {step === 1 && (
                    <div>
                        <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 700, fontSize: 18, color: t.textPrimary, marginBottom: 20 }}>Choose Your Mentor</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {skills.slice(0, 6).map((s) => (
                                <div key={s._id} onClick={() => { setSelected(s); setStep(2); }} className="skill-card" style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", borderRadius: 14, border: `1.5px solid ${t.cardBorder}`, cursor: "pointer" }}>
                                    <div style={{ width: 50, height: 50, borderRadius: "50%", background: "#FFD600", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, color: "#0A0A0A" }}>{s.mentorAvatar || "??"}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, color: t.textPrimary, fontSize: 15 }}>{s.mentorName}</div>
                                        <div style={{ fontSize: 13, color: t.textSecondary }}>{s.name}</div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ color: "#FFD600", fontWeight: 700, fontSize: 15 }}>{s.credits} cr/hr</div>
                                        <div style={{ fontSize: 12, color: t.textSecondary }}>⭐ {s.rating || "New"}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2 */}
                {step === 2 && (
                    <div>
                        <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 700, fontSize: 18, color: t.textPrimary, marginBottom: 20 }}>Select Date & Time</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                    <button onClick={() => changeMonth(-1)} style={{ border: "none", background: "none", color: "#FFD600", cursor: "pointer", fontWeight: "bold" }}>←</button>
                                    <div style={{ fontWeight: 700, color: t.textPrimary, fontSize: 14 }}>
                                        {viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                    </div>
                                    <button onClick={() => changeMonth(1)} style={{ border: "none", background: "none", color: "#FFD600", cursor: "pointer", fontWeight: "bold" }}>→</button>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
                                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                                        <div key={i} style={{ textAlign: "center", fontSize: 11, color: t.textSecondary, padding: "4px", fontWeight: 600 }}>{d}</div>
                                    ))}
                                    {Array(getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth())).fill(null).map((_, i) => <div key={`e${i}`} />)}
                                    {Array.from({ length: getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth()) }, (_, i) => i + 1).map((day) => {
                                        const past = isPastDay(day);
                                        const selected = isSelected(day);
                                        return (
                                            <div 
                                                key={day} 
                                                onClick={() => { if (!past) setSelectedDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day)); }} 
                                                className={`cal-day ${selected ? "selected" : ""}`}
                                                style={{ 
                                                    textAlign: "center", padding: "8px 4px", fontSize: 12, 
                                                    color: past ? t.textSecondary : t.textPrimary, 
                                                    opacity: past ? 0.4 : 1, 
                                                    cursor: past ? "default" : "pointer",
                                                    background: selected ? "#FFD600" : "transparent",
                                                    borderRadius: 8,
                                                    fontWeight: selected ? 700 : 400,
                                                    color: selected ? "#000" : (past ? t.textSecondary : t.textPrimary)
                                                }}>
                                                {day}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, color: t.textPrimary, marginBottom: 12, fontSize: 14 }}>Available Times</div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
                                    {TIMES.map((tm) => (
                                        <div key={tm} onClick={() => setTime(tm)} className={`time-slot ${time === tm ? "selected" : ""}`}
                                            style={{ padding: "10px", textAlign: "center", border: `1.5px solid ${t.cardBorder}`, fontSize: 13, color: t.textPrimary, borderRadius: 8, cursor: "pointer", background: time === tm ? "#FFD600" : "transparent" }}>
                                            {tm}
                                        </div>
                                    ))}
                                </div>

                                <div style={{ height: 1, background: t.cardBorder, marginBottom: 20 }} />

                                <div style={{ fontWeight: 600, color: t.textPrimary, marginBottom: 12, fontSize: 14 }}>Or Set Custom Time</div>
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <select 
                                        value={time?.split(':')[0] || "10"} 
                                        onChange={(e) => {
                                            const mins = (time?.split(':')[1] || "00 AM").split(' ')[0];
                                            const period = time?.split(' ')[1] || "AM";
                                            setTime(`${e.target.value}:${mins} ${period}`);
                                        }}
                                        style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1.5px solid ${t.cardBorder}`, background: t.cardBg, color: t.textPrimary }}
                                    >
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                    <span style={{ color: t.textSecondary }}>:</span>
                                    <select 
                                        value={(time?.split(':')[1] || "00").split(' ')[0]} 
                                        onChange={(e) => {
                                            const hour = time?.split(':')[0] || "10";
                                            const period = time?.split(' ')[1] || "AM";
                                            setTime(`${hour}:${e.target.value} ${period}`);
                                        }}
                                        style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1.5px solid ${t.cardBorder}`, background: t.cardBg, color: t.textPrimary }}
                                    >
                                        {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                    <select 
                                        value={time?.split(' ')[1] || "AM"} 
                                        onChange={(e) => {
                                            const base = time?.split(' ')[0] || "10:00";
                                            setTime(`${base} ${e.target.value}`);
                                        }}
                                        style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1.5px solid ${t.cardBorder}`, background: t.cardBg, color: t.textPrimary }}
                                    >
                                        <option value="AM">AM</option>
                                        <option value="PM">PM</option>
                                    </select>
                                </div>

                                {selectedDate && time && (
                                    <button className="btn-yellow" onClick={() => setStep(3)} style={{ width: "100%", padding: "12px", borderRadius: 12, fontSize: 14, marginTop: 24 }}>Next →</button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3 */}
                {step === 3 && (
                    <div>
                        <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 700, fontSize: 18, color: t.textPrimary, marginBottom: 20 }}>Session Type</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            {TYPES.map((ty) => (
                                <div key={ty.title} onClick={() => { setSessionType(ty); confirm(); }} className="skill-card"
                                    style={{ padding: "22px", border: `1.5px solid ${t.cardBorder}`, borderRadius: 16, cursor: submitting ? "wait" : "pointer", textAlign: "center" }}>
                                    <div style={{ fontSize: 36, marginBottom: 12 }}>{ty.ic}</div>
                                    <div style={{ fontWeight: 700, color: t.textPrimary, fontSize: 15, marginBottom: 6 }}>{ty.title}</div>
                                    <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 10 }}>{ty.sub}</div>
                                    <div style={{ color: "#FFD600", fontWeight: 700 }}>{ty.cr} cr/hr</div>
                                </div>
                            ))}
                        </div>
                        {error && <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, background: "#EF444415", color: "#EF4444", fontSize: 13 }}>⚠️ {error}</div>}
                        {submitting && <div style={{ textAlign: "center", color: t.textSecondary, marginTop: 16 }}>Processing booking…</div>}
                    </div>
                )}

                {/* Step 4 — Confirmation */}
                {step === 4 && (
                    <div style={{ textAlign: "center", padding: "20px" }}>
                        <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
                        <div style={{ fontFamily: "'Playfair Display',sans-serif", fontWeight: 800, fontSize: 26, color: t.textPrimary, marginBottom: 10 }}>Session Booked!</div>
                        <div style={{ fontSize: 15, color: t.textSecondary, marginBottom: 28 }}>Your session is confirmed. You'll receive a reminder 30 mins before.</div>
                        <div style={{ background: t.dark ? "#2A2A2A" : "#F8F8F4", borderRadius: 16, padding: "20px", marginBottom: 24, display: "inline-block", minWidth: 300 }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8, textAlign: "left" }}>
                                {[
                                    ["📅", "Skill", booking?.skillName || selected?.name],
                                    ["👤", "Mentor", booking?.mentorName || selected?.mentorName],
                                    ["📅", "Date", booking?.date || selectedDate?.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })],
                                    ["⏰", "Time", booking?.time || time],
                                    ["💳", "Cost", `${booking?.creditsCost} credits deducted`],
                                    ["📹", "Format", booking?.sessionType || "Video Call"],
                                ].map(([ic, l, v]) => (
                                    <div key={l} style={{ display: "flex", gap: 12 }}>
                                        <span>{ic}</span>
                                        <span style={{ color: t.textSecondary, width: 60, fontSize: 14 }}>{l}:</span>
                                        <span style={{ color: t.textPrimary, fontWeight: 600, fontSize: 14 }}>{v}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                            <button className="btn-yellow" onClick={() => { app.navigate("home"); setStep(1); setBooking(null); }} style={{ padding: "13px 28px", borderRadius: 12, fontSize: 15 }}>Go to Dashboard</button>
                            <button className="btn-outline" onClick={() => app.navigate("messages")} style={{ padding: "13px 28px", borderRadius: 12, fontSize: 15 }}>Message Mentor</button>
                        </div>
                    </div>
                )}

                {step > 1 && step < 4 && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
                        <button className="btn-outline" onClick={() => { setStep((s) => s - 1); setError(null); }} style={{ padding: "11px 24px", borderRadius: 12, fontSize: 14 }}>← Back</button>
                    </div>
                )}
            </div>
        </div>
    );
}
