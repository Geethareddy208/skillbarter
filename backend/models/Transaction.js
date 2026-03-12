// ─────────────────────────────────────────────
//  SkillBarter — Transaction Model
// ─────────────────────────────────────────────
const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: ["earned", "spent", "bonus", "transfer"],
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        credits: {
            type: Number,
            required: true,     // positive = credit added, negative = credit deducted
        },
        // Optional reference to related booking
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
        },
        // The other user involved
        counterpart: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

TransactionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Transaction", TransactionSchema);
