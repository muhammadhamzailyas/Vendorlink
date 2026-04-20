import * as React from "react"
import {
  ResponsiveContainer,
  Tooltip,
} from "recharts"

import { cn } from "@/lib/cn"

const ChartContainer = React.forwardRef(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex justify-center text-xs [&_.recharts-cartesian-grid-horizontal_line]:stroke-[var(--border)]/50 [&_.recharts-cartesian-grid-vertical_line]:stroke-[var(--border)]/50 [&_.recharts-curve.recharts-line]:stroke-[var(--foreground)] [&_.recharts-dot]:fill-[var(--card)] [&_.recharts-dot]:stroke-[var(--foreground)] [&_.recharts-layer]:outline-none [&_.recharts-polar-grid-concentric-polygon]:stroke-[var(--border)] [&_.recharts-polar-grid-concentric-path]:stroke-[var(--border)] [&_.recharts-polar-grid-horizontal]:stroke-[var(--border)] [&_.recharts-polar-grid-vertical]:stroke-[var(--border)] [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-[var(--muted)] [&_.recharts-scatter-gradient-stop-0]:stop-color-[var(--foreground)] [&_.recharts-scatter-gradient-stop-1]:stop-color-[var(--foreground)]/30 [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <div className="relative h-full w-full">
            {children}
        </div>
      </div>
    )
  }
)
ChartContainer.displayName = "ChartContainer"

const ChartTooltip = Tooltip

const ChartTooltipContent = React.forwardRef(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
    },
    ref
  ) => {
    if (!active || !payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-2.5 shadow-soft",
          className
        )}
      >
        {!hideLabel && (
          <div className={cn("text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-tight", labelClassName)}>
            {labelFormatter ? labelFormatter(label, payload) : label}
          </div>
        )}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const itemConfig = {} // In a real shadcn impl, we'd look this up in config

            return (
              <div
                key={item.dataKey || index}
                className="flex items-center gap-2"
              >
                {!hideIndicator && (
                  <div
                    className={cn(
                      "shrink-0 rounded-[2px] border-[1.5px] border-[var(--border)]",
                      indicator === "dot" && "h-2.5 w-2.5 rounded-full",
                      indicator === "line" && "w-1",
                      indicator === "dashed" &&
                        "w-0 border-[1.5px] border-dashed bg-transparent"
                    )}
                    style={{
                      backgroundColor: item.color || item.payload.fill,
                    }}
                  />
                )}
                <div className="flex flex-1 items-center justify-between gap-4 leading-none">
                  <div className="grid gap-0.5">
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {itemConfig?.label || item.name}
                    </span>
                  </div>
                  {item.value && (
                    <span className="font-mono font-bold text-[var(--foreground)]">
                      {formatter
                        ? formatter(item.value, item.name, item, index, payload)
                        : item.value.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltip"

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
}
