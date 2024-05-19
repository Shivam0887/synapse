import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import React, { SetStateAction, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getWorkflowById,
  onWorkflowSave,
  onPublishWorkflow,
} from "../../_actions/workflow-action";
import { useEditor } from "@/providers/editor-provider";
import { CustomNodeTypes } from "@/lib/types";

type FlowInstanceProps = {
  children: React.ReactNode;
  isPublished: boolean;
  setIsPublished: React.Dispatch<SetStateAction<boolean>>;
};

type currentWorkflowType = {
  nodeId: string;
  nodeType: CustomNodeTypes;
};

const FlowInstance = ({
  children,
  isPublished,
  setIsPublished,
}: FlowInstanceProps) => {
  const { editorId } = useParams() as { editorId: string };
  const { nodes, edges } = useEditor().state.editor;
  const [currentWorkflow, setCurrentWorkflow] = useState<currentWorkflowType[]>(
    []
  );

  const [isPublishing, setIsPublishing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const onSave = async () => {
    setIsSaving(true);
    const response = await onWorkflowSave({
      workflowId: editorId,
      nodes: JSON.stringify(nodes),
      edges: JSON.stringify(edges),
      nodeMetadata: JSON.stringify(currentWorkflow),
    });

    setIsSaving(false);
    toast(response);
  };

  const onPublish = async () => {
    setIsPublishing(true);
    const response = await onPublishWorkflow({
      workflowId: editorId,
      publish: !isPublished,
    });

    const data = response ? JSON.parse(response) : "";

    setIsPublished(!!data?.success);
    setIsPublishing(false);

    if (data.message) toast(data.message);
  };

  useEffect(() => {
    (() => {
      const workflow: currentWorkflowType[] = nodes.map((node) => {
        return {
          nodeId: node.id,
          nodeType: node.data.type,
        };
      });

      setCurrentWorkflow(workflow);
    })();
  }, [nodes]);

  useEffect(() => {
    (async () => {
      const publish = await getWorkflowById(editorId);
      setIsPublished(publish);
    })();
    // eslint-disable-next-line
  }, [editorId]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-3 p-4">
        <Button onClick={onSave} disabled={!currentWorkflow.length || isSaving}>
          Save
        </Button>
        <Button
          onClick={onPublish}
          disabled={!currentWorkflow.length || isPublishing}
        >
          {!isPublished ? "Publish" : "Unpublish"}
        </Button>
      </div>
      {children}
    </div>
  );
};

export default FlowInstance;
