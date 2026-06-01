import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { PageTransition, Card, DataTable, Loader, EmptyState, Button, Textarea, Skeleton } from "@/components/ui";
import { ChatTeardropText } from "@phosphor-icons/react";
import { useForm } from "react-hook-form";
import { showToast } from "@/lib/toast";
import { useUser } from "@/context/UserContext";

const FeedbackPage = () => {
  const { user } = useUser();
  const isAdmin = user?.role === 'admin';

  const { data: feedback, isLoading } = useQuery({
    queryKey: ["admin", "feedback"],
    queryFn: async () => {
      const res = await api.get("/feedback");
      return res.data?.data || [];
    },
    enabled: !!isAdmin,
  });

  const { register, handleSubmit, reset } = useForm();
  
  const onSubmit = async (data) => {
    try {
      await api.post("/feedback", data);
      showToast("Feedback submitted successfully", "success");
      reset();
    } catch (err) {
      showToast("Failed to submit feedback", "error");
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <h1 className="text-2xl font-black uppercase tracking-tight">Feedback Center</h1>
        
        <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">Submit Feedback</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Textarea {...register("message", { required: true })} placeholder="Describe your experience or suggest an improvement..." rows={4} />
                <Button type="submit">Send to Admin</Button>
            </form>
        </Card>

        {isAdmin && (
            isLoading ? (
                <div className="space-y-3 pt-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-xl" />
                  ))}
                </div>
            ) : feedback?.length === 0 ? (
              <EmptyState icon={ChatTeardropText} title="No feedback yet" description="All user feedback will appear here." />
            ) : (
              <Card className="shadow-soft border-border/50">
                <DataTable
                  data={feedback}
                  columns={[
                    { 
                      key: "userId.fullName", 
                      label: "User",
                      render: (f) => f.userId?.fullName || f.userId?.email || "N/A"
                    },
                    { key: "userId.email", label: "Email" },
                    { key: "message", label: "Feedback" },
                    { key: "createdAt", label: "Date", render: (f) => new Date(f.createdAt).toLocaleDateString() },
                  ]}
                />
              </Card>
            )
        )}
      </div>
    </PageTransition>
  );
};

export default FeedbackPage;
