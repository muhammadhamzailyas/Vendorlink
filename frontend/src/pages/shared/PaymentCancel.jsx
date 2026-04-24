import React from "react";
import { useNavigate } from "react-router-dom";
import { XCircle } from "@phosphor-icons/react";
import { Button, Card, PageTransition } from "@/components/ui";

const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl space-y-8 py-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Cancelled</h1>
          <p className="text-muted-foreground">
            No funds were deducted. You can retry payment from your dashboard.
          </p>
        </div>

        <Card>
          <Card.Content className="py-10 text-center">
            <XCircle className="mx-auto mb-4 h-16 w-16 text-danger" />
            <p className="mx-auto max-w-lg text-sm leading-6 text-muted-foreground">
              This transaction was cancelled before completion. Review payment details and retry when ready.
            </p>
          </Card.Content>
          <Card.Footer className="justify-center">
            <Button onClick={() => navigate(-1)} className="w-full sm:w-auto">
              Return
            </Button>
          </Card.Footer>
        </Card>
      </div>
    </PageTransition>
  );
};

export default PaymentCancel;



