// ─────────────────────────────────────────────
//  SkillBarter — Booking Routes
//  POST /api/bookings        (auth — create booking, deduct credits)
//  GET  /api/bookings/me     (auth — my bookings as learner)
//  GET  /api/bookings/mentor (auth — my bookings as mentor)
//  PATCH /api/bookings/:id   (auth — update status)
// ─────────────────────────────────────────────
const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const Skill = require("../models/Skill");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const protect = require("../middleware/auth");

// Session type credit costs
const SESSION_COSTS = {
    "1-on-1 Video Call": 1,
    "Group Session": 0.5,
    "Offline Meetup": 1.5,
    "Emergency Help": 0.3,
};

// ── POST create booking ───────────────────────
router.post("/", protect, async (req, res) => {
    try {
        const { skillId, date, time, sessionType, notes } = req.body;

        const skill = await Skill.findById(skillId).populate("mentor");
        if (!skill) return res.status(404).json({ success: false, message: "Skill not found" });

        const learner = await User.findById(req.user._id);
        const baseCreditCost = skill.credits;
        const sessionMultiplier = SESSION_COSTS[sessionType] || 1;
        const creditsCost = parseFloat((baseCreditCost * sessionMultiplier).toFixed(2));

        if (learner.credits < creditsCost) {
            return res.status(400).json({
                success: false,
                message: `Insufficient credits. You have ${learner.credits} but need ${creditsCost}.`,
            });
        }

        // Deduct credits from learner
        learner.credits = parseFloat((learner.credits - creditsCost).toFixed(2));
        await learner.save();

        // Add credits to mentor
        const mentor = await User.findById(skill.mentor._id);
        mentor.credits = parseFloat((mentor.credits + creditsCost).toFixed(2));
        mentor.sessions += 1;
        mentor.xp += 50;  // +50 XP per session taught
        await mentor.save();

        // Increment skill sessions count
        skill.sessions += 1;
        await skill.save();

        // Generate meetingId for video and group sessions
        let meetingId = undefined;
        if (sessionType === "1-on-1 Video Call" || sessionType === "Group Session") {
            const crypto = require("crypto");
            meetingId = crypto.randomUUID();
        }

        // Create booking
        const booking = await Booking.create({
            learner: learner._id,
            mentor: mentor._id,
            skill: skill._id,
            skillName: skill.name,
            mentorName: mentor.name,
            mentorAvatar: mentor.avatar,
            date,
            time,
            sessionType: sessionType || "1-on-1 Video Call",
            creditsCost,
            notes: notes || "",
            meetingId,
        });

        // Log transactions for both parties
        await Transaction.create({
            user: learner._id,
            type: "spent",
            description: `Learned ${skill.name} from ${mentor.name}`,
            credits: -creditsCost,
            booking: booking._id,
            counterpart: mentor._id,
        });
        await Transaction.create({
            user: mentor._id,
            type: "earned",
            description: `Taught ${skill.name} to ${learner.name}`,
            credits: creditsCost,
            booking: booking._id,
            counterpart: learner._id,
        });

        // Grant XP to learner too
        learner.xp += 20;
        await learner.save();

        res.status(201).json({ success: true, booking });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── GET my bookings as learner ────────────────
router.get("/me", protect, async (req, res) => {
    try {
        const bookings = await Booking.find({
            $or: [{ learner: req.user._id }, { mentor: req.user._id }]
        })
            .sort({ createdAt: -1 })
            .populate("skill", "name category")
            .populate("mentor", "name avatar")
            .populate("learner", "name avatar");
        res.json({ success: true, bookings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── GET my bookings as mentor ─────────────────
router.get("/mentor", protect, async (req, res) => {
    try {
        const bookings = await Booking.find({ mentor: req.user._id })
            .sort({ createdAt: -1 })
            .populate("skill", "name category")
            .populate("learner", "name avatar");
        res.json({ success: true, bookings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── PATCH update booking status ───────────────
router.patch("/:id", protect, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

        const isOwner =
            booking.learner.toString() === req.user._id.toString() ||
            booking.mentor.toString() === req.user._id.toString();
        if (!isOwner && req.user.role !== "admin") {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }

        if (req.body.status) booking.status = req.body.status;
        await booking.save();
        res.json({ success: true, booking });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
