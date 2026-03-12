// ─────────────────────────────────────────────
//  SkillBarter — Skill Model
// ─────────────────────────────────────────────
const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: String,
        rating: { type: Number, min: 1, max: 5 },
    },
    { timestamps: true }
);

const SkillSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Skill name is required"],
            trim: true,
        },
        category: {
            type: String,
            required: true,
            enum: [
                "Programming",
                "Design",
                "Languages",
                "Music",
                "Photography",
                "Fitness",
                "Marketing",
                "Cooking",
                "Art",
                "Communication",
                "Other",
            ],
        },
        level: {
            type: String,
            enum: ["Beginner", "Intermediate", "Advanced", "All Levels"],
            default: "Beginner",
        },
        credits: {
            type: Number,
            required: true,
            min: 0.5,
        },
        mentor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // Denormalized for fast listing
        mentorName: String,
        mentorAvatar: String,
        mentorLocation: String,
        mentorBio: String,
        tags: [{ type: String }],
        format: {
            type: String,
            enum: ["Online", "Offline", "Both"],
            default: "Online",
        },
        badge: {
            type: String,
            enum: ["Top Teacher", "Trusted Mentor", "Community Expert", "Beginner Mentor"],
            default: "Beginner Mentor",
        },
        rating: {
            type: Number,
            default: 0,
        },
        reviews: [ReviewSchema],
        reviewCount: {
            type: Number,
            default: 0,
        },
        sessions: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "approved",   // auto-approve for now; admin can change
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Update rating average when reviews change
SkillSchema.methods.calcRating = function () {
    if (this.reviews.length === 0) {
        this.rating = 0;
    } else {
        const sum = this.reviews.reduce((a, r) => a + r.rating, 0);
        this.rating = Math.round((sum / this.reviews.length) * 10) / 10;
    }
    this.reviewCount = this.reviews.length;
};

module.exports = mongoose.model("Skill", SkillSchema);
