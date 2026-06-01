const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.0-flash";

let genAI = null;
if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

/**
 * Creates a skill-based ranking prompt for Gemini
 */
const createRankingPrompt = (task, proposals, vendorsData) => {
  const taskDetails = `
TASK DETAILS:
- Title: ${task.title || "N/A"}
- Description: ${task.description || "N/A"}
- Requirements: ${task.requirements || "N/A"}
- Budget: $ ${(task.budget || 0).toLocaleString()}
- Deadline: ${task.deadline || "N/A"}
- Category: ${task.category || "N/A"}
    `;

  let proposalsText = "PROPOSALS:\n";
  proposals.forEach((p, i) => {
    const vendor = p.vendorId || {};
    const vendorId = vendor._id ? vendor._id.toString() : String(vendor);
    const vendorName = vendor.companyName || vendor.fullName || "Unknown";
    const vendorInfo = vendorsData[vendorId] || {};

    const skills = p.skills || [];
    const skillsText =
      skills.slice(0, 5).join(", ") +
      (skills.length > 5 ? ` and ${skills.length - 5} more` : "");

    proposalsText += `
Proposal ${i + 1} (ID: ${p._id}):
VENDOR: ${vendorName}
VENDOR HISTORY:
- Total Projects: ${vendorInfo.totalProjects || 0}
- Completed Projects: ${vendorInfo.completedProjects || 0}
- On-Time Delivery: ${vendorInfo.onTimeCompletion || 0}%
- Average Rating: ${vendorInfo.averageRating || 0}/5
- Relevant Experience (same category): ${vendorInfo.relevantExperience || 0} projects
PROPOSAL DETAILS:
- Bid: $ ${(p.bidAmount || 0).toLocaleString()}
- Deadline: ${p.proposedDeadline || "N/A"}
- Skills: ${skillsText}
- Proposal Text: ${(p.proposalText || "").substring(0, 300)}...
`;
  });

  return `
You are an EXPERT PROPOSAL EVALUATOR. Rank these proposals based on SKILLS and EXPERIENCE, NOT on price.

CRITICAL RULES:
- A vendor with RELEVANT SKILLS and EXPERIENCE should rank HIGH even if their bid is HIGHER
- A vendor with NO SKILLS or EXPERIENCE should rank LOW even if their bid is VERY LOW
- NEVER rank based on price alone

${taskDetails}

${proposalsText}

Return a JSON object with rankings from BEST to WORST:

{
  "rankings": [
    {
      "proposal_id": "id_here",
      "rank": 1,
      "score": 95,
      "reasoning": "Excellent skills match and proven experience in similar projects"
    }
  ]
}

Only return valid JSON.
`;
};

/**
 * Fallback ranking logic if AI is unavailable
 */
const skillBasedFallbackRanking = (task, proposals, vendorsData) => {
  const taskText = (
    (task.requirements || "") +
    " " +
    (task.description || "")
  ).toLowerCase();

  const commonSkills = [
    "react", "node", "python", "java", "javascript", "html", "css",
    "mongodb", "sql", "mysql", "postgresql", "aws", "azure", "docker",
    "kubernetes", "devops", "frontend", "backend", "fullstack",
    "mobile", "ios", "android", "flutter", "react native",
    "ui/ux", "design", "figma", "photoshop", "illustrator",
    "wordpress", "shopify", "woocommerce", "php", "laravel",
    "vue", "angular", "typescript", "next.js", "express",
    "django", "flask", "spring", "c#", ".net", "go", "rust"
  ];

  const scoredProposals = proposals.map((proposal) => {
    const vendor = proposal.vendorId || {};
    const vendorId = vendor._id ? vendor._id.toString() : String(vendor);
    const vendorInfo = vendorsData[vendorId] || {};

    // 1. SKILLS SCORE (35 points)
    const proposalSkills = (proposal.skills || []).map((s) => s.toLowerCase());
    const matchingSkills = [];
    proposalSkills.forEach((skill) => {
      if (taskText.includes(skill)) {
        matchingSkills.push(skill);
      }
      for (const common of commonSkills) {
        if (skill.includes(common) || common.includes(skill)) {
          if (taskText.includes(common)) {
            matchingSkills.push(skill);
            break;
          }
        }
      }
    });
    const uniqueMatches = [...new Set(matchingSkills)];

    let skillsScore = 5;
    if (uniqueMatches.length >= 4) skillsScore = 35;
    else if (uniqueMatches.length === 3) skillsScore = 30;
    else if (uniqueMatches.length === 2) skillsScore = 25;
    else if (uniqueMatches.length === 1) skillsScore = 15;

    // 2. EXPERIENCE SCORE (30 points)
    const totalProjects = vendorInfo.totalProjects || 0;
    const completedProjects = vendorInfo.completedProjects || 0;
    const onTime = vendorInfo.onTimeCompletion || 0;
    const relevantExp = vendorInfo.relevantExperience || 0;

    let experienceScore = 0;
    if (totalProjects > 0) {
      let expBase = 3;
      if (totalProjects > 20) expBase = 20;
      else if (totalProjects > 10) expBase = 15;
      else if (totalProjects > 5) expBase = 10;
      else if (totalProjects > 2) expBase = 5;

      if (relevantExp > 5) expBase += 7;
      else if (relevantExp > 2) expBase += 5;
      else if (relevantExp > 0) expBase += 3;

      if (onTime > 90) expBase += 3;
      else if (onTime > 75) expBase += 2;

      experienceScore = Math.min(30, expBase);
    }

    // 3. RELIABILITY SCORE (20 points)
    const avgRating = vendorInfo.averageRating || 0;
    let reliabilityScore = 0;
    if (avgRating >= 4.5) reliabilityScore = 20;
    else if (avgRating >= 4.0) reliabilityScore = 15;
    else if (avgRating >= 3.5) reliabilityScore = 10;
    else if (avgRating > 0) reliabilityScore = 5;

    // 4. TIMELINE SCORE (10 points)
    let timelineScore = 2;
    if (onTime > 90) timelineScore = 10;
    else if (onTime > 75) timelineScore = 8;
    else if (onTime > 50) timelineScore = 6;
    else if (totalProjects > 0) timelineScore = 4;

    // 5. BID SCORE (5 points)
    const taskBudget = task.budget || 0;
    const bidAmount = proposal.bidAmount || 0;
    let bidScore = 3;
    if (taskBudget > 0) {
      if (bidAmount < taskBudget * 0.3) bidScore = 1;
      else if (bidAmount <= taskBudget * 1.2) bidScore = 5;
      else if (bidAmount <= taskBudget * 1.5) bidScore = 3;
      else bidScore = 2;
    }

    const totalScore = skillsScore + experienceScore + reliabilityScore + timelineScore + bidScore;

    // Generate reasoning
    let reasoning = "";
    if (skillsScore >= 30 && experienceScore >= 20) {
      reasoning = `EXCELLENT MATCH: Has ${uniqueMatches.length} relevant skills (${uniqueMatches.slice(0, 3).join(", ")}) with ${completedProjects} completed projects. ${onTime}% on-time delivery rate.`;
    } else if (skillsScore >= 20 && experienceScore >= 10) {
      reasoning = `GOOD CANDIDATE: Has relevant skills (${uniqueMatches.slice(0, 2).join(", ")}) and ${completedProjects} projects experience. On-time rate: ${onTime}%.`;
    } else if (skillsScore >= 10) {
      reasoning = `POTENTIAL CANDIDATE: Has some matching skills but limited experience (${completedProjects} projects).`;
    } else {
      reasoning = `RISKY CHOICE: No matching skills found and limited experience. Low bid doesn't guarantee quality.`;
    }

    if (relevantExp > 0) {
      reasoning += ` Has ${relevantExp} relevant projects in this category.`;
    }

    return {
      ...proposal,
      aiScore: totalScore,
      aiReasoning: reasoning,
      aiBreakdown: {
        skills_score: skillsScore,
        experience_score: experienceScore,
        reliability_score: reliabilityScore,
        timeline_score: timelineScore,
        bid_score: bidScore
      }
    };
  });

  scoredProposals.sort((a, b) => b.aiScore - a.aiScore);
  return scoredProposals.map((prop, index) => ({
    ...prop,
    aiRank: index + 1
  }));
};

/**
 * Main function to rank proposals using Gemini AI
 */
const rankProposals = async (task, proposals, vendorsData) => {
  if (!genAI) {
    console.log("[AI Service] Gemini API key not set, using fallback ranking.");
    return skillBasedFallbackRanking(task, proposals, vendorsData);
  }

  try {
    const prompt = createRankingPrompt(task, proposals, vendorsData);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    try {
      let jsonStr = responseText;
      if (responseText.includes("```json")) {
        jsonStr = responseText.split("```json")[1].split("```")[0].trim();
      } else if (responseText.includes("```")) {
        jsonStr = responseText.split("```")[1].split("```")[0].trim();
      } else {
        const startIdx = responseText.indexOf("{");
        const endIdx = responseText.lastIndexOf("}") + 1;
        if (startIdx >= 0 && endIdx > startIdx) {
          jsonStr = responseText.substring(startIdx, endIdx);
        }
      }

      // Cleanup common JSON issues
      jsonStr = jsonStr.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
      
      const rankedData = JSON.parse(jsonStr);
      const proposalMap = {};
      proposals.forEach((p) => {
        proposalMap[p._id.toString()] = p;
      });

      const rankedProposals = [];
      if (rankedData.rankings && Array.isArray(rankedData.rankings)) {
        rankedData.rankings.forEach((item) => {
          const proposalId = item.proposal_id;
          if (proposalMap[proposalId]) {
            rankedProposals.push({
              ...proposalMap[proposalId],
              aiRank: item.rank,
              aiScore: item.score,
              aiReasoning: item.reasoning,
              aiBreakdown: item.breakdown || {}
            });
          }
        });
      }

      // Add any proposals that AI missed (at the end)
      const missedProposals = proposals.filter(p => !rankedProposals.some(rp => rp._id.toString() === p._id.toString()));
      if (missedProposals.length > 0) {
          const lastRank = rankedProposals.length;
          missedProposals.forEach((p, i) => {
              rankedProposals.push({
                  ...p,
                  aiRank: lastRank + i + 1,
                  aiScore: 0,
                  aiReasoning: "Evaluation data incomplete."
              });
          });
      }

      return rankedProposals.sort((a, b) => a.aiRank - b.aiRank);

    } catch (parseError) {
      console.error("[AI Service] Error parsing Gemini response:", parseError.message);
      return skillBasedFallbackRanking(task, proposals, vendorsData);
    }
  } catch (error) {
    console.error("[AI Service] Gemini API error:", error.message);
    return skillBasedFallbackRanking(task, proposals, vendorsData);
  }
};

module.exports = { rankProposals };
