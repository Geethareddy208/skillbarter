// ─────────────────────────────────────────────
//  SkillBarter — Messages Routes
//  GET  /api/messages/inbox         (all conversations)
//  GET  /api/messages/:userId        (chat with one user)
//  POST /api/messages               (send message)
//  PATCH /api/messages/:userId/read  (mark all as read)
// ─────────────────────────────────────────────
const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const User = require("../models/User");
const protect = require("../middleware/auth");

// ── GET inbox (all unique conversations) ─────
router.get("/inbox", protect, async (req, res) => {
    try {
        const myId = req.user._id;

        // Find all messages involving me
        const msgs = await Message.find({
            $or: [{ sender: myId }, { receiver: myId }],
        })
            .sort({ createdAt: -1 })
            .populate("sender", "name avatar")
            .populate("receiver", "name avatar");

        // Build conversation map: other user → latest message
        const convMap = new Map();
        for (const m of msgs) {
            const otherId =
                m.sender._id.toString() === myId.toString()
                    ? m.receiver._id.toString()
                    : m.sender._id.toString();
            if (!convMap.has(otherId)) {
                convMap.set(otherId, {
                    user: m.sender._id.toString() === myId.toString() ? m.receiver : m.sender,
                    lastMessage: m.text,
                    lastTime: m.createdAt,
                    unread: 0,
                });
            }
            if (!m.read && m.receiver._id.toString() === myId.toString()) {
                convMap.get(otherId).unread += 1;
            }
        }

        const conversations = Array.from(convMap.values()).sort(
            (a, b) => new Date(b.lastTime) - new Date(a.lastTime)
        );

        res.json({ success: true, conversations });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── GET chat history with a user ──────────────
router.get("/:userId", protect, async (req, res) => {
    try {
        const myId = req.user._id;
        const otherId = req.params.userId;

        const messages = await Message.find({
            $or: [
                { sender: myId, receiver: otherId },
                { sender: otherId, receiver: myId },
            ],
        })
            .sort({ createdAt: 1 })
            .populate("sender", "name avatar");

        // Mark incoming messages as read
        await Message.updateMany(
            { sender: otherId, receiver: myId, read: false },
            { read: true }
        );

        res.json({ success: true, messages });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── POST send message ─────────────────────────
router.post("/", protect, async (req, res) => {
    try {
        const { receiverId, text } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({ success: false, message: "Message text required" });
        }

        const receiver = await User.findById(receiverId);
        if (!receiver) return res.status(404).json({ success: false, message: "Recipient not found" });

        const message = await Message.create({
            sender: req.user._id,
            receiver: receiverId,
            text: text.trim(),
        });

        const populated = await Message.findById(message._id)
            .populate("sender", "name avatar")
            .populate("receiver", "name avatar");

        // Emit via socket.io (attached to req.app)
        const io = req.app.get("io");
        if (io) {
            io.to(receiverId.toString()).emit("new_message", populated);
        }

        res.status(201).json({ success: true, message: populated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
