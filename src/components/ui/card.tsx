import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.45)] backdrop-blur",
        className
      )}
      {...props}
    />
  );
}
