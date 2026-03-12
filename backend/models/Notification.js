const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ["info", "success", "warning", "error", "message", "booking", "wallet"],
            default: "info",
        },
        read: {
            type: Boolean,
            default: false,
        },
        relatedId: {
            type: mongoose.Schema.Types.ObjectId, // Could be another User, Booking, etc. depending on type
            required: false,
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);
