// ─────────────────────────────────────────────
//  SkillBarter — API Service (Axios)
//  Centralised HTTP client for the backend
// ─────────────────────────────────────────────

export const BASE_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;

// ── Generic fetch wrapper with JWT ────────────
async function apiFetch(path, options = {}) {
    const token = localStorage.getItem("sb_token");
    const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
    }
    return data;
}

// ── Auth ──────────────────────────────────────
export const authAPI = {
    register: (name, email, password) =>
        apiFetch("/auth/register", {
            method: "POST",
            body: JSON.stringify({ name, email, password }),
        }),

    login: (email, password) =>
        apiFetch("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        }),

    me: () => apiFetch("/auth/me"),
};

// ── Skills ────────────────────────────────────
export const skillsAPI = {
    list: (params = {}) => {
        const qs = new URLSearchParams(
            Object.fromEntries(Object.entries(params).filter(([, v]) => v))
        ).toString();
        return apiFetch(`/skills${qs ? `?${qs}` : ""}`);
    },

    categories: () => apiFetch("/skills/categories"),

    get: (id) => apiFetch(`/skills/${id}`),

    create: (data) =>
        apiFetch("/skills", { method: "POST", body: JSON.stringify(data) }),

    update: (id, data) =>
        apiFetch(`/skills/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

    review: (id, rating, text) =>
        apiFetch(`/skills/${id}/review`, {
            method: "POST",
            body: JSON.stringify({ rating, text }),
        }),
};

// ── Users ─────────────────────────────────────
export const usersAPI = {
    all: () => apiFetch("/users"),

    me: () => apiFetch("/users/me"),

    update: (data) =>
        apiFetch("/users/me", { method: "PATCH", body: JSON.stringify(data) }),

    dashboard: () => apiFetch("/users/dashboard"),

    leaderboard: () => apiFetch("/users/leaderboard"),

    get: (id) => apiFetch(`/users/${id}`),
};

// ── Bookings ──────────────────────────────────
export const bookingsAPI = {
    create: (data) =>
        apiFetch("/bookings", { method: "POST", body: JSON.stringify(data) }),

    mine: () => apiFetch("/bookings/me"),

    asMentor: () => apiFetch("/bookings/mentor"),

    updateStatus: (id, status) =>
        apiFetch(`/bookings/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
};

// ── Wallet ────────────────────────────────────
export const walletAPI = {
    overview: () => apiFetch("/wallet"),

    transactions: (page = 1) => apiFetch(`/wallet/transactions?page=${page}`),

    transfer: (recipientId, amount, description) =>
        apiFetch("/wallet/transfer", {
            method: "POST",
            body: JSON.stringify({ recipientId, amount, description }),
        }),
};

// ── Messages ──────────────────────────────────
export const messagesAPI = {
    inbox: () => apiFetch("/messages/inbox"),

    history: (userId) => apiFetch(`/messages/${userId}`),

    send: (receiverId, text) =>
        apiFetch("/messages", {
            method: "POST",
            body: JSON.stringify({ receiverId, text }),
        }),
};

// ── Admin ─────────────────────────────────────
export const adminAPI = {
    stats: () => apiFetch("/admin/stats"),

    approvals: () => apiFetch("/admin/approvals"),

    updateSkill: (id, status) =>
        apiFetch(`/admin/skills/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ status }),
        }),

    users: (page = 1, q = "") =>
        apiFetch(`/admin/users?page=${page}&q=${encodeURIComponent(q)}`),
};

// ── Notifications ─────────────────────────────
export const notificationsAPI = {
    list: () => apiFetch("/notifications"),
    
    markAllRead: () => 
        apiFetch("/notifications/read-all", { method: "PATCH" }),
        
    markRead: (id) => 
        apiFetch(`/notifications/${id}/read`, { method: "PATCH" })
};
