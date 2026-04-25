import React from "react";
import dayjs from "dayjs";
import { 
  FileText as Description, 
  Buildings, 
  Calendar, 
  CurrencyDollar, 
  User,
  Clock,
  CheckCircle,
  XCircle,
  Hash
} from "@phosphor-icons/react";
import { Dialog, Button, DetailField, Badge, Separator, Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../ui";
import StatusChip from "../shared/StatusChip";

const ContractDetailsModal = ({ open, contract, onX }) => {
  if (!open || !contract) return null;

  const SectionHeader = ({ icon: Icon, title }) => (
    <div className="flex items-center gap-2 mb-4 opacity-70">
      <Icon size={14} weight="bold" />
      <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">{title}</h4>
    </div>
  );

  return (
    <Dialog open={open} onX={onX} className="sm:max-w-3xl">
      <Dialog.Header onX={onX} className="border-b-0 px-8 pt-10 pb-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="p-3 rounded-full bg-muted/50 text-foreground text-center">
            <Description size={32} weight="bold" />
          </div>
          <div className="space-y-1.5 w-full text-center">
            <Dialog.Title className="text-xl font-black tracking-tight text-foreground uppercase text-center w-full">
              {contract.title}
            </Dialog.Title>
            <div className="flex items-center justify-center gap-2">
               <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest">{contract.category || "General"}</Badge>
               <StatusChip status={contract.status} size="small" />
            </div>
            <Dialog.Description className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] text-center w-full mt-2">
              Formal Task Agreement
            </Dialog.Description>
          </div>
        </div>
      </Dialog.Header>

      <Dialog.Body className="px-10 pb-10 bg-card space-y-8">
        {/* Financial & Timeline Section */}
        <section>
          <SectionHeader icon={CurrencyDollar} title="Financial & Timeline" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center sm:text-left">
            <DetailField 
              label="Total Budget" 
              labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 justify-center sm:justify-start" 
              valueClassName="text-lg font-bold text-foreground"
            >
              ${contract.totalBudget?.toLocaleString()}
            </DetailField>
            <DetailField 
              label="Start Date" 
              labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 justify-center sm:justify-start" 
              valueClassName="text-sm font-bold text-foreground"
            >
              {dayjs(contract.projectStartDate).format("MMM DD, YYYY")}
            </DetailField>
            <DetailField 
              label="End Date" 
              labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 justify-center sm:justify-start" 
              valueClassName="text-sm font-bold text-foreground"
            >
              {dayjs(contract.projectEndDate).format("MMM DD, YYYY")}
            </DetailField>
          </div>
        </section>

        {/* Involved Parties Section */}
        <section className="pt-8 border-t border-border/50">
          <SectionHeader icon={User} title="Involved Parties" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 text-center sm:text-left">
            <DetailField 
              label="Company" 
              labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 justify-center sm:justify-start" 
              valueClassName="text-sm font-bold text-foreground"
            >
              {contract.companyId?.companyName || contract.companyId?.username || "N/A"}
            </DetailField>
            <DetailField 
              label="Vendor" 
              labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 justify-center sm:justify-start" 
              valueClassName="text-sm font-bold text-foreground"
            >
              {contract.vendorId?.username || contract.vendorId?.email || "N/A"}
            </DetailField>
          </div>
        </section>

        {/* Milestones Section */}
        <section className="pt-8 border-t border-border/50">
          <SectionHeader icon={Clock} title="Milestones & Delivery" />
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="border-b-border/50 hover:bg-transparent">
                        <TableHead className="text-[10px] font-black uppercase tracking-tight h-10">Milestone</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-tight h-10 text-right">Amount</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-tight h-10 text-right pr-6">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {contract.milestones?.length > 0 ? (
                        contract.milestones.map((m, i) => (
                            <TableRow key={i} className="border-b-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                                <TableCell className="py-3">
                                    <p className="text-[11px] font-bold text-foreground">{m.title}</p>
                                    <p className="text-[10px] text-muted-foreground">{dayjs(m.deadline).format("MMM DD")}</p>
                                </TableCell>
                                <TableCell className="text-right text-[11px] font-bold text-foreground py-3">
                                    ${m.amount?.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right pr-6 py-3">
                                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter py-0.5 border-border/50 bg-background/50">
                                        {m.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={3} className="h-20 text-center text-xs text-muted-foreground opacity-50">No milestones defined</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
          </div>
        </section>

        {/* Narrative & Details */}
        <section className="pt-8 border-t border-border/50">
          <SectionHeader icon={FileText} title="Narrative & Scope" />
          <div className="space-y-6">
            <DetailField 
              label="Scope Description" 
              colSpan={2} 
              labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 justify-center sm:justify-start" 
              valueClassName="text-xs font-medium leading-relaxed text-foreground bg-muted/30 p-4 rounded-xl border border-border/50"
            >
              {contract.description || "No description provided."}
            </DetailField>
          </div>
        </section>

        <div className="flex justify-center pt-4">
          <Button 
            variant="secondary" 
            onClick={onX} 
            className="w-full font-bold uppercase tracking-tight text-[11px] h-12 rounded-xl"
          >
            Close
          </Button>
        </div>
      </Dialog.Body>
    </Dialog>
  );
};

export default ContractDetailsModal;
