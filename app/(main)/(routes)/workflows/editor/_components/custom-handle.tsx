import { cn } from "@/lib/utils";
import { useEditor } from "@/providers/editor-provider";
import { memo } from "react";
import { Handle, HandleProps } from "reactflow";

type CustomHandleProps = HandleProps & {
  style?: React.CSSProperties;
};

const CustomHandle = (props: CustomHandleProps) => {
  const { state } = useEditor();
  return (
    <>
      <Handle
        {...props}
        isValidConnection={(connection) => {
          //single source/target for a connection
          const IsConnectionExists = !!state.editor.edges.filter(
            (edge) =>
              connection.source === edge.source ||
              connection.target === edge.target
          ).length;

          const sourceNode = state.editor.nodes.find(
            (node) => node.id === connection.source
          );

          return (!IsConnectionExists || sourceNode?.type === "Condition") &&
            connection.source !== connection.target
            ? true
            : false;
        }}
        className={cn(
          "!left-1/2 !-translate-x-1/2 !w-3 !h-3 dark:bg-neutral-800",
          {
            "!translate-y-1/2 !bottom-0": props.type === "source",
            "!-translate-y-1/2 !top-0": props.type === "target",
          }
        )}
      />
    </>
  );
};

export default memo(CustomHandle);
