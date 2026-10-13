if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

console.log("Cloudinary config loaded:", {
  name: !!process.env.CLOUD_NAME,
  key: !!process.env.CLOUD_API_KEY,
  secret: !!process.env.CLOUD_API_SECRET,
});

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

// MongoDB Atlas connection
const dbUrl = process.env.ATLASDB_URL;

async function main() {
  if (!dbUrl) {
    throw new Error("ATLASDB_URL .env file-e set kora nei");
  }

  await mongoose.connect(dbUrl, {
    serverSelectionTimeoutMS: 15000,
  });

  console.log("Connected to DB:", mongoose.connection.name);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: "mysupersecretcode",
  },
  touchAfter: 24 * 3600,
});

store.on("error", (err) => {
  console.log("ERROR in MONGO SESSION STORE", err);
});

const sessionOptions = {
  store,
  secret: process.env.SESSION_SECRET || "development-only-change-me",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Flash Messages & Local Variables Middleware
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.errorMsg = res.locals.error.join(" ");
  res.locals.currUser = req.user;
  next();
});

// Root Route
app.get("/", (req, res) => {
  res.send("Hi, I am root");
});

// Router Middleware
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

// Standard 404 Route
app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found!"));
});

// Generic Error Middleware
app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong!" } = err;
  console.error(err);
  res.status(statusCode).render("error.ejs", { message });
});


// Connect to DB, then start server
main()
  .then(() => {
    app.listen(8080, () => {
      console.log("Server is listening on port 8080");
    });
  })
  .catch((err) => {
    console.error("DB connection FAILED!");
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    process.exit(1);
  });