import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Download,
  CreditCard,
  Buildings,
  User,
  Receipt,
  CheckCircle,
  Clock,
  Calendar,
  Hash,
  Info
} from "@phosphor-icons/react";
import { paymentAPI } from "@/services/paymentAPI";
import { showToast } from "@/lib/toast";
import { Button, Card, PageTransition, Skeleton, EmptyState, Separator, Badge } from "@/components/ui";
import StatusChip from "@/components/shared/StatusChip";
import dayjs from "dayjs";

const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: payment, isLoading } = useQuery({
    queryKey: ["admin", "payment", id],
    queryFn: async () => {
      const res = await paymentAPI.getPaymentById(id);
      return res?.data?.data || res?.data;
    },
    onError: () => showToast("error", "Failed to load payment details"),
  });

  const handleDownloadInvoice = async () => {
    try {
      await paymentAPI.downloadInvoice(id);
    } catch {
      showToast("error", "Failed to download invoice");
    }
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-8">
            <Skeleton className="h-12 w-1/3 rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-64 rounded-xl" />
                <div className="space-y-6">
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-32 rounded-xl" />
                </div>
            </div>
        </div>
      </PageTransition>
    );
  }

  if (!payment) {
    return (
      <PageTransition>
        <div className="space-y-8">
          <EmptyState
            icon={CreditCard}
            title="Transaction not found"
            description="The payment record you are looking for may have been archived or does not exist."
            action={
              <Button variant="secondary" onClick={() => navigate("/admin/payments")} className="font-bold uppercase tracking-tight">
                Back to Registry
              </Button>
            }
          />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
    <div className="space-y-8 pb-12">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/admin">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/admin/payments">Payments</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{payment.invoiceNumber || "Payment Detail"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="secondary"
            size="xs"
            onClick={() => navigate("/admin/payments")}
            className="font-bold uppercase tracking-tight shrink-0"
          >
            
            Back
          </Button>
          <div className="min-w-0">
            <h2 className="text-2xl font-bold tracking-tight text-foreground uppercase truncate">Payment Context</h2>
            <p className="font-bold text-[11px] text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                <Hash size={12} className="text-foreground" />
                {payment.invoiceNumber || "PROVISIONAL"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <StatusChip status={payment.status} />
          {payment.invoiceNumber && (
            <Button variant="outline" size="xs" onClick={handleDownloadInvoice} className="font-semibold uppercase tracking-tight bg-card shadow-soft">
              
              Download PDF
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Payment Info */}
        <Card className="lg:col-span-2 shadow-soft border-border/50 overflow-hidden">
          <Card.Header className="pb-4 border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-foreground" />
                <Card.Title className="text-sm font-bold uppercase tracking-tight">Financial Breakdown</Card.Title>
            </div>
          </Card.Header>
          <Card.Content className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                <div className="p-5 rounded-xl bg-muted/20 border border-border/30">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/60 mb-1.5">Gross Amount</p>
                    <p className="text-2xl font-extrabold text-foreground tracking-tighter uppercase">${payment.amount?.toLocaleString()}</p>
                </div>
                <div className="p-5 rounded-xl bg-muted/20 border border-border/30">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/60 mb-1.5">Platform Revenue</p>
                    <p className="text-2xl font-extrabold text-foreground tracking-tighter uppercase">${payment.platformFee?.toLocaleString()}</p>
                </div>
                <div className="p-5 rounded-xl bg-jade-400/10 border border-jade-600/20">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-jade-600/60 mb-1.5">Net Payout</p>
                    <p className="text-2xl font-extrabold text-jade-600 tracking-tighter uppercase">${payment.vendorAmount?.toLocaleString()}</p>
                </div>
            </div>

            <div className="space-y-4 max-w-xl">
                <div className="flex items-center justify-between py-2 border-b border-border/30">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-tight flex items-center gap-2">
                        <Info size={14} className="opacity-40" />
                        Transaction Type
                    </span>
                    <Badge variant="outline" className="font-bold uppercase tracking-tighter text-[10px] bg-muted/30">
                        {payment.paymentType?.replace("_", " ")}
                    </Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/30">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-tight flex items-center gap-2">
                        <CreditCard size={14} className="opacity-40" />
                        Settlement Method
                    </span>
                    <span className="text-xs font-extrabold text-foreground uppercase tracking-tight">{payment.paymentMethod?.replace("_", " ") || "UNSPECIFIED"}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/30">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-tight flex items-center gap-2">
                        <Calendar size={14} className="opacity-40" />
                        Initiated At
                    </span>
                    <span className="text-xs font-extrabold text-foreground uppercase tracking-tight">{dayjs(payment.createdAt).format("MMM D, YYYY h:mm A")}</span>
                </div>
                {payment.completedAt && (
                    <div className="flex items-center justify-between py-2 border-b border-border/30 bg-jade-400/5 px-2 -mx-2 rounded-lg">
                        <span className="text-xs font-bold text-jade-600 uppercase tracking-tight flex items-center gap-2">
                            <CheckCircle size={14} />
                            Completed At
                        </span>
                        <span className="text-xs font-extrabold text-jade-600 uppercase tracking-tight">{dayjs(payment.completedAt).format("MMM D, YYYY h:mm A")}</span>
                    </div>
                )}
                <div className="flex items-center justify-between py-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-tight flex items-center gap-2">
                        <ShieldCheck size={14} className="opacity-40" />
                        Vendor Acknowledged
                    </span>
                    {payment.vendorConfirmed ? (
                        <Badge variant="success" className="font-bold uppercase tracking-tighter text-[9px] px-2 py-0.5">VERIFIED</Badge>
                    ) : (
                        <Badge variant="warning" className="font-bold uppercase tracking-tighter text-[9px] px-2 py-0.5">PENDING</Badge>
                    )}
                </div>
            </div>
          </Card.Content>
        </Card>

        {/* Parties */}
        <div className="space-y-6">
          <Card className="shadow-soft border-border/50">
            <Card.Header className="pb-3 border-b border-border/50 bg-muted/20 px-5 py-4">
              <div className="flex items-center gap-2">
                <Buildings className="h-4 w-4 text-foreground" />
                <Card.Title className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">Company (Origin)</Card.Title>
              </div>
            </Card.Header>
            <Card.Content className="p-5 space-y-4">
                <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-tighter text-muted-foreground/60 mb-0.5">Name</p>
                    <p className="text-sm font-bold text-foreground truncate">{payment.company?.companyName || payment.company?.fullName || payment.company?.email || "—"}</p>
                </div>
                <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-tighter text-muted-foreground/60 mb-0.5">Identifier (Email)</p>
                    <p className="text-sm font-bold text-foreground truncate">{payment.company?.email || "—"}</p>
                </div>
            </Card.Content>
          </Card>

          <Card className="shadow-soft border-border/50">
            <Card.Header className="pb-3 border-b border-border/50 bg-muted/20 px-5 py-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-foreground" />
                <Card.Title className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">Vendor (Destination)</Card.Title>
              </div>
            </Card.Header>
            <Card.Content className="p-5 space-y-4">
                <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-tighter text-muted-foreground/60 mb-0.5">Business Name</p>
                    <p className="text-sm font-bold text-foreground truncate">{payment.vendor?.businessName || payment.vendor?.fullName || payment.vendor?.email || "—"}</p>
                </div>
                <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-tighter text-muted-foreground/60 mb-0.5">Identifier (Email)</p>
                    <p className="text-sm font-bold text-foreground truncate">{payment.vendor?.email || "—"}</p>
                </div>
            </Card.Content>
          </Card>

          {/* Notes */}
          {payment.notes && (
            <Card className="border-warning/20 bg-warning/5 shadow-none">
                <Card.Content className="p-4">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-warning/70 mb-2">Audit Notes</p>
                    <p className="text-[13px] font-medium leading-relaxed text-foreground/80 italic">{payment.notes}</p>
                </Card.Content>
            </Card>
          )}
        </div>
      </div>
    </div>
    </PageTransition>
  );
};

export default PaymentDetail;






