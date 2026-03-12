// ─────────────────────────────────────────────
//  SkillBarter — User Routes
//  GET   /api/users/me
//  PATCH /api/users/me
//  GET   /api/users/leaderboard
//  GET   /api/users/:id
// ─────────────────────────────────────────────
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Skill = require("../models/Skill");
const protect = require("../middleware/auth");

// ── GET my profile ────────────────────────────
router.get("/me", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate("teachingSkills", "name credits sessions rating");
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── PATCH update my profile ───────────────────
router.patch("/me", protect, async (req, res) => {
    try {
        const allowed = ["name", "location", "bio", "learningSkills", "avatar"];
        const updates = {};
        allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true, runValidators: true }
        ).populate("teachingSkills", "name credits sessions rating");

        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── GET dashboard data ────────────────────────
router.get("/dashboard", protect, async (req, res) => {
    try {
        const Booking = require("../models/Booking");
        const user = await User.findById(req.user._id)
            .populate("teachingSkills", "name credits sessions rating");

        // Upcoming bookings (next 3, learner perspective)
        const upcomingBookings = await Booking.find({
            learner: req.user._id,
            status: { $in: ["confirmed", "pending"] },
        })
            .sort({ createdAt: -1 })
            .limit(3)
            .populate("mentor", "name avatar");

        // Learning progress: count confirmed bookings per skill
        const allBookings = await Booking.find({ learner: req.user._id });
        const progressMap = {};
        for (const b of allBookings) {
            const key = b.skillName;
            if (!progressMap[key]) progressMap[key] = { skill: key, sessions: 0 };
            progressMap[key].sessions += 1;
        }
        const progress = Object.values(progressMap).slice(0, 5);

        // Streak: count consecutive days with XP gain (simple: days with bookings)
        const streak = user.streak || 0;

        res.json({
            success: true,
            stats: {
                credits: user.credits,
                sessions: user.sessions,
                teachingCount: (user.teachingSkills || []).length,
                xp: user.xp,
            },
            upcomingBookings,
            progress,
            streak,
            badges: user.badges || [],
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── GET leaderboard (top 20 by XP) ───────────
router.get("/leaderboard", async (req, res) => {
    try {
        const users = await User.find({ isActive: true })
            .sort({ xp: -1 })
            .limit(20)
            .select("name avatar xp badges sessions rating");
        res.json({ success: true, leaderboard: users });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── GET user by ID (public profile) ──────────
router.get("/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select("-password -email")
            .populate("teachingSkills", "name credits sessions rating category");

        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
