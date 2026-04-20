import React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/cn";

const Tabs = ({ value, onChange, tabs, children, className }) => {
  return (
    <TabsPrimitive.Root
      value={String(value)}
      onValueChange={(nextValue) => {
        if (tabs) {
          const normalizedTabs = tabs.map((tab, index) => {
            const rawValue = typeof tab === "string" ? index : tab.value ?? index;
            return {
              label: typeof tab === "string" ? tab : tab.label,
              rawValue,
              value: String(rawValue),
            };
          });
          const selectedTab = normalizedTabs.find((tab) => tab.value === nextValue);
          onChange?.(selectedTab ? selectedTab.rawValue : nextValue);
        } else {
          onChange?.(nextValue);
        }
      }}
      className={cn("w-full", className)}
    >
      {tabs ? (
        <TabsPrimitive.List className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[var(--muted)] p-1 text-[var(--muted-foreground)] border border-[var(--border)]">
          {tabs.map((tab, index) => {
            const rawValue = typeof tab === "string" ? index : tab.value ?? index;
            const valueString = String(rawValue);
            const label = typeof tab === "string" ? tab : tab.label;

            return (
              <TabsPrimitive.Trigger
                key={valueString}
                value={valueString}
                className={cn(
                  "inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold transition-all duration-200 uppercase tracking-tight",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--input-focus)]/20",
                  "data-[state=active]:bg-[var(--foreground)] data-[state=active]:text-[var(--background)] data-[state=active]:shadow-soft"
                )}
              >
                {label}
              </TabsPrimitive.Trigger>
            );
          })}
        </TabsPrimitive.List>
      ) : (
        children
      )}
    </TabsPrimitive.Root>
  );
};

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List ref={ref} className={cn(className)} {...props} />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger ref={ref} className={cn(className)} {...props} />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content ref={ref} className={cn(className)} {...props} />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export default Tabs;
export { TabsList, TabsTrigger, TabsContent };
