import React from "react";
import { Plus as Add, Trash as Delete } from "@phosphor-icons/react";
import { Button, Input, Label } from "@/components/ui";
import { cn } from "@/lib/cn";

const DynamicListField = ({
  label,
  items,
  onAdd,
  onRemove,
  onChange,
  placeholder,
  inputType = "text",
  addLabel = "Add Item",
  disabled,
  required,
  error,
  helperText,
  className,
}) => (
  <div className={cn("md:col-span-2", className)}>
    <div className="mb-2">
      {label && <Label className="block text-[13px] font-bold tracking-tight text-foreground/80 uppercase mb-2">{label}</Label>}
      {helperText ? <p className="mt-1 text-xs font-medium text-muted-foreground">{helperText}</p> : null}
    </div>
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-3">
          <Input
            type={inputType}
            value={item}
            onChange={(e) => onChange(index, e.target.value)}
            placeholder={placeholder ? `${placeholder} ${index + 1}` : `Item ${index + 1}`}
            required={required && index === 0}
            disabled={disabled}
            error={index === 0 ? error : undefined}
            className="flex-1"
          />
          {items.length > 1 && (
            <Button
              type="button"
              onClick={() => onRemove(index)}
              variant="secondary"
              size="xs"
              className="h-11 w-11 shrink-0 rounded-xl text-danger hover:bg-danger-surface hover:border-danger/30 active:scale-[0.95]"
            >
              
            </Button>
          )}
        </div>
      ))}
    </div>
    <Button
      type="button"
      onClick={onAdd}
      disabled={disabled}
      variant="secondary"
      size="sm"
      className="mt-4 font-semibold uppercase tracking-tight"
    >
       {addLabel}
    </Button>
    {error ? <p className="mt-1.5 text-xs font-bold text-danger">{error}</p> : null}
  </div>
);

export default DynamicListField;




