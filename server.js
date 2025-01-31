const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const methodOverride = require("method-override");
const path = require("path");
const bcrypt = require("bcrypt");
const User = require("./models/user");
const JournalEntry = require("./models/journalEntry");
require("dotenv").config();

const app = express();

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static("public"));
app.use(session({
    secret: process.env.SESSION_SECRET || "fallback_secret",
    resave: false,
    saveUninitialized: true
}));

const isAuthenticated = (req, res, next) => {
    if (!req.session.userId) return res.redirect("/login");
    next();
};

// Routes
app.get("/", (req, res) => res.render("index"));

app.get("/register", (req, res) => res.render("register"));
app.post("/register", async (req, res) => {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    await User.create({ username: req.body.username, password: hashedPassword });
    res.redirect("/login");
});

app.get("/login", (req, res) => res.render("login"));
app.post("/login", async (req, res) => {
    const user = await User.findOne({ username: req.body.username });
    if (user && await bcrypt.compare(req.body.password, user.password)) {
        req.session.userId = user._id;
        return res.redirect("/dashboard");
    }
    res.redirect("/login");
});

app.post("/logout", (req, res) => {
    req.session.destroy(() => res.redirect("/"));
});

app.get("/dashboard", isAuthenticated, async (req, res) => {
    const entries = await JournalEntry.find({ user: req.session.userId }).sort({ createdAt: -1 });
    res.render("dashboard", { entries });
});

app.get("/entries/new", isAuthenticated, (req, res) => res.render("new"));
app.post("/entries", isAuthenticated, async (req, res) => {
    await JournalEntry.create({
        title: req.body.title,
        content: req.body.content,
        user: req.session.userId
    });
    res.redirect("/dashboard");
});

app.get("/entries/:id/edit", isAuthenticated, async (req, res) => {
    const entry = await JournalEntry.findOne({ _id: req.params.id, user: req.session.userId });
    if (!entry) return res.redirect("/dashboard");
    res.render("edit", { entry });
});

app.put("/entries/:id", isAuthenticated, async (req, res) => {
    await JournalEntry.updateOne({ _id: req.params.id, user: req.session.userId }, {
        title: req.body.title,
        content: req.body.content
    });
    res.redirect("/dashboard");
});

app.delete("/entries/:id", isAuthenticated, async (req, res) => {
    await JournalEntry.deleteOne({ _id: req.params.id, user: req.session.userId });
    res.redirect("/dashboard");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));