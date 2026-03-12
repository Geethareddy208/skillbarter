// ─────────────────────────────────────────────
//  SkillBarter — Skills Routes
//  GET    /api/skills          (public, filterable)
//  GET    /api/skills/:id      (public)
//  POST   /api/skills          (auth — create)
//  PATCH  /api/skills/:id      (auth — own skill)
//  DELETE /api/skills/:id      (auth — own skill or admin)
//  POST   /api/skills/:id/review (auth)
// ─────────────────────────────────────────────
const express = require("express");
const router = express.Router();
const Skill = require("../models/Skill");
const User = require("../models/User");
const protect = require("../middleware/auth");

// ── GET all skills (with optional filters) ───
router.get("/", async (req, res) => {
    try {
        const { category, level, q, format, mentor } = req.query;

        const filter = { isActive: true, status: "approved" };
        if (category && category !== "All") filter.category = category;
        if (level && level !== "All") filter.level = level;
        if (format && format !== "All") filter.format = format;
        if (mentor) filter.mentor = mentor;
        if (q) {
            filter.$or = [
                { name: { $regex: q, $options: "i" } },
                { mentorName: { $regex: q, $options: "i" } },
                { tags: { $regex: q, $options: "i" } },
            ];
        }

        const skills = await Skill.find(filter)
            .sort({ rating: -1, sessions: -1 })
            .populate("mentor", "name avatar location bio xp");

        res.json({ success: true, count: skills.length, skills });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── GET single skill ──────────────────────────
router.get("/:id", async (req, res) => {
    try {
        const skill = await Skill.findById(req.params.id)
            .populate("mentor", "name avatar location bio sessions rating xp badges")
            .populate("reviews.user", "name avatar");

        if (!skill) return res.status(404).json({ success: false, message: "Skill not found" });
        res.json({ success: true, skill });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── POST create skill ─────────────────────────
router.post("/", protect, async (req, res) => {
    try {
        const { name, category, level, credits, tags, format, bio } = req.body;

        const user = await User.findById(req.user._id);
        const skill = await Skill.create({
            name,
            category,
            level,
            credits,
            tags: tags || [],
            format: format || "Online",
            mentor: user._id,
            mentorName: user.name,
            mentorAvatar: user.avatar,
            mentorLocation: user.location,
            mentorBio: bio || user.bio,
            status: "pending",
        });

        // Link skill to user's teaching list
        user.teachingSkills.push(skill._id);
        await user.save();

        res.status(201).json({ success: true, skill });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── PATCH update skill ────────────────────────
router.patch("/:id", protect, async (req, res) => {
    try {
        const skill = await Skill.findById(req.params.id);
        if (!skill) return res.status(404).json({ success: false, message: "Skill not found" });
        if (skill.mentor.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }
        const allowed = ["name", "category", "level", "credits", "tags", "format", "mentorBio", "isActive"];
        allowed.forEach((k) => { if (req.body[k] !== undefined) skill[k] = req.body[k]; });
        await skill.save();
        res.json({ success: true, skill });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── GET distinct categories ───────────────────
router.get("/categories", async (req, res) => {
    try {
        const cats = await Skill.distinct("category", { isActive: true, status: "approved" });
        res.json({ success: true, categories: ["All", ...cats.sort()] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── POST add review ───────────────────────────
router.post("/:id/review", protect, async (req, res) => {
    try {
        const { text, rating } = req.body;
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: "Rating must be 1–5" });
        }
        const skill = await Skill.findById(req.params.id);
        if (!skill) return res.status(404).json({ success: false, message: "Skill not found" });

        const already = skill.reviews.find(r => r.user.toString() === req.user._id.toString());
        if (already) {
            already.text = text;
            already.rating = rating;
        } else {
            skill.reviews.push({ user: req.user._id, text, rating });
        }
        skill.calcRating();
        await skill.save();
        res.json({ success: true, rating: skill.rating, reviewCount: skill.reviewCount });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
