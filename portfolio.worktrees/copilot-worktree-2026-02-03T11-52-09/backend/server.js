const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect("mongodb://127.0.0.1:27017/venomtech")
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error(err));

// ===== SCHEMA =====
const AnalyticsSchema = new mongoose.Schema({
  ip: String,
  timeSpent: Number,
  cookiesAccepted: Boolean,
  createdAt: { type: Date, default: Date.now }
});

const Analytics = mongoose.model("Analytics", AnalyticsSchema);

// ===== ROUTE =====
app.post("/analytics", async (req, res) => {
  try {
    const ip =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    console.log("📥 Incoming analytics:", req.body);

    await Analytics.create({
      ip,
      timeSpent: req.body.timeSpent,
      cookiesAccepted: req.body.cookiesAccepted
    });

    res.json({ message: "Analytics saved" });
  } catch (err) {
    console.error("❌ Analytics error:", err);
    res.status(500).json({ error: "Failed" });
  }
});

app.listen(5000, () =>
  console.log("🚀 Server running on http://localhost:5000")
);
