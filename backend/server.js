// ─────────────────────────────────────────────
//  SkillBarter — Express Server Entry Point
// ─────────────────────────────────────────────
require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const connectDB = require("./config/db");

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// ── Socket.io — Real-time messaging ───────────
const io = new Server(server, {
    cors: {
        origin: (origin, callback) => callback(null, true),
        methods: ["GET", "POST"],
        credentials: true
    },
});

app.set("io", io);

// Track online users: userId → socketId
const onlineUsers = new Map();

io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Client joins their own room (userId) to receive direct messages
    socket.on("join", (userId) => {
        socket.join(userId);
        onlineUsers.set(userId, socket.id);
        io.emit("online_users", Array.from(onlineUsers.keys()));
    });

    socket.on("disconnect", () => {
        for (const [userId, sid] of onlineUsers.entries()) {
            if (sid === socket.id) {
                onlineUsers.delete(userId);
                break;
            }
        }
        io.emit("online_users", Array.from(onlineUsers.keys()));
        console.log(`❌ Socket disconnected: ${socket.id}`);
    });

    // WebRTC Room Signaling
    socket.on("join-room", (roomId, userId) => {
        console.log(`👤 User ${userId} joining room ${roomId} (Socket: ${socket.id})`);
        socket.join(roomId);
        
        // Broadcast to others in the room
        socket.to(roomId).emit("user-connected", userId);

        socket.on("disconnect", () => {
            console.log(`👤 User ${userId} left room ${roomId}`);
            socket.to(roomId).emit("user-disconnected", userId);
        });
    });
});

// ── Middleware ─────────────────────────────────
app.use(cors({ origin: (origin, callback) => callback(null, true), credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ───────────────────────────────
app.get("/api/health", (req, res) => {
    res.json({ success: true, message: "SkillBarter API is running 🚀", timestamp: new Date() });
});

// ── API Routes ─────────────────────────────────
app.use("/api/auth",     require("./routes/auth"));
app.use("/api/users",    require("./routes/users"));
app.use("/api/skills",   require("./routes/skills"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/wallet",   require("./routes/wallet"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/admin",    require("./routes/admin"));
app.use("/api/notifications", require("./routes/notifications"));

// ── Global error handler ───────────────────────
app.use((err, req, res, next) => {
    console.error("💥 Server error:", err.stack);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
});

// ── 404 handler ────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Start server ───────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   SkillBarter API running on :${PORT}    ║
║   MongoDB: Connected                   ║
║   Socket.io: Enabled                   ║
╚════════════════════════════════════════╝
    `);
});
