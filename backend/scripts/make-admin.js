const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });
const User = require("../models/User");

async function makeAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/skillbarter");
        console.log("Connected to MongoDB.");

        const email = process.argv[2];
        if (!email) {
            console.error("Please provide the email of the user to make admin: node make-admin.js <email>");
            process.exit(1);
        }

        const user = await User.findOne({ email });
        if (!user) {
            console.error(`User with email ${email} not found.`);
            process.exit(1);
        }

        user.role = "admin";
        await user.save();
        console.log(`Success! ${user.name} (${user.email}) is now an Admin.`);
        process.exit(0);

    } catch (error) {
        console.error("Error making admin:", error);
        process.exit(1);
    }
}

makeAdmin();
