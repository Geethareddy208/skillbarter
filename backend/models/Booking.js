// ─────────────────────────────────────────────
//  SkillBarter — Booking Model
// ─────────────────────────────────────────────
const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema(
    {
        learner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        mentor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        skill: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Skill",
            required: true,
        },
        // Denormalized for quick display
        skillName: String,
        mentorName: String,
        mentorAvatar: String,

        date: {
            type: String,       // e.g. "March 15, 2026"
            required: true,
        },
        time: {
            type: String,       // e.g. "3:00 PM"
            required: true,
        },
        sessionType: {
            type: String,
            enum: ["1-on-1 Video Call", "Group Session", "Offline Meetup", "Emergency Help"],
            default: "1-on-1 Video Call",
        },
        creditsCost: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ["confirmed", "completed", "cancelled", "disputed"],
            default: "confirmed",
        },
        notes: {
            type: String,
            default: "",
        },
        meetingId: {
            type: String, 
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Booking", BookingSchema);
