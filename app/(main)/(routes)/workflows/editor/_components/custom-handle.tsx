"use client";

import { cn } from "@/lib/utils";
import { Handle, HandleProps } from "@xyflow/react";

type CustomHandleProps = HandleProps & {
  style?: React.CSSProperties;
};

const CustomHandle = (props: CustomHandleProps) => {
  return (
    <Handle
      {...props}
      isValidConnection={(connection) =>
        connection.source !== connection.target
      }
      className={cn(
        "!left-1/2 !-translate-x-1/2 !w-3 !h-3 dark:bg-neutral-800",
        {
          "!translate-y-1/2 !bottom-0": props.type === "source",
          "!-translate-y-1/2 !top-0": props.type === "target",
        }
      )}
    />
  );
};

export default CustomHandle;
