import React from "react";
import { 
  Sparkle, 
  X as CloseIcon, 
  CheckCircle,
  WarningCircle,
  Trophy,
  ChartBar,
  User,
  Star
} from "@phosphor-icons/react";
import { 
  Dialog, 
  Button, 
  Badge,
  Card
} from "@/components/ui";
import { cn } from "@/lib/cn";

const AIRankingExplanationModal = ({ open, onX, rankedData }) => {
  if (!open || !rankedData || rankedData.length === 0) return null;

  const topChoice = rankedData[0];

  return (
    <Dialog open={open} onX={onX} className="sm:max-w-4xl" aria-describedby="ai-ranking-description">
      <Dialog.Header className="border-b-0 px-8 pt-10 pb-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="p-4 rounded-xl bg-primary/10 text-primary animate-pulse">
            <Sparkle size={40} weight="fill" />
          </div>
          <div className="space-y-2">
            <Dialog.Title className="text-2xl font-black tracking-tighter text-foreground uppercase leading-tight">
                AI Selection Intelligence
            </Dialog.Title>
            <Dialog.Description id="ai-ranking-description" className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Automated analysis of vendor skills, experience, and project fit.
            </Dialog.Description>
          </div>
        </div>
      </Dialog.Header>

      <Dialog.Body className="px-8 pb-10 max-h-[60vh] overflow-y-auto space-y-8">
        {/* Top Choice Highlight */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-primary/30 bg-primary/5 p-8 shadow-lg shadow-primary/5">
            <div className="absolute -right-6 -top-6 rotate-12 opacity-10">
                <Trophy size={120} weight="fill" />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-4">
                    <Badge className="bg-primary text-primary-foreground font-black px-3 py-1 uppercase tracking-widest text-[9px]">
                        Primary Recommendation
                    </Badge>
                    <div>
                        <h3 className="text-3xl font-black text-foreground uppercase tracking-tight">
                            {topChoice.vendorId?.companyName || topChoice.vendorId?.fullName || topChoice.vendorId?.email}
                        </h3>
                        <p className="text-sm font-bold text-primary flex items-center gap-2 mt-1">
                            <Star weight="fill" /> Match Score: {topChoice.aiScore}%
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Proposal Bid</p>
                        <p className="text-xl font-black text-foreground">${topChoice.bidAmount?.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-primary/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                    <ChartBar size={14} /> AI Reasoning & Insights
                </p>
                <p className="text-sm font-medium leading-relaxed text-foreground/80 italic">
                    "{topChoice.aiReasoning}"
                </p>
            </div>
        </div>

        {/* Other Rankings */}
        {rankedData.length > 1 && (
            <div className="space-y-4">
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">
                    Secondary Options
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rankedData.slice(1).map((proposal, idx) => (
                        <Card key={idx} className="border-border/60 bg-muted/20 p-5 rounded-xl hover:border-border transition-colors">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-xs font-black">
                                        #{idx + 2}
                                    </div>
                                    <p className="text-sm font-black text-foreground uppercase tracking-tight truncate max-w-[140px]">
                                        {proposal.vendorId?.companyName || proposal.vendorId?.fullName || proposal.vendorId?.email}
                                    </p>
                                </div>
                                <Badge variant="outline" className="text-[9px] font-bold border-border/40">
                                    Score: {proposal.aiScore}%
                                </Badge>
                            </div>
                            <p className="text-[11px] font-medium text-muted-foreground line-clamp-3 leading-relaxed">
                                {proposal.aiReasoning}
                            </p>
                        </Card>
                    ))}
                </div>
            </div>
        )}
      </Dialog.Body>

      <div className="grid-cols-1 grid px-8 py-8 border-t border-border/50 bg-muted/20">
          <Button
            type="button"
            variant="secondary"
            onClick={onX}
            className="font-semibold uppercase tracking-widest text-[10px] h-12 w-full max-w-xs rounded-xl shadow-sm"
          >
            I understand these insights
          </Button></div>
    </Dialog>
  );
};

export default AIRankingExplanationModal;

