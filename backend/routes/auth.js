// ─────────────────────────────────────────────
//  SkillBarter — Auth Routes
//  POST /api/auth/register
//  POST /api/auth/login
//  GET  /api/auth/me
// ─────────────────────────────────────────────
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const protect = require("../middleware/auth");

// Generate JWT
const signToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// ── Register ──────────────────────────────────
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(400).json({ success: false, message: "Email already registered" });
        }

        const user = await User.create({ name, email, password });
        const token = signToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                credits: user.credits,
                xp: user.xp,
                role: user.role,
                badges: user.badges,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── Login ─────────────────────────────────────
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password required" });
        }

        const user = await User.findOne({ email }).select("+password");
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        // Update login streak
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        let newStreak = user.currentStreak || 0;
        let newMax = user.maxStreak || 0;
        let earnedBadge = false;

        if (user.lastLogin) {
            const startOfLastLogin = new Date(user.lastLogin.getFullYear(), user.lastLogin.getMonth(), user.lastLogin.getDate());
            const diffDays = Math.floor((startOfToday - startOfLastLogin) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                newStreak += 1; // Logged in yesterday
            } else if (diffDays > 1) {
                newStreak = 1; // Streak broken
            }
        } else {
            newStreak = 1; // First login
        }

        if (newStreak > newMax) newMax = newStreak;

        // Check for Streak Master badge
        const hasBadge = user.badges && user.badges.some(b => b.name === "Streak Master");
        if (newStreak >= 7 && !hasBadge) {
            user.badges.push({ name: "Streak Master", icon: "🔥", earnedAt: new Date() });
            user.xp = (user.xp || 0) + 100;
            earnedBadge = true;
            
            // Send notification
            const Notification = require("../models/Notification");
            await Notification.create({
                user: user._id,
                message: "You earned the Streak Master badge! +100 XP",
                type: "success"
            });
        }

        user.currentStreak = newStreak;
        user.maxStreak = newMax;
        user.lastLogin = now;
        await user.save();

        const token = signToken(user._id);

        res.json({
            success: true,
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                credits: user.credits,
                xp: user.xp,
                role: user.role,
                badges: user.badges,
                location: user.location,
                bio: user.bio,
                currentStreak: user.currentStreak,
                maxStreak: user.maxStreak
            },
            earnedStreakBadge: earnedBadge
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── Get current user ──────────────────────────
router.get("/me", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate("teachingSkills");
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
