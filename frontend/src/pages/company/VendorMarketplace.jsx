import React, { useEffect, useMemo, useState } from "react";
import { Storefront as Storefront, CheckCircle as CheckCircle, Users as People, CurrencyDollar as AttachMoney, Envelope, Tag, ArrowRight } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import FilterSearchBar from "@/components/shared/FilterSearchBar";
import { StatCard, Button, Card, EmptyState, PageTransition, Skeleton, Badge, Separator } from "@/components/ui";
import { proposalAPI } from "@/services/api";

const VendorCardSkeleton = () => (
  <Card className="overflow-hidden rounded-2xl border-[var(--border)]/50 shadow-soft">
    <Card.Content className="space-y-4 p-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Separator className="opacity-50" />
      <div className="space-y-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
    </Card.Content>
  </Card>
);

const VendorCard = ({ vendor, onOpenProposals }) => {
  const avgBid = Math.round(vendor.totalBid / vendor.totalProposals || 0);

  return (
    <Card className="overflow-hidden rounded-2xl border-[var(--border)]/50 bg-[var(--card)] shadow-soft transition-all duration-300 hover:shadow-md hover:border-[var(--ring)]/20 group">
      <Card.Content className="p-6">
        <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--muted)]/40 text-[var(--foreground)] font-bold text-lg shadow-xs">
                    {(vendor.username || "V")[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-tight truncate group-hover:text-[var(--foreground)] transition-colors">{vendor.username || "Vendor"}</h3>
                    <p className="truncate text-xs font-medium text-[var(--muted-foreground)] flex items-center gap-1.5">
                        <Envelope size={10} className="opacity-50" />
                        {vendor.email || "No email"}
                    </p>
                </div>
            </div>
            <Badge variant="outline" className="font-bold uppercase tracking-tighter text-[9px] bg-[var(--muted)]/30">
                {vendor.vendorType || "General"}
            </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-3 rounded-xl bg-[var(--muted)]/20 border border-[var(--border)]/30">
                <p className="text-[9px] font-extrabold uppercase tracking-tighter text-[var(--muted-foreground)]/60 mb-1">Total Bids</p>
                <p className="text-sm font-bold text-[var(--foreground)]">{vendor.totalProposals}</p>
            </div>
            <div className="p-3 rounded-xl bg-[var(--muted)]/20 border border-[var(--border)]/30">
                <p className="text-[9px] font-extrabold uppercase tracking-tighter text-[var(--muted-foreground)]/60 mb-1">Success Rate</p>
                <p className="text-sm font-bold text-[var(--foreground)]">{vendor.acceptedProposals > 0 ? Math.round((vendor.acceptedProposals / vendor.totalProposals) * 100) : 0}%</p>
            </div>
        </div>

        <div className="space-y-2 mb-8">
            <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[var(--muted-foreground)] uppercase tracking-tight flex items-center gap-1.5">
                    <AttachMoney size={12} />
                    Avg. Bid Value
                </span>
                <span className="font-extrabold text-[var(--foreground)]">PKR {avgBid.toLocaleString()}</span>
            </div>
            <Separator className="opacity-30" />
            <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[var(--muted-foreground)] uppercase tracking-tight">Active Contracts</span>
                <span className="font-extrabold text-jade-600">{vendor.acceptedProposals}</span>
            </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full font-bold uppercase tracking-tight shadow-soft rounded-xl"
          onClick={onOpenProposals}
        >
          Analyze Proposals
          <ArrowRight className="ml-2 h-3.5 w-3.5 opacity-40 group-hover:translate-x-1 transition-transform" />
        </Button>
      </Card.Content>
    </Card>
  );
};

const VendorMarketplace = () => {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setMagnifyingGlass] = useState("");
  const [tab, setTab] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await proposalAPI.getCompanyProposals();
      setProposals(res.data || []);
    } catch (error) {
      console.error("Vendor marketplace load error:", error);
      setProposals([]);
    } finally {
      setLoading(false);
    }
  };

  const vendors = useMemo(() => {
    const map = new Map();

    proposals.forEach((proposal) => {
      const vendor = proposal.vendorId;
      if (!vendor?._id) return;

      const existing = map.get(vendor._id) || {
        ...vendor,
        totalProposals: 0,
        acceptedProposals: 0,
        totalBid: 0,
      };

      existing.totalProposals += 1;
      existing.totalBid += proposal.bidAmount || 0;
      if (proposal.status === "accepted") {
        existing.acceptedProposals += 1;
      }

      map.set(vendor._id, existing);
    });

    return Array.from(map.values()).sort(
      (a, b) =>
        b.acceptedProposals - a.acceptedProposals ||
        b.totalProposals - a.totalProposals
    );
  }, [proposals]);

  const filteredVendors = useMemo(() => {
    return vendors.filter((vendor) => {
      const matchesSearch =
        vendor.username?.toLowerCase().includes(search.toLowerCase()) ||
        vendor.email?.toLowerCase().includes(search.toLowerCase()) ||
        vendor.vendorType?.toLowerCase().includes(search.toLowerCase());

      if (tab === 0) return matchesSearch;
      if (tab === 1) return matchesSearch && vendor.acceptedProposals > 0;
      return matchesSearch && vendor.acceptedProposals === 0;
    });
  }, [vendors, search, tab]);

  const stats = useMemo(() => {
    const active = vendors.filter((v) => v.acceptedProposals > 0).length;
    const totalBid = vendors.reduce((sum, v) => sum + v.totalBid, 0);
    return {
      total: vendors.length,
      active,
      prospect: vendors.length - active,
      avgBid: vendors.length ? Math.round(totalBid / vendors.length) : 0,
    };
  }, [vendors]);

  return (
    <PageTransition>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] uppercase">Vendor Marketplace</h2>
          <p className="text-sm text-[var(--muted-foreground)]">Review vendor activity, identify active partners, and open proposal details quickly.</p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Vendors"
            value={stats.total}
            icon={<People />}
          />
          <StatCard
            title="Active Partners"
            value={stats.active}
            icon={<CheckCircle />}
          />
          <StatCard
            title="Prospects"
            value={stats.prospect}
            icon={<Storefront />}
          />
          <StatCard
            title="Avg Bid Value"
            value={`PKR ${stats.avgBid.toLocaleString()}`}
            icon={<AttachMoney />}
          />
        </div>

        <FilterSearchBar
          searchValue={search}
          onSearchChange={setMagnifyingGlass}
          searchPlaceholder="MagnifyingGlass vendors by name, email, or specialty..."
          activeTab={tab}
          onTabChange={setTab}
          tabs={["All Registry", "Active Partners", "Market Prospects"]}
        />

        {loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <VendorCardSkeleton key={index} />
            ))}
          </div>
        ) : filteredVendors.length === 0 ? (
          <EmptyState
            icon={Storefront}
            title="No vendors identified"
            description={
              proposals.length === 0
                ? "You will see vendor performance profiles here after receiving task proposals."
                : "Try adjusting your search criteria or switching filter categories."
            }
            action={(
              <Button
                type="button"
                onClick={() => navigate("/company/proposals")}
                size="sm"
                className="font-bold uppercase tracking-tight"
              >
                Go to Proposals
              </Button>
            )}
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredVendors.map((vendor) => (
              <VendorCard
                key={vendor._id}
                vendor={vendor}
                onOpenProposals={() => navigate("/company/proposals")}
              />
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default VendorMarketplace;
