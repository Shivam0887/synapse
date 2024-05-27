import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import { SetStateAction, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getWorkflowById,
  onWorkflowSave,
  onPublishWorkflow,
} from "../../_actions/workflow-action";
import { useEditor } from "@/providers/editor-provider";
import { CustomNodeTypes } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { autoSave, getUser } from "../../../connections/_actions/get-user";
import { Check, Crown, Loader2 } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import ActionTooltip from "@/components/globals/action-tooltip";
import { useStore } from "@/providers/store-provider";
import { useBilling } from "@/providers/billing-provider";

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

  const { tier } = useBilling();
  const { isChecked, setIsChecked, isAutoSaving, setIsAutoSaving } = useStore();

  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [currentWorkflow, setCurrentWorkflow] = useState<currentWorkflowType[]>(
    []
  );

  const onSave = async () => {
    setIsSaving(true);
    const response = await onWorkflowSave({
      workflowId: editorId,
      nodes: JSON.stringify(nodes),
      edges: JSON.stringify(edges),
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
      const response = await getUser();
      if (response) {
        setIsChecked(JSON.parse(response).isAutoSave);
      }
      setIsPublished(publish);
    })();
    // eslint-disable-next-line
  }, [editorId]);

  const handleClick = async () => {
    try {
      setIsAutoSaving(true);
      const response = await autoSave(!isChecked);
      const data = JSON.parse(response);

      if (data.success) toast.success(data.message);
      else toast.error(data.error);

      setIsChecked(!isChecked);
    } catch (error: any) {
      console.log(error?.message);
    } finally {
      setIsAutoSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-[120px_120px] gap-x-3 gap-y-4 p-4">
        <Button
          onClick={onSave}
          className="disabled:cursor-not-allowed"
          disabled={!currentWorkflow.length || isSaving || isChecked}
        >
          Save
        </Button>
        <Button
          onClick={onPublish}
          className="disabled:cursor-not-allowed"
          disabled={!currentWorkflow.length || isPublishing}
        >
          {!isPublished ? "Publish" : "Unpublish"}
        </Button>
        <div className="flex gap-2 items-center col-span-2">
          {tier !== "Premium Plan" && (
            <TooltipProvider>
              <ActionTooltip
                label={
                  <Crown className="cursor-pointer fill-yellow-400 stroke-yellow-400 h-4 w-4" />
                }
              >
                Subscribe to Premium Plan
              </ActionTooltip>
            </TooltipProvider>
          )}
          <Switch
            disabled={isAutoSaving || tier !== "Premium Plan"}
            checked={isChecked}
            onClick={handleClick}
            className="w-7 h-4"
            ThumbClassName="h-3 w-3 data-[state=checked]:translate-x-3"
          />
          <p className="text-sm text-neutral-400">auto-save workflow</p>
        </div>
        {tier === "Premium Plan" && (
          <p className="text-sm text-neutral-400">
            {isAutoSaving ? (
              <span className="inline-flex gap-2 items-center">
                <Loader2 className="w-3 h-3 animate-spin" /> saving
              </span>
            ) : (
              <span className="inline-flex gap-2 items-center">
                <Check className="w-3 h-3" /> saved
              </span>
            )}
          </p>
        )}
      </div>
      {children}
    </div>
  );
};

export default FlowInstance;
