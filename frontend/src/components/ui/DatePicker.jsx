import * as React from "react";
import dayjs from "dayjs";
import { Calendar as CalendarIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";
import { Calendar } from "./Calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./Popover";

export function DatePicker({ value, onChange, placeholder = "Pick a date", className, disabled }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          className={cn(
            "w-full justify-start text-left font-normal h-11 rounded-xl border-input-border bg-input-bg",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
          {value ? dayjs(value).format("MMM D, YYYY") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}



