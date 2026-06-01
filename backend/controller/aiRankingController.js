const Proposal = require("../model/proposal");
const Task = require("../model/task");
const Contract = require("../model/Contract");
const aiService = require("../services/aiService");

class AIRankingController {
  /**
   * Main entry point to rank proposals for a task
   */
  async rankProposals(req, res) {
    try {
      const { taskId } = req.params;

      if (req.user.role !== "company") {
        return res.status(403).json({ error: "Only companies can rank proposals" });
      }

      const task = await Task.findById(taskId).populate("companyId", "fullName companyName");
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      if (task.companyId._id.toString() !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const proposals = await Proposal.find({ taskId })
        .populate("vendorId", "fullName companyName email vendorType description createdAt")
        .lean();

      if (proposals.length === 0) {
        return res.status(400).json({ error: "No proposals to rank" });
      }

      // Prepare vendor history context
      const vendorsData = {};
      for (const proposal of proposals) {
        if (!proposal.vendorId) {
          console.warn(`[AIRankingController] Skipping proposal ${proposal._id} because vendorId is missing.`);
          continue;
        }
        const vendorId = proposal.vendorId._id.toString();

        const contracts = await Contract.find({
          vendorId,
          status: { $in: ["completed", "in-progress"] },
        })
          .populate("taskId", "title category")
          .lean();

        const totalProjects = contracts.length;
        const completedProjects = contracts.filter(c => c.status === "completed").length;

        let onTimeCount = 0;
        contracts.forEach((contract) => {
          if (contract.status === "completed" && contract.completedAt && contract.deadline) {
            if (new Date(contract.completedAt) <= new Date(contract.deadline)) {
              onTimeCount++;
            }
          }
        });

        const onTimeCompletion = totalProjects > 0 ? (onTimeCount / totalProjects) * 100 : 0;

        let totalRating = 0;
        let ratedCount = 0;
        contracts.forEach((contract) => {
          if (contract.rating && contract.rating > 0) {
            totalRating += contract.rating;
            ratedCount++;
          }
        });
        const averageRating = ratedCount > 0 ? totalRating / ratedCount : 0;

        const relevantProjects = contracts.filter(
          c => c.taskId && c.taskId.category === task.category
        ).length;

        vendorsData[vendorId] = {
          totalProjects,
          completedProjects,
          onTimeCompletion: Math.round(onTimeCompletion * 10) / 10,
          averageRating: Math.round(averageRating * 10) / 10,
          relevantExperience: relevantProjects,
        };
      }

      // Direct call to migrated AI service
      const rankedProposals = await aiService.rankProposals(
        {
          title: task.title,
          description: task.description,
          requirements: task.requirements,
          budget: task.budget,
          deadline: task.deadline,
          category: task.category,
        },
        proposals,
        vendorsData
      );

      return res.json({
        success: true,
        ranked_proposals: rankedProposals,
      });

    } catch (error) {
      console.error("[AIRankingController] Critical Error:", error);
      return res.status(500).json({
        error: "Failed to rank proposals",
        details: error.message,
      });
    }
  }

  /**
   * Helper to get detailed vendor history for UI visualization
   */
  async getVendorHistory(req, res) {
    try {
      const { vendorId } = req.params;

      const contracts = await Contract.find({
        vendorId,
        status: "completed",
      }).populate("taskId", "title budget deadline category");

      const history = {
        totalCompleted: contracts.length,
        onTimeRate: 0,
        averageRating: 0,
        recentProjects: contracts.slice(-5).map(c => ({
          title: c.taskId?.title || "Unknown",
          completedAt: c.completedAt,
          rating: c.rating,
          amount: c.amount,
          category: c.taskId?.category,
        })),
      };

      let onTimeCount = 0;
      contracts.forEach((contract) => {
        if (contract.completedAt && contract.deadline) {
          if (new Date(contract.completedAt) <= new Date(contract.deadline)) {
            onTimeCount++;
          }
        }
      });

      history.onTimeRate = contracts.length > 0 ? (onTimeCount / contracts.length) * 100 : 0;

      let totalRating = 0;
      let ratedCount = 0;
      contracts.forEach((contract) => {
        if (contract.rating) {
          totalRating += contract.rating;
          ratedCount++;
        }
      });
      history.averageRating = ratedCount > 0 ? totalRating / ratedCount : 0;

      res.json({ success: true, data: history });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AIRankingController();
