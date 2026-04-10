// server/routes/workflows.js

const express      = require("express");
const { Workflow } = require("../db/connect");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// GET /api/workflows — list all (metadata only)
router.get("/", async (req, res) => {
  try {
    const workflows = await Workflow
      .find({ userId: req.session.userId })
      .select("name createdAt updatedAt")
      .sort({ updatedAt: -1 });
    return res.json(workflows);
  } catch (err) {
    return res.status(500).json({ error: "Server error." });
  }
});

// POST /api/workflows — create
router.post("/", async (req, res) => {
  const { name = "My Workflow", data = {} } = req.body;
  try {
    const workflow = await Workflow.create({ userId: req.session.userId, name, data });
    return res.status(201).json(workflow);
  } catch (err) {
    return res.status(500).json({ error: "Server error." });
  }
});

// GET /api/workflows/:id — single
router.get("/:id", async (req, res) => {
  try {
    const workflow = await Workflow.findOne({ _id: req.params.id, userId: req.session.userId });
    if (!workflow) return res.status(404).json({ error: "Workflow not found." });
    return res.json(workflow);
  } catch (err) {
    return res.status(404).json({ error: "Workflow not found." });
  }
});

// PUT /api/workflows/:id — save/update
router.put("/:id", async (req, res) => {
  const { name, data } = req.body;
  try {
    const update = {};
    if (name !== undefined) update.name = name;
    if (data !== undefined) update.data = data;
    const workflow = await Workflow.findOneAndUpdate(
      { _id: req.params.id, userId: req.session.userId },
      { $set: update },
      { new: true }
    );
    if (!workflow) return res.status(404).json({ error: "Workflow not found." });
    return res.json(workflow);
  } catch (err) {
    return res.status(500).json({ error: "Server error." });
  }
});

// DELETE /api/workflows/:id
router.delete("/:id", async (req, res) => {
  try {
    const result = await Workflow.findOneAndDelete({ _id: req.params.id, userId: req.session.userId });
    if (!result) return res.status(404).json({ error: "Workflow not found." });
    return res.json({ message: "Deleted." });
  } catch (err) {
    return res.status(500).json({ error: "Server error." });
  }
});

module.exports = router;
