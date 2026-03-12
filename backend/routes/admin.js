// ─────────────────────────────────────────────
//  SkillBarter — Admin Routes
//  GET   /api/admin/stats
//  GET   /api/admin/approvals
//  PATCH /api/admin/skills/:id       (approve/reject)
//  GET   /api/admin/reports
//  GET   /api/admin/users
//  DELETE /api/admin/users/:id
// ─────────────────────────────────────────────
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Skill = require("../models/Skill");
const Booking = require("../models/Booking");
const Transaction = require("../models/Transaction");
const protect = require("../middleware/auth");
const adminOnly = require("../middleware/admin");

// All admin routes require auth + admin role
router.use(protect, adminOnly);

// ── GET platform stats ────────────────────────
router.get("/stats", async (req, res) => {
    try {
        const [totalUsers, totalSkills, totalSessions, activeToday] = await Promise.all([
            User.countDocuments(),
            Skill.countDocuments({ isActive: true }),
            Booking.countDocuments({ status: "confirmed" }),
            User.countDocuments({
                updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            }),
        ]);

        // Popular skills this month
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const popularSkills = await Skill.find({ isActive: true })
            .sort({ sessions: -1 })
            .limit(5)
            .select("name sessions");

        const maxSessions = popularSkills[0]?.sessions || 1;

        res.json({
            success: true,
            stats: {
                totalUsers,
                activeToday,
                totalSkills,
                totalSessions,
            },
            popularSkills: popularSkills.map((s) => ({
                skill: s.name,
                count: `${s.sessions} sessions`,
                pct: Math.round((s.sessions / maxSessions) * 100),
            })),
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── GET pending skill approvals ───────────────
router.get("/approvals", async (req, res) => {
    try {
        const skills = await Skill.find({ status: "pending" })
            .populate("mentor", "name avatar email")
            .sort({ createdAt: -1 });
        res.json({ success: true, approvals: skills });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── PATCH approve or reject a skill ──────────
router.patch("/skills/:id", async (req, res) => {
    try {
        const { status } = req.body;
        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({ success: false, message: "Status must be approved or rejected" });
        }
        const skill = await Skill.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate("mentor", "name email");

        if (!skill) return res.status(404).json({ success: false, message: "Skill not found" });
        res.json({ success: true, skill });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── GET all users (paginated) ─────────────────
router.get("/users", async (req, res) => {
    try {
        const { page = 1, limit = 20, q } = req.query;
        const filter = {};
        if (q) filter.$or = [{ name: { $regex: q, $options: "i" } }, { email: { $regex: q, $options: "i" } }];

        const users = await User.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .select("-password");

        const total = await User.countDocuments(filter);
        res.json({ success: true, users, total, pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── DELETE user ───────────────────────────────
router.delete("/users/:id", async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        res.json({ success: true, message: "User deactivated" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
