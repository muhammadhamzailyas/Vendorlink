import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { PageTransition, Card, DataTable, Loader, EmptyState, Skeleton } from "@/components/ui";
import { ChatTeardropText } from "@phosphor-icons/react";

import { usePageMeta } from "@/hooks/usePageMeta";

const FeedbackPage = () => {
  usePageMeta("Feedback", "Review user feedback and system ratings");
  const { data: feedback = [], isLoading } = useQuery({
    queryKey: ["admin", "feedback"],
    queryFn: async () => {
      const res = await api.get("/feedback");
      return res.data?.data || [];
    },
  });

  return (
    <PageTransition>
      <div className="space-y-6">
        <h1 className="text-2xl font-black uppercase tracking-tight">User Feedback</h1>
        {isLoading ? (
          <div className="space-y-3 pt-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : feedback.length === 0 ? (
          <EmptyState icon={ChatTeardropText} title="No feedback yet" description="All user feedback will appear here." />
        ) : (
          <Card className="shadow-soft border-border/50">
            <DataTable
              data={feedback}
              columns={[
                { 
                  key: "user", 
                  label: "User",
                  render: (f) => (
                    <div>
                      <p className="text-sm font-bold text-foreground">{f.userId?.fullName || "N/A"}</p>
                      <p className="text-xs text-muted-foreground">{f.userId?.email || ""}</p>
                    </div>
                  )
                },
                { key: "message", label: "Feedback", cellClassName: "text-sm text-foreground/80" },
                { key: "createdAt", label: "Date", render: (f) => new Date(f.createdAt).toLocaleDateString() },
              ]}
            />
          </Card>
        )}
      </div>
    </PageTransition>
  );
};

export default FeedbackPage;
