import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm",
      "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50",
      "disabled:cursor-not-allowed disabled:bg-slate-100",
      className
    )}
    {...props}
  />
));

Input.displayName = "Input";
