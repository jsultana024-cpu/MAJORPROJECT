const User = require("../models/user");

module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup.ejs");
}

module.exports.signup = async (req, res, next) => {
        try {
            const username = (req.body.username || "").trim();
            const email = (req.body.email || "").trim().toLowerCase();
            const password = req.body.password;

            if (!username || !email || !password) {
                req.flash("error", "Username, email and password are required.");
                return res.redirect("/signup");
            }

            const newUser = new User({ email, username });
            const registeredUser = await User.register(newUser, password);

            req.login(registeredUser, (err) => {
                if (err) return next(err);
                req.flash("success", "Welcome to Wanderlust!");
                return res.redirect("/listings");
            });
        } catch (e) {
            req.flash("error", e.name === "UserExistsError"
                ? "That username is already taken. Please choose another one."
                : e.message || "Signup failed. Please try again.");
            return res.redirect("/signup");
        }
    };

module.exports.renderLoginForm = (req, res) => {
        res.render("users/login.ejs");
    };
module.exports.login = async (req, res) => {
    req.flash("success", "Welcome back to Wanderlust!");
    let redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "You are logged out!");
        res.redirect("/listings");
    });
};
