import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { contractAPI } from "@/services/api";
import { useUser } from "@/context/UserContext";
import { formatDate } from "@/lib/dateUtils";
import StatusChip from "@/components/shared/StatusChip";
import { 
  FileText, 
  CheckCircle, 
  ClipboardText as Assignment, 
  CurrencyDollar as AttachMoney,
  DotsThreeVertical,
  Eye as Visibility,
  PencilSimple,
  Trash,
  CaretUp,
  CaretDown,
  TrendUp
} from "@phosphor-icons/react";
import {
  Button,
  EmptyState,
  PageTransition,
  DataTable,
  StatCard,
  Loader,
  Skeleton,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui";
import FilterSearchBar from "@/components/shared/FilterSearchBar";
import { cn } from "@/lib/cn";
import toastUtil from "@/lib/toast";
import ContractDetailsModal from "@/components/admin/ContractDetailsModal";
import ContractEditModal from "./ContractEditModal";

const CompanyContracts = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Modal states
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);

  // Deletion states
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [deletabilityInfo, setDeletabilityInfo] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadContracts();
  }, [filter]);

  const loadContracts = async () => {
    setLoading(true);
    try {
      const res = await contractAPI.getCompanyContracts(filter !== "all" ? filter : undefined);
      setContracts(res.data?.data || res.data || []);
    } catch (error) {
      toastUtil.handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeleteDialog = async (contract) => {
    try {
      setSelectedContract(contract);
      const res = await contractAPI.checkDeletability(contract._id);
      setDeletabilityInfo(res.data);
      setDeleteAlertOpen(true);
    } catch (error) {
      toastUtil.handleApiError(error);
    }
  };

  const confirmDelete = async () => {
    if (!selectedContract || !deletabilityInfo?.canDelete) return;
    setIsDeleting(true);
    try {
      await contractAPI.deleteContract(selectedContract._id);
      toastUtil.success("Contract deleted successfully");
      setContracts(prev => prev.filter(c => c._id !== selectedContract._id));
      setDeleteAlertOpen(false);
    } catch (error) {
      toastUtil.handleApiError(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    return contracts.filter((contract) => {
      const matchesSearch =
        (contract.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (contract.vendorId?.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
        (contract.vendorId?.email || "").toLowerCase().includes(search.toLowerCase());

      return matchesSearch;
    });
  }, [contracts, search]);

  const stats = useMemo(() => {
    const active = contracts.filter((contract) => ["active", "pending-vendor"].includes(contract.status)).length;
    const completed = contracts.filter((contract) => contract.status === "completed").length;
    const totalBudget = contracts.reduce((sum, contract) => sum + (contract.totalBudget || 0), 0);
    return {
      total: contracts.length,
      active,
      completed,
      totalBudget,
    };
  }, [contracts]);

  const ChangeIndicator = ({ value }) => {
    const val = parseFloat(value || 0);
    const isPositive = val > 0;
    const isNegative = val < 0;
    const colorClass = isPositive ? "bg-success/20 text-success border-success/30" : isNegative ? "bg-error/20 text-error border-error/30" : "bg-muted text-muted-foreground border-border";

    return (
        <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xl border mt-1", colorClass)}>
            <div className="flex items-center gap-0.5">
                {isPositive && <CaretUp size={10} weight="bold" />}
                {isNegative && <CaretDown size={10} weight="bold" />}
                <span className="text-[10px] font-black uppercase tracking-tight">{Math.abs(val)}%</span>
            </div>
        </div>
    );
  };

  const statusTabs = ["all", "draft", "pending-vendor", "pending-company", "active", "completed", "cancelled", "rejected"];

  const contractColumns = [
    {
      key: "title",
      label: "Contract Agreement",
      cellClassName: "px-6 py-4",
      render: (contract) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground uppercase tracking-tight">{contract.title || "Untitled Contract"}</p>
          <p className="mt-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            ID: #{contract._id?.slice(-6).toUpperCase()}
          </p>
        </div>
      ),
    },
    {
      key: "vendor",
      label: "Vendor",
      cellClassName: "px-6 py-4 text-sm text-foreground/80",
      render: (contract) => (
          <div className="flex items-center gap-2">
              <span className="font-bold text-foreground/90 underline decoration-border decoration-dotted underline-offset-4 cursor-help">
                {contract.vendorId?.fullName || contract.vendorId?.email || "N/A"}
              </span>
          </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      cellClassName: "px-6 py-4",
      render: (contract) => <StatusChip status={contract.status} size="small" />,
    },
    {
      key: "budget",
      label: "Budget",
      cellClassName: "px-6 py-4 text-sm text-foreground font-black",
      render: (contract) => (contract.totalBudget ? `$${contract.totalBudget.toLocaleString()}` : "-"),
    },
    {
      key: "actions",
      label: "Actions",
      cellClassName: "px-6 py-4 text-right",
      render: (contract) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <DotsThreeVertical size={20} weight="bold" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => {
              setSelectedContract(contract);
              setDetailsModalOpen(true);
            }}>
              <Visibility className="mr-2 h-4 w-4" />
              View Contract
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => {
              setSelectedContract(contract);
              setEditModalOpen(true);
            }}>
              <PencilSimple className="mr-2 h-4 w-4" />
              Edit Contract
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem 
                onClick={() => handleOpenDeleteDialog(contract)}
                className="text-error focus:text-error"
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete Contract
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const tabOptions = useMemo(() => {
    return statusTabs.map(s => ({
        label: s.replace(/-/g, " "),
        count: contracts.filter(c => s === 'all' ? true : c.status === s).length
    }));
  }, [contracts]);

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Agreements" value={stats.total} icon={<FileText />} trend={<ChangeIndicator value={2.1} />} />
          <StatCard title="Active Projects" value={stats.active} icon={<Assignment />} trend={<ChangeIndicator value={5.4} />} />
          <StatCard title="Completions" value={stats.completed} icon={<CheckCircle />} trend={<ChangeIndicator value={12.0} />} />
          <StatCard title="Total Value" value={`$${stats.totalBudget.toLocaleString()}`} icon={<AttachMoney />} trend={<ChangeIndicator value={8.7} />} />
        </div>

        <FilterSearchBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search agreements by task or client..."
          activeTab={statusTabs.indexOf(filter)}
          onTabChange={(index) => setFilter(statusTabs[index] || "all")}
          tabs={tabOptions.map(t => `${t.label} (${t.count})`)}
          className="mb-0"
        />
        {loading ? (
          <div className="space-y-3 pt-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No contracts found"
            description={search ? "Try adjusting your search criteria" : "Your active agreements will appear here."}
            className="border-0 bg-transparent py-12"
          />
        ) : (
          <div className="pt-6">
            <DataTable
                columns={contractColumns}
                data={filtered}
                rowKey="_id"
                showSectionHeader={false}
                showTableHeader={true}
                tableClassName="w-full min-w-[900px]"
            />
          </div>
        )}

        <ContractDetailsModal
            open={detailsModalOpen}
            contract={selectedContract}
            onX={() => setDetailsModalOpen(false)}
            onSuccess={loadContracts}
        />

        <ContractEditModal
            open={editModalOpen}
            contract={selectedContract}
            onX={() => setEditModalOpen(false)}
            onSuccess={loadContracts}
        />

        <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {deletabilityInfo?.message || "Delete Contract"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {deletabilityInfo?.warning || "Are you sure you want to delete this contract? This action cannot be undone."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                {deletabilityInfo?.canDelete ? "Cancel" : "Close"}
              </AlertDialogCancel>
              {deletabilityInfo?.canDelete && (
                <Button
                  variant={deletabilityInfo?.level === 2 ? "destructive" : "default"}
                  onClick={confirmDelete}
                  loading={isDeleting}
                  className="font-semibold uppercase tracking-tight text-[11px]"
                >
                  Yes, Delete
                </Button>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTransition>
  );
};

export default CompanyContracts;

