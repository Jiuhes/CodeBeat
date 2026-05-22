import * as React from "react";
import { cn } from "@/lib/utils";

const Progress = React.forwardRef(({ className, value, ...props }, ref) => (
  <div
    ref={ref}
    role="progressbar"
    aria-valuenow={value || 0}
    aria-valuemin={0}
    aria-valuemax={100}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-muted",
      className
    )}
    {...props}
  >
    <div
      className="h-full w-full flex-1 rounded-full bg-brand transition-all duration-500 ease-out"
      style={{ transform: "translateX(-" + (100 - (value || 0)) + "%)" }}
    />
  </div>
));
Progress.displayName = "Progress";

export { Progress };
