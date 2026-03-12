// ─────────────────────────────────────────────
//  SkillBarter — Wallet Routes
//  GET /api/wallet              (balance + summary)
//  GET /api/wallet/transactions (transaction history)
//  POST /api/wallet/transfer    (send credits to another user)
// ─────────────────────────────────────────────
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const protect = require("../middleware/auth");

// ── GET wallet overview ───────────────────────
router.get("/", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("credits name");

        const transactions = await Transaction.find({ user: req.user._id });

        const totalEarned = transactions
            .filter((t) => t.type === "earned" || t.type === "bonus")
            .reduce((sum, t) => sum + t.credits, 0);
        const totalSpent = Math.abs(
            transactions.filter((t) => t.type === "spent").reduce((sum, t) => sum + t.credits, 0)
        );
        const totalBonus = transactions
            .filter((t) => t.type === "bonus")
            .reduce((sum, t) => sum + t.credits, 0);

        res.json({
            success: true,
            wallet: {
                balance: user.credits,
                totalEarned: parseFloat(totalEarned.toFixed(2)),
                totalSpent: parseFloat(totalSpent.toFixed(2)),
                totalBonus: parseFloat(totalBonus.toFixed(2)),
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── GET transaction history ───────────────────
router.get("/transactions", protect, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const transactions = await Transaction.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .populate("counterpart", "name avatar");

        const total = await Transaction.countDocuments({ user: req.user._id });

        res.json({ success: true, transactions, total, page: Number(page), pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── POST transfer credits to another user ─────
router.post("/transfer", protect, async (req, res) => {
    try {
        const { recipientId, amount, description } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: "Invalid amount" });
        }

        const sender = await User.findById(req.user._id);
        if (sender.credits < amount) {
            return res.status(400).json({ success: false, message: "Insufficient credits" });
        }

        const recipient = await User.findById(recipientId);
        if (!recipient) {
            return res.status(404).json({ success: false, message: "Recipient not found" });
        }

        sender.credits = parseFloat((sender.credits - amount).toFixed(2));
        recipient.credits = parseFloat((recipient.credits + amount).toFixed(2));

        await sender.save();
        await recipient.save();

        const desc = description || `Transfer to ${recipient.name}`;
        await Transaction.create({ user: sender._id, type: "transfer", description: `-${desc}`, credits: -amount, counterpart: recipient._id });
        await Transaction.create({ user: recipient._id, type: "transfer", description: `Transfer from ${sender.name}`, credits: amount, counterpart: sender._id });

        res.json({ success: true, newBalance: sender.credits });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
