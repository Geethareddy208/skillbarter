const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });
const User = require("../models/User");
const Skill = require("../models/Skill");
const bcrypt = require("bcryptjs");

const friends = [
    { name: "Abhi", email: "abhi@test.com", skill: "ReactJS", category: "Programming" },
    { name: "Tejaswini", email: "tejaswini@test.com", skill: "UI/UX Design", category: "Design" },
    { name: "Geetha", email: "geetha@test.com", skill: "English", category: "Languages" },
    { name: "Snigdha", email: "snigdha@test.com", skill: "Guitar", category: "Music" },
    { name: "Ashmitha", email: "ashmitha@test.com", skill: "Photography", category: "Photography" }
];

async function seedFriends() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        for (const f of friends) {
            // Check if user exists, else create
            let user = await User.findOne({ email: f.email });
            if (!user) {
                user = new User({
                    name: f.name,
                    email: f.email,
                    password: "password123", // Needs pre-save hash hook
                    bio: `Hi, I am ${f.name} and I love teaching ${f.skill}!`,
                    location: "Global",
                    credits: 10
                });
                await user.save();
                console.log(`Created user: ${f.name}`);
            } else {
                console.log(`User ${f.name} already exists. Skipping user creation.`);
            }

            // Create skill if not exists
            const existingSkill = await Skill.findOne({ mentor: user._id, name: f.skill });
            if (!existingSkill) {
                const newSkill = new Skill({
                    name: f.skill,
                    category: f.category,
                    level: "Intermediate",
                    credits: 2,
                    mentor: user._id,
                    mentorName: f.name,
                    mentorAvatar: user.avatar,
                    mentorLocation: user.location,
                    mentorBio: user.bio,
                    format: "Online",
                    rating: 5,
                    reviewCount: 1
                });
                await newSkill.save();
                
                // Add to user teaching skills
                if (!user.teachingSkills.includes(newSkill._id)) {
                    user.teachingSkills.push(newSkill._id);
                    await user.save();
                }
                
                console.log(`Created skill ${f.skill} for ${f.name}`);
            }
        }

        console.log("Magical seed complete! All friends added as mentors.");
        process.exit(0);

    } catch (error) {
        console.error("Error seeding friends:", error);
        process.exit(1);
    }
}

seedFriends();
