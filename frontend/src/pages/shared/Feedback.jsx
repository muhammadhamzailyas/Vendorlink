import React from "react";
import { ChatCircleText } from "@phosphor-icons/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toastUtil from "@/lib/toast";
import { PageTransition, Button, Input, Textarea } from "@/components/ui";
import FormSection, { FormActionRow } from "@/components/shared/FormSection";

const schema = z.object({
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
});

const Feedback = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      subject: "",
      message: "",
    },
  });

  const onSubmit = async () => {
    // Placeholder submit until backend feedback endpoint is added.
    toastUtil.success("Thanks for your feedback. We received it.");
    reset();
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground uppercase">Share Feedback</h2>
          <p className="text-sm text-muted-foreground">Tell us about product issues, ideas, or requests so we can improve VendorLink.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormSection
            title="Feedback Details"
            description="Use this form to send product feedback to the VendorLink team."
            footer={(
              <FormActionRow>
                <Button
                  type="submit"
                  loading={isSubmitting}
                  className="w-full sm:w-auto font-bold uppercase tracking-tight"
                >
                  <ChatCircleText className="h-4 w-4 mr-2" />
                  Send Feedback
                </Button>
              </FormActionRow>
            )}
          >
            <div className="space-y-4">
              <Input
                label="Subject"
                placeholder="What is this about?"
                error={errors.subject?.message}
                {...register("subject")}
              />

              <Textarea
                label="Message"
                rows={6}
                placeholder="Write your feedback here..."
                error={errors.message?.message}
                {...register("message")}
              />
            </div>
          </FormSection>
        </form>
      </div>
    </PageTransition>
  );
};

export default Feedback;



