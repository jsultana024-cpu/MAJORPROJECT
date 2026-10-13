const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
async function initDB() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("Connected to DB");
    await Listing.deleteMany({});
    await Listing.insertMany(initData.data);
    console.log("Data was initialized successfully!");
  } catch (err) {
    console.error("Database initialization failed:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

initDB();
