const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const router = express.Router();

// Registration page
router.get("/register", (req, res) => res.render("register"));

// Register user
router.post("/register", async (req, res) => {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    await User.create({ username: req.body.username, password: hashedPassword });
    res.redirect("/login");
});

// Login page
router.get("/login", (req, res) => res.render("login"));

// Login user
router.post("/login", async (req, res) => {
    const user = await User.findOne({ username: req.body.username });
    if (user && await bcrypt.compare(req.body.password, user.password)) {
        req.session.userId = user._id;
        return res.redirect("/dashboard");
    }
    res.redirect("/login");
});

// Logout user
router.post("/logout", (req, res) => {
    req.session.destroy(() => res.redirect("/"));
});

module.exports = router;
