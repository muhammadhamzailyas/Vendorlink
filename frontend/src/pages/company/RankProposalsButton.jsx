import React, { useState } from "react";
import { Sparkle, CircleNotch, ChartBar } from "@phosphor-icons/react";
import { aiRankingAPI } from "../../services/aiRankingAPI";
import { showToast } from "../../lib/toast";
import { Button, Card, Progress } from "../../components/ui";

const RankProposalsButton = ({ taskId, onRankingComplete, disabled }) => {
  const [ranking, setRanking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState("");

  const steps = [
    "Analyzing task requirements...",
    "Evaluating vendor skills...",
    "Checking vendor history...",
    "Calculating scores...",
    "Generating rankings...",
  ];

  const handleRank = async () => {
    if (disabled) return;
    setRanking(true);
    setProgress(0);

    // Simulate progress steps
    for (let i = 0; i < steps.length; i++) {
      setStep(steps[i]);
      setProgress(((i + 1) / steps.length) * 80);
      await new Promise((r) => setTimeout(r, 600));
    }

    try {
      const response = await aiRankingAPI.rankProposals(taskId);
      setProgress(100);
      setStep("Ranking complete!");

      const ranked = response?.data?.ranked_proposals || [];
      if (ranked.length > 0) {
        showToast("success", `Ranked ${ranked.length} proposals successfully`);
        if (onRankingComplete) onRankingComplete(ranked);
      } else {
        showToast("warning", "No proposals could be ranked");
      }
    } catch (error) {
      showToast("error", error.response?.data?.error || "Failed to rank proposals");
    } finally {
      setTimeout(() => {
        setRanking(false);
        setProgress(0);
        setStep("");
      }, 1500);
    }
  };

  if (ranking) {
    return (
      <Card className="border-ring/20 bg-muted/30 p-4">
        <div className="mb-3 flex items-center gap-2">
          <CircleNotch className="h-4 w-4 animate-spin text-foreground" />
          <span className="text-sm font-semibold text-foreground">AI Ranking in Progress</span>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">{step}</p>
        <Progress value={progress} className="h-2" />
        <p className="mt-1 text-right text-xs text-muted-foreground">{Math.round(progress)}%</p>
      </Card>
    );
  }

  return (
    <Button
      onClick={handleRank}
      disabled={disabled}
      title={disabled ? "Need at least 2 proposals to rank them" : "Use AI to rank proposals based on task requirements"}
     
    >
      AI Rank Proposals
    </Button>
  );
};

export default RankProposalsButton;



