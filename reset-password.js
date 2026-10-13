require("dotenv").config();

const mongoose = require("mongoose");
const User = require("./models/user.js");

const MONGO_URL = process.env.ATLASDB_URL;

// Terminal থেকে username ও password নেওয়া হবে
const [, , USERNAME = "demo3", NEW_PASSWORD] = process.argv;

async function resetPassword() {
  try {
    if (!MONGO_URL) {
      throw new Error("ATLASDB_URL .env file-e paoa jayni!");
    }

    if (!NEW_PASSWORD) {
      throw new Error(
        "Password din: node reset-password.js demo3 newPassword"
      );
    }

    await mongoose.connect(MONGO_URL);
    console.log("Connected to MongoDB Atlas");

    const user = await User.findOne({ username: USERNAME });

    if (!user) {
      console.log("User not found:", USERNAME);
      return;
    }

    console.log("User found:", USERNAME);
    console.log("Resetting password...");

    // passport-local-mongoose callback ব্যবহার করে password reset
    await new Promise((resolve, reject) => {
      user.setPassword(512003, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    await user.save();

    console.log("Password reset successful!");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("Disconnected from MongoDB");
    }
  }
}

resetPassword();