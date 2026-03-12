// ─────────────────────────────────────────────
//  SkillBarter — Database Seed Script
//  Run: npm run seed
//
//  Creates:
//    • 1 admin user (admin@skillbarter.com / Admin@123)
//    • 8 mentor users (from mock data)
//    • 8 skills (linked to mentors)
//    • Sample transactions for first mentor
// ─────────────────────────────────────────────
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
const Skill = require("./models/Skill");
const Transaction = require("./models/Transaction");
const Booking = require("./models/Booking");
const Message = require("./models/Message");

const connectDB = require("./config/db");

// ── Seed data (mirrors mockData.js) ──────────

const MENTORS = [
    {
        name: "Aryan Mehta",
        email: "aryan@skillbarter.com",
        password: "Aryan@123",
        location: "Mumbai",
        bio: "Senior dev at Google, 8 yrs exp",
        credits: 12.5,
        xp: 4820,
        sessions: 89,
        rating: 4.9,
        learningSkills: ["UI/UX Design", "Spanish"],
    },
    {
        name: "Sofia Chen",
        email: "sofia@skillbarter.com",
        password: "Sofia@123",
        location: "Singapore",
        bio: "Lead designer at Figma",
        credits: 8.0,
        xp: 4210,
        sessions: 67,
        rating: 4.8,
        learningSkills: ["Python", "React"],
    },
    {
        name: "Carlos Rivera",
        email: "carlos@skillbarter.com",
        password: "Carlos@123",
        location: "Madrid",
        bio: "Native speaker, certified teacher",
        credits: 9.5,
        xp: 3200,
        sessions: 154,
        rating: 4.7,
        learningSkills: ["Guitar", "Photography"],
    },
    {
        name: "Priya Nair",
        email: "priya@skillbarter.com",
        password: "Priya@123",
        location: "Bangalore",
        bio: "Berklee graduate, 12 yrs teaching",
        credits: 7.0,
        xp: 2800,
        sessions: 44,
        rating: 4.6,
        learningSkills: ["Yoga", "Photography"],
    },
    {
        name: "James Park",
        email: "james@skillbarter.com",
        password: "James@123",
        location: "Seoul",
        bio: "Meta engineer, React contributor",
        credits: 15.0,
        xp: 3990,
        sessions: 102,
        rating: 5.0,
        learningSkills: ["Spanish", "Guitar"],
    },
    {
        name: "Lena Kowalski",
        email: "lena@skillbarter.com",
        password: "Lena@123",
        location: "Warsaw",
        bio: "Food blogger with 200k followers",
        credits: 4.5,
        xp: 1500,
        sessions: 28,
        rating: 4.5,
        learningSkills: ["Python", "Marketing"],
    },
    {
        name: "Meera Joshi",
        email: "meera@skillbarter.com",
        password: "Meera@123",
        location: "Delhi",
        bio: "RYT-500 certified instructor",
        credits: 11.0,
        xp: 3800,
        sessions: 203,
        rating: 4.9,
        learningSkills: ["Cooking", "Photography"],
    },
    {
        name: "Tom Hayes",
        email: "tom@skillbarter.com",
        password: "Tom@123",
        location: "London",
        bio: "HubSpot certified, ex-Ogilvy",
        credits: 6.5,
        xp: 2500,
        sessions: 71,
        rating: 4.7,
        learningSkills: ["Design", "Python"],
    },
];

const SKILL_TEMPLATES = [
    { name: "Python Programming", category: "Programming", level: "Intermediate", credits: 2, tags: ["Python", "Django", "APIs"], format: "Online", badge: "Top Teacher" },
    { name: "UI/UX Design", category: "Design", level: "Beginner", credits: 1.5, tags: ["Figma", "Prototyping", "Research"], format: "Online", badge: "Trusted Mentor" },
    { name: "Spanish Language", category: "Languages", level: "Beginner", credits: 1, tags: ["Conversation", "Grammar", "Writing"], format: "Online", badge: "Community Expert" },
    { name: "Guitar Mastery", category: "Music", level: "All Levels", credits: 1.5, tags: ["Acoustic", "Electric", "Theory"], format: "Offline", badge: "Trusted Mentor" },
    { name: "React Development", category: "Programming", level: "Advanced", credits: 2.5, tags: ["React", "Hooks", "Performance"], format: "Online", badge: "Top Teacher" },
    { name: "Food Photography", category: "Photography", level: "Intermediate", credits: 1, tags: ["Lighting", "Composition", "Editing"], format: "Offline", badge: "Beginner Mentor" },
    { name: "Yoga & Mindfulness", category: "Fitness", level: "All Levels", credits: 1, tags: ["Hatha", "Vinyasa", "Meditation"], format: "Online", badge: "Top Teacher" },
    { name: "Digital Marketing", category: "Marketing", level: "Intermediate", credits: 2, tags: ["SEO", "Ads", "Analytics"], format: "Online", badge: "Trusted Mentor" },
];

const BADGE_LIST = [
    { name: "First Session", icon: "🎯" },
    { name: "Trusted Mentor", icon: "🛡️" },
    { name: "Streak Master", icon: "🔥" },
];

async function seed() {
    await connectDB();

    try {
        console.log("🗑️  Clearing existing data...");
        await Promise.all([
            User.deleteMany({}),
            Skill.deleteMany({}),
            Transaction.deleteMany({}),
            Booking.deleteMany({}),
            Message.deleteMany({}),
        ]);

        // ── Create admin ─────────────────────────
        console.log("👑 Creating admin user...");
        const admin = await User.create({
            name: "SkillBarter Admin",
            email: "admin@skillbarter.com",
            password: "Admin@123",
            role: "admin",
            credits: 100,
            xp: 9999,
            badges: [{ name: "Admin", icon: "⚙️" }],
        });

        // ── Create mentor users ──────────────────
        console.log("👥 Creating mentor users...");
        const mentorUsers = [];
        for (const m of MENTORS) {
            const user = await User.create({
                ...m,
                badges: BADGE_LIST.slice(0, 2),
            });
            mentorUsers.push(user);
        }

        // ── Create skills linked to mentors ──────
        console.log("📚 Creating skills...");
        const skills = [];
        for (let i = 0; i < SKILL_TEMPLATES.length; i++) {
            const tmpl = SKILL_TEMPLATES[i];
            const mentor = mentorUsers[i];
            const skill = await Skill.create({
                ...tmpl,
                mentor: mentor._id,
                mentorName: mentor.name,
                mentorAvatar: mentor.avatar,
                mentorLocation: mentor.location,
                mentorBio: mentor.bio,
                rating: mentor.rating,
                sessions: mentor.sessions,
                status: "approved",
                reviews: [],
                reviewCount: 0,
            });
            mentor.teachingSkills.push(skill._id);
            await mentor.save();
            skills.push(skill);
        }

        // ── Create sample transactions for Aryan ─
        console.log("💳 Creating sample transactions...");
        const aryan = mentorUsers[0];
        const sofia = mentorUsers[1];
        const carlos = mentorUsers[2];

        const txData = [
            { user: aryan._id, type: "earned", description: "Taught Python to Rahul Singh", credits: 2, counterpart: sofia._id },
            { user: aryan._id, type: "spent", description: "Learned UI/UX from Sofia Chen", credits: -1.5, counterpart: sofia._id },
            { user: aryan._id, type: "earned", description: "Taught React to Emma White", credits: 2.5 },
            { user: aryan._id, type: "spent", description: "Learned Spanish from Carlos", credits: -1, counterpart: carlos._id },
            { user: aryan._id, type: "earned", description: "Taught Python to Anika Das", credits: 2 },
            { user: aryan._id, type: "bonus", description: "Community challenge reward", credits: 1 },
        ];
        await Transaction.insertMany(txData);

        // ── Create sample messages ───────────────
        console.log("💬 Creating sample messages...");
        await Message.insertMany([
            { sender: sofia._id, receiver: aryan._id, text: "Hey! Ready for tomorrow's session?", read: true },
            { sender: aryan._id, receiver: sofia._id, text: "Yes! I've been practising wireframes.", read: true },
            { sender: sofia._id, receiver: aryan._id, text: "Amazing! Bring your portfolio drafts.", read: true },
            { sender: sofia._id, receiver: aryan._id, text: "Can we reschedule to Friday?", read: false },
            { sender: carlos._id, receiver: aryan._id, text: "Hola! How did the homework go?", read: true },
            { sender: aryan._id, receiver: carlos._id, text: "I practised for 30 minutes. Getting better!", read: true },
            { sender: carlos._id, receiver: aryan._id, text: "¡Gracias! See you next week", read: false },
        ]);

        console.log(`
╔══════════════════════════════════════════════╗
║       ✅ Database Seeded Successfully!       ║
╠══════════════════════════════════════════════╣
║  Admin:   admin@skillbarter.com / Admin@123  ║
║  Mentors: aryan@skillbarter.com / Aryan@123  ║
║           sofia@skillbarter.com / Sofia@123  ║
║           (and 6 more — see MENTORS array)   ║
║  Skills:  8 skills created                   ║
╚══════════════════════════════════════════════╝
        `);
    } catch (err) {
        console.error("❌ Seed error:", err);
    } finally {
        mongoose.disconnect();
    }
}

seed();
