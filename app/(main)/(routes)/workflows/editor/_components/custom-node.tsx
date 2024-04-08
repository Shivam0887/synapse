import { CustomNodeDataType } from "@/lib/types";
import { useEditor } from "@/providers/editor-provider";
import { useMemo } from "react";
import { Position, useNodeId } from "reactflow";
import CustomNodeIcon from "./custom-node-icon";
import CustomHandle from "./custom-handle";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type CustomNodeProps = {
  data: CustomNodeDataType;
};

const CustomNode = ({ data }: CustomNodeProps) => {
  const { dispatch, state } = useEditor();
  const nodeId = useNodeId();

  const logo = useMemo(() => <CustomNodeIcon type={data.type} />, [data]);

  return (
    <>
      {data.type !== "Trigger" && data.type !== "Google Drive" && (
        <CustomHandle
          position={Position.Top}
          type="target"
          style={{ zIndex: 100 }}
        />
      )}

      <Card
        onClick={(e) => {
          e.stopPropagation();
          const node = state.editor.nodes.find((node) => node.id === nodeId);
          if (node) {
            dispatch({ type: "SELECTED_ELEMENT", payload: { node } });
          }
        }}
        className="relative max-w-[400px] dark:border-muted-foreground/70"
      >
        <CardHeader className="flex flex-row items-center gap-4 mt-5">
          <div>{logo}</div>
          <div>
            <CardTitle className="text-base">{data.title}</CardTitle>
            <CardDescription className="flex flex-col items-start mt-2 gap-2">
              <span className="text-xs text-white">
                ID: <b className="text-muted-foreground/80">{nodeId}</b>
              </span>
              <span>{data.description}</span>
            </CardDescription>
          </div>
        </CardHeader>

        <Badge variant="secondary" className="absolute right-2 top-2">
          {data.type}
        </Badge>

        <div
          className={cn("absolute left-2 top-4 w-2 h-2 rounded-full", {
            "bg-green-500": Math.random() < 0.6,
            "bg-orange-500": Math.random() >= 0.6 && Math.random() < 0.8,
            "bg-red-500": Math.random() >= 0.8,
          })}
        />
      </Card>

      <CustomHandle type="source" position={Position.Bottom} id="a" />
    </>
  );
};

export default CustomNode;
