import React from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "@phosphor-icons/react";
import { Button, Card, PageTransition } from "@/components/ui";

const PaymentSuccess = () => {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl space-y-8 py-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Successful</h1>
          <p className="text-muted-foreground">
            Your transaction has been recorded and wallet balances will update shortly.
          </p>
        </div>

        <Card>
          <Card.Content className="py-10 text-center">
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-success" />
            <p className="mx-auto max-w-lg text-sm leading-6 text-muted-foreground">
              The payment completed successfully. You can return to your payment dashboard to view updated transaction history and balance details.
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

export default PaymentSuccess;



