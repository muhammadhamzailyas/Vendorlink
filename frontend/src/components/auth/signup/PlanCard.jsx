import React from "react";
import { Check } from "@phosphor-icons/react";
import { Card } from "../../ui";
import { cn } from "@/lib/cn";

const PlanCard = ({ plan, isSelected, onSelect }) => (
  <Card
    onClick={() => onSelect(plan.id)}
    className={cn(
      "relative cursor-pointer border-2 transition-all duration-200 overflow-hidden",
      isSelected ? "border-ring bg-foreground/5 ring-4 ring-primary/10" : "border-border hover:border-ring/30"
    )}
  >
    {plan.featured && (
      <div className="absolute top-0 right-0 bg-foreground text-background text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">
        Popular
      </div>
    )}
    <div className="p-5 space-y-4">
      <div>
        <h3 className="text-lg font-bold">{plan.name}</h3>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-black">${plan.price}</span>
          <span className="text-xs text-muted-foreground font-medium">/month</span>
        </div>
      </div>
      
      <ul className="space-y-2">
        {plan.features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-xs text-foreground/80">
            <Check className="h-3.5 w-3.5 text-foreground shrink-0" />
            {f}
          </li>
        ))}
      </ul>
    </div>
  </Card>
);

export default PlanCard;



