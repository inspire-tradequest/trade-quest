
import React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  colorClassName?: string;
}

export function ProgressBar({
  value = 0,
  max = 100,
  showValue = false,
  size = "md",
  colorClassName = "bg-primary",
  className,
  ...props
}: ProgressBarProps) {
  const percentage = Math.min(Math.max(0, (value / max) * 100), 100);
  
  const sizeStyles = {
    sm: "h-1",
    md: "h-2",
    lg: "h-4",
  };

  return (
    <div className={cn("w-full overflow-hidden", className)} {...props}>
      <div
        className={cn("w-full rounded-full bg-gray-200 dark:bg-gray-700", sizeStyles[size])}
      >
        <div
          className={cn(colorClassName, "rounded-full transition-all", sizeStyles[size])}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      {showValue && (
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {value} / {max} ({Math.round(percentage)}%)
        </div>
      )}
    </div>
  );
}

export default ProgressBar;
