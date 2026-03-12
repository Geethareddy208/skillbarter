// ─────────────────────────────────────────────
//  SkillBarter — User Model
// ─────────────────────────────────────────────
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: 6,
            select: false,
        },
        avatar: {
            type: String,           // initials e.g. "AM"
            default: "",
        },
        location: {
            type: String,
            default: "",
        },
        bio: {
            type: String,
            default: "",
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },
        // Skill-barter economy
        credits: {
            type: Number,
            default: 5,             // new users start with 5 credits
        },
        xp: {
            type: Number,
            default: 0,
        },
        sessions: {
            type: Number,
            default: 0,
        },
        rating: {
            type: Number,
            default: 0,
        },
        ratingCount: {
            type: Number,
            default: 0,
        },
        // Skills they teach (ref to Skill docs)
        teachingSkills: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Skill",
            },
        ],
        // Skills they're learning (tags/names)
        learningSkills: [{ type: String }],
        // Badges earned
        badges: [
            {
                name: String,
                icon: String,
                earnedAt: { type: Date, default: Date.now },
            },
        ],
        // Streaks
        currentStreak: {
            type: Number,
            default: 0,
        },
        maxStreak: {
            type: Number,
            default: 0,
        },
        lastLogin: {
            type: Date,
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Hash password before save
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 12);
    // Set avatar initials from name
    if (!this.avatar && this.name) {
        const parts = this.name.split(" ");
        this.avatar =
            parts.length >= 2
                ? (parts[0][0] + parts[1][0]).toUpperCase()
                : parts[0].substring(0, 2).toUpperCase();
    }
    next();
});

// Compare password
UserSchema.methods.matchPassword = async function (entered) {
    return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model("User", UserSchema);
