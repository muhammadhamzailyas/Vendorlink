const axios = require("axios");
const Proposal = require("../model/proposal");
const Task = require("../model/task");
const User = require("../model/user");
const Contract = require("../model/Contract");

class AIRankingController {
  async rankProposals(req, res) {
    try {
      const { taskId } = req.params;

      if (req.user.role !== "company") {
        return res.status(403).json({ error: "Only companies can rank proposals" });
      }

      const task = await Task.findById(taskId).populate("companyId", "username companyName");
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      if (task.companyId._id.toString() !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const proposals = await Proposal.find({ taskId })
        .populate("vendorId", "username companyName email vendorType description createdAt")
        .lean();

      if (proposals.length === 0) {
        return res.status(400).json({ error: "No proposals to rank" });
      }

      // Get vendor history data for each proposal
      const vendorsData = {};

      for (const proposal of proposals) {
        const vendorId = proposal.vendorId._id;

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

      // Call Python AI service
      const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:5001";

      try {
        await axios.get(`${aiServiceUrl}/health`, { timeout: 2000 });
      } catch (healthError) {
        console.log("AI service not available, using fallback ranking");
        return this.fallbackRanking(task, proposals, vendorsData, res);
      }

      try {
        const response = await axios.post(
          `${aiServiceUrl}/rank-proposals`,
          {
            task: {
              title: task.title,
              description: task.description,
              requirements: task.requirements,
              budget: task.budget,
              deadline: task.deadline,
              category: task.category,
            },
            proposals: proposals,
            vendorsData: vendorsData,
          },
          {
            timeout: 30000,
            headers: { "Content-Type": "application/json" },
          }
        );

        if (response.data.success) {
          return res.json({
            success: true,
            ranked_proposals: response.data.ranked_proposals,
          });
        } else {
          throw new Error("AI ranking failed");
        }
      } catch (aiError) {
        console.error("AI service error:", aiError.message);
        return this.fallbackRanking(task, proposals, vendorsData, res);
      }
    } catch (error) {
      console.error("AI Ranking error:", error);
      return res.status(500).json({
        error: "Failed to rank proposals",
        details: error.message,
      });
    }
  }

  async fallbackRanking(task, proposals, vendorsData, res) {
    try {
      const rankedProposals = proposals.map((proposal) => {
        const vendorId = proposal.vendorId._id;
        const vendorData = vendorsData[vendorId] || {
          totalProjects: 0,
          completedProjects: 0,
          onTimeCompletion: 0,
          averageRating: 0,
          relevantExperience: 0,
        };

        const taskReq = (task.requirements + " " + task.description).toLowerCase();
        const vendorSkills = proposal.skills || [];
        const matchingSkills = vendorSkills.filter(skill =>
          taskReq.includes(skill.toLowerCase())
        );

        const skillsScore = Math.min(35, matchingSkills.length * 7);
        const experienceScore = Math.min(30, vendorData.completedProjects * 2 + vendorData.relevantExperience * 3);
        const reliabilityScore = Math.min(20, vendorData.onTimeCompletion / 5);
        const timelineScore = Math.min(10, vendorData.onTimeCompletion / 10);

        const bidVsBudget = (proposal.bidAmount / task.budget) * 100;
        let bidScore = 5;
        if (bidVsBudget < 30) bidScore = 1;
        else if (bidVsBudget > 150) bidScore = 2;
        else bidScore = 4;

        const totalScore = skillsScore + experienceScore + reliabilityScore + timelineScore + bidScore;

        let reasoning = "";
        if (matchingSkills.length > 2) {
          reasoning = `Strong skills match: ${matchingSkills.slice(0, 3).join(", ")}. `;
        } else if (matchingSkills.length > 0) {
          reasoning = `Has some relevant skills: ${matchingSkills.join(", ")}. `;
        } else {
          reasoning = `No matching skills found. `;
        }

        if (vendorData.completedProjects > 5) {
          reasoning += `Experienced with ${vendorData.completedProjects} projects. `;
        } else if (vendorData.completedProjects > 0) {
          reasoning += `Some experience (${vendorData.completedProjects} projects). `;
        } else {
          reasoning += `New vendor. `;
        }

        if (vendorData.onTimeCompletion > 80) {
          reasoning += `Reliable (${Math.round(vendorData.onTimeCompletion)}% on-time).`;
        }

        return {
          ...proposal,
          aiRank: 0,
          aiScore: Math.round(totalScore),
          aiReasoning: reasoning,
          aiBreakdown: {
            skills_score: skillsScore,
            experience_score: experienceScore,
            reliability_score: reliabilityScore,
            timeline_score: timelineScore,
            bid_score: bidScore,
          },
        };
      });

      rankedProposals.sort((a, b) => b.aiScore - a.aiScore);
      rankedProposals.forEach((prop, index) => {
        prop.aiRank = index + 1;
      });

      return res.json({
        success: true,
        ranked_proposals: rankedProposals,
        fallback: true,
        message: "Ranked by skills and experience (AI service unavailable)",
      });
    } catch (error) {
      console.error("Fallback ranking error:", error);
      return res.status(500).json({
        error: "Ranking failed",
        details: error.message,
      });
    }
  }

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
