import { Button } from "@/components/ui/button";
import { CustomNodeType } from "@/lib/types";
import { useNodeConnections } from "@/providers/connections-provider";
import { useParams } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  onCreateNodesEdges,
  onFlowPublish,
} from "../_actions/workflow-connections-action";

type FlowInstanceProps = {
  nodes: CustomNodeType[];
  edges: { id: string; source: string; target: string }[];
  children: React.ReactNode;
};

const FlowInstance = ({ children, edges, nodes }: FlowInstanceProps) => {
  const { editorId } = useParams();
  const [isFlow, setIsFlow] = useState([]);

  const { nodeConnection } = useNodeConnections();
  const {} = nodeConnection;

  const onFlowAutomation = useCallback(async () => {
    const response = await onCreateNodesEdges({
      flowId: editorId as string,
      nodes: JSON.stringify(nodes),
      edges: JSON.stringify(edges),
      flowPath: JSON.stringify(isFlow),
    });

    toast(response);
  }, []);

  const onPublishWorkflow = useCallback(async () => {
    const response = await onFlowPublish({
      flowId: editorId as string,
      publish: true,
    });
    toast(response);
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-3 p-4">
        <Button onClick={onFlowAutomation} disabled={!isFlow.length}>
          Save
        </Button>
        <Button onClick={onPublishWorkflow} disabled={!isFlow.length}>
          Publish
        </Button>
      </div>
      {children}
    </div>
  );
};

export default FlowInstance;
