import { useEditor } from "@/providers/editor-provider";
import { Handle, HandleProps } from "reactflow";

type CustomHandleProps = HandleProps & {
  style?: React.CSSProperties;
};

const CustomHandle = (props: CustomHandleProps) => {
  const { state } = useEditor();
  return (
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
      className="!-bottom-2 !b-4 !w-2 !h-2 dark:bg-neutral-800"
    />
  );
};

export default CustomHandle;
