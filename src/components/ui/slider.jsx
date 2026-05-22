import * as React from "react";
import { cn } from "@/lib/utils";

const Slider = React.forwardRef(
  ({ className, value, min = 0, max = 100, onChange, ...props }, ref) => {
    const percentage = ((value - min) / (max - min)) * 100;
    return (
      <div
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          className
        )}
      >
        <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-muted">
          <div
            className="absolute h-full bg-brand rounded-full transition-all"
            style={{ width: percentage + "%" }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={onChange}
          className="absolute w-full h-5 opacity-0 cursor-pointer"
          {...props}
        />
      </div>
    );
  }
);
Slider.displayName = "Slider";

export { Slider };
