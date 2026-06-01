const Feedback = require("../model/Feedback");

exports.submitFeedback = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user._id;

    if (!message) return res.status(400).json({ error: "Message is required" });

    const feedback = new Feedback({ userId, message });
    await feedback.save();
    res.status(201).json({ success: true, message: "Feedback submitted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find().populate("userId", "fullName email role").sort({ createdAt: -1 });
    res.json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};