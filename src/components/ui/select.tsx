import * as React from "react";

import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm",
      "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
      "disabled:cursor-not-allowed disabled:bg-slate-100",
      className
    )}
    {...props}
  />
));

Select.displayName = "Select";
