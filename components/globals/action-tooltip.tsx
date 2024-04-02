import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ActionTooltipProps = {
  label: string | React.ReactNode;
  side?: "top" | "left" | "right" | "bottom";
  align?: "center" | "start" | "end";
  sideOffset?: number | undefined;
  children: React.ReactNode;
};

const ActionTooltip = ({
  align = "center",
  children,
  label,
  side = "top",
  sideOffset,
}: ActionTooltipProps) => {
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>{label}</TooltipTrigger>
      <TooltipContent
        side={side}
        align={align}
        sideOffset={sideOffset}
        className="bg-black/10 backdrop-blur-xl"
      >
        {children}
      </TooltipContent>
    </Tooltip>
  );
};

export default ActionTooltip;
