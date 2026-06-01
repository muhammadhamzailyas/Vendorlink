import React, { useState } from "react";
import { MagnifyingGlass, Funnel as Funnel } from "@phosphor-icons/react";
import { Button, Card, Input, Tabs, TabsList, TabsTrigger } from "../ui";
import { cn } from "@/lib/cn";

/**
 * Reusable FilterSearchBar component with collapsible filter tabs
 */
const FilterSearchBar = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  activeTab,
  onTabChange,
  tabs = [],
  actions,
  leftAction,
  showToggle = true,
  filters,
  className,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const hasTabs = tabs.length > 0;
  const shouldShowContent = !showToggle || showFilters;

  return (
    <Card className={cn("mb-8 overflow-hidden shadow-soft border-border bg-card", className)}>
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          {leftAction && <div className="shrink-0">{leftAction}</div>}
          
          {showToggle && (hasTabs || filters) ? (
            <Button
              type="button"
              variant={showFilters ? "secondary" : "ghost"}
              onClick={() => setShowFilters(!showFilters)}
              className="shrink-0 rounded-xl font-bold uppercase tracking-tight"
              size="sm"
            >
              
              <span className="whitespace-nowrap">Filters</span>
            </Button>
          ) : null}

          <div className="relative min-w-0 flex-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground z-10">
              <MagnifyingGlass size={18} />
            </div>
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-11 h-11"
            />
          </div>

          {actions ? <div className="flex flex-wrap items-center gap-3 lg:justify-end">{actions}</div> : null}
        </div>

        {(hasTabs || filters) && shouldShowContent ? (
        <div className={cn(
            "animate-in fade-in slide-in-from-top-2 duration-200 space-y-4",
            showToggle && "border-t border-border pt-5"
        )}>
          {filters && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filters}
            </div>
          )}
          
          {hasTabs && (
            <Tabs 
                value={tabs[activeTab]} 
                onChange={(value) => onTabChange(tabs.indexOf(value))}
                className="w-full"
            >
                <TabsList className="bg-muted rounded-xl p-1 h-auto flex flex-wrap justify-start gap-1 border border-border">
                {tabs.map((label, index) => (
                    <TabsTrigger 
                    key={index} 
                    value={label}
                    className="cursor-pointer hover:text-foreground hover:bg-muted-foreground/10 rounded-lg px-4 py-2 font-bold uppercase tracking-tight text-[11px] data-[state=active]:bg-foreground data-[state=active]:text-background transition-all"
                    >
                    {label}
                    </TabsTrigger>
                ))}
                </TabsList>
            </Tabs>
          )}
        </div>
        ) : null}
      </div>
    </Card>
  );
};

export default FilterSearchBar;






