const express = require("express");
const JournalEntry = require("../models/journalEntry");
const router = express.Router();

// Middleware to protect routes
const isAuthenticated = (req, res, next) => {
    if (!req.session.userId) return res.redirect("/login");
    next();
};

// Dashboard (list of journal entries)
router.get("/dashboard", isAuthenticated, async (req, res) => {
    const entries = await JournalEntry.find({ user: req.session.userId }).sort({ createdAt: -1 });
    res.render("dashboard", { entries });
});

// New journal entry form
router.get("/entries/new", isAuthenticated, (req, res) => res.render("new"));

// Create journal entry
router.post("/entries", isAuthenticated, async (req, res) => {
    await JournalEntry.create({
        title: req.body.title,
        content: req.body.content,
        user: req.session.userId
    });
    res.redirect("/dashboard");
});

// Edit entry form
router.get("/entries/:id/edit", isAuthenticated, async (req, res) => {
    const entry = await JournalEntry.findOne({ _id: req.params.id, user: req.session.userId });
    if (!entry) return res.redirect("/dashboard");
    res.render("edit", { entry });
});

// Update entry
router.put("/entries/:id", isAuthenticated, async (req, res) => {
    await JournalEntry.updateOne({ _id: req.params.id, user: req.session.userId }, { 
        title: req.body.title, 
        content: req.body.content 
    });
    res.redirect("/dashboard");
});

// Delete entry
router.delete("/entries/:id", isAuthenticated, async (req, res) => {
    await JournalEntry.deleteOne({ _id: req.params.id, user: req.session.userId });
    res.redirect("/dashboard");
});

module.exports = router;
