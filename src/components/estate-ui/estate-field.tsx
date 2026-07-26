import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface EstateFieldProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  id: string;
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: (controlProps: {
    id: string;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean;
    "aria-required"?: boolean;
  }) => React.ReactNode;
}

export const EstateField = React.forwardRef<HTMLDivElement, EstateFieldProps>(
  ({ className, id, label, description, error, required, children, ...props }, ref) => {
    const descriptionId = description ? `${id}-description` : undefined;
    const errorId = error ? `${id}-error` : undefined;

    // According to requirements, when both exist, aria-describedby includes both IDs
    const ariaDescribedBy = [errorId, descriptionId].filter(Boolean).join(" ") || undefined;

    return (
      <div ref={ref} className={cn("space-y-[var(--soe-space-2)]", className)} {...props}>
        <label htmlFor={id} className="block font-ui text-[length:var(--soe-text-sm)] font-medium text-[var(--soe-color-text-primary)]">
          {label}
          {required && <span className="ml-1 text-[var(--soe-color-error)]" aria-hidden="true">*</span>}
        </label>

        {/* Child form control via typed render prop */}
        {children({
          id,
          "aria-describedby": ariaDescribedBy,
          ...(error ? { "aria-invalid": true } : {}),
          ...(required ? { "aria-required": true } : {}),
        })}

        {description && (
          <p id={descriptionId} className="text-[length:var(--soe-text-sm)] text-[var(--soe-color-text-secondary)]">
            {description}
          </p>
        )}
        {error && (
          <p id={errorId} className="text-[length:var(--soe-text-sm)] text-[var(--soe-color-error)] font-medium">
            {error}
          </p>
        )}
      </div>
    );
  }
);

EstateField.displayName = "EstateField";
