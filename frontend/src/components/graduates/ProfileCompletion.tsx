import { Progress } from "@/components/ui/progress";
import { calculateProfileStatus } from "@/lib/graduateUtils";
import type { Graduate } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProfileCompletionProps {
  graduate: Graduate;
}

export function ProfileCompletion({ graduate }: ProfileCompletionProps) {
  const { percentage, color, label } = calculateProfileStatus(graduate);

  return (
    <div className="w-full max-w-[140px] flex gap-1 ">
      <span className="items-center justify-end pl-2 text-xs flex md:hidden">
        {percentage}%
      </span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-help relative w-10 md:w-20">
              <Progress
                value={percentage}
                indicatorClassName={color}
                className="h-4 md:h-5 border border-muted/20"
              />
              <span className="absolute inset-0 items-center justify-end pl-2 text-xs text-white drop-shadow-md hidden md:flex">
                {percentage}%
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="font-semibold">{label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
