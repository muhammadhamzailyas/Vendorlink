import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { PageTransition, Card, DataTable, Loader, EmptyState, Skeleton } from "@/components/ui";
import { ChatTeardropText } from "@phosphor-icons/react";

const FeedbackPage = () => {
  const { data: feedback, isLoading } = useQuery({
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
                { key: "userId.username", label: "Name" },
                { key: "userId.email", label: "Email" },
                { key: "message", label: "Feedback" },
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