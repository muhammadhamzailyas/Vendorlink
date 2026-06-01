import * as React from "react";
import dayjs from "dayjs";
import { Calendar as CalendarIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { Calendar } from "./Calendar";
import { Button } from "./Button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./Popover";

export function DatePicker({ 
  value, 
  onChange, 
  placeholder = "Pick a date", 
  className, 
  disabled,
  disablePastDates = true 
}) {
  const [open, setOpen] = React.useState(false);

  const disabledDays = disablePastDates ? { before: dayjs().startOf('day').toDate() } : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-12 w-full items-center justify-start rounded-xl border border-input-border bg-input-bg px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-input-focus/15 focus:border-input-focus disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer relative",
            !value && "text-muted-foreground/60",
            value && "text-foreground font-medium",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" weight="bold" />
          <span className="truncate">{value ? dayjs(value).format("MMMM D, YYYY") : placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-popover border-border shadow-xl rounded-xl overflow-hidden" align="start">
        <Calendar
          mode="single"
          selected={value ? new Date(value) : undefined}
          disabled={disabledDays}
          onSelect={(date) => {
            onChange(date);
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

