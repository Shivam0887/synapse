"use client";

import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import { SetStateAction, useEffect, useState } from "react";
import { toast } from "sonner";
import { useEditor } from "@/providers/editor-provider";
import { CustomNodeType } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { Check, Crown, Loader2 } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import ActionTooltip from "@/components/globals/action-tooltip";
import { useStore } from "@/providers/store-provider";
import { useBilling } from "@/providers/billing-provider";
import {
  getWorkflowById,
  publishWorkflow,
  saveWorkflow,
  unpublishWorkflow,
} from "@/actions/workflow.actions";
import { autoSave, getUser } from "@/actions/user.actions";

type EditorSidebarProps = {
  children: React.ReactNode;
  isPublished: boolean;
  setIsPublished: React.Dispatch<SetStateAction<boolean>>;
};

type currentWorkflowType = {
  nodeId: string;
  nodeType: CustomNodeType;
};

const EditorSidebar = ({
  children,
  isPublished,
  setIsPublished,
}: EditorSidebarProps) => {
  const { editorId: workflowId } = useParams() as { editorId: string };
  const { nodes, edges } = useEditor().editorState.editor;

  const { tier } = useBilling();
  const { isChecked, setIsChecked, isAutoSaving, setIsAutoSaving } = useStore();

  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [currentWorkflow, setCurrentWorkflow] = useState<currentWorkflowType[]>(
    []
  );

  useEffect(() => {
    (() => {
      const workflow: currentWorkflowType[] = nodes.map((node) => {
        return {
          nodeId: node.id,
          nodeType: node.type!,
        };
      });

      setCurrentWorkflow(workflow);
    })();
  }, [nodes]);

  useEffect(() => {
    (async () => {
      const publish = await getWorkflowById(workflowId);
      const response = await getUser();
      if (!response.success) {
        toast.error(response.error);
        return;
      }

      setIsChecked(response.data.isAutoSave);
      setIsPublished(publish);
    })();
  }, [workflowId, setIsChecked, setIsPublished]);

  const handleClick = async () => {
    try {
      setIsAutoSaving(true);
      const response = await autoSave(!isChecked);

      if (response.success) toast.success(response.data);
      else toast.error(response.error);

      setIsChecked(!isChecked);
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setIsAutoSaving(false);
    }
  };

  const handleSaveWorkflow = async () => {
    setIsSaving(true);
    const response = await saveWorkflow({
      workflowId,
      nodes: JSON.stringify(nodes),
      edges: JSON.stringify(edges),
    });

    if (!response.success) {
      toast.error(response.error);
      return;
    }

    setIsSaving(false);
    toast.success(response.data);
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    const response = isPublished
      ? await unpublishWorkflow({
          workflowId,
        })
      : await publishWorkflow({
          workflowId,
        });

    setIsPublishing(false);
    if (!response.success) {
      toast.error(response.error);
      return;
    }

    setIsPublished(!isPublished);
    toast.success(response.data);
  };

  return (
    <div className="h-full flex flex-col gap-2">
      <div className="grid grid-cols-[120px_120px] gap-x-3 gap-y-4 p-4">
        <Button
          onClick={handleSaveWorkflow}
          className="disabled:cursor-not-allowed"
          disabled={!currentWorkflow.length || isSaving || isChecked}
        >
          Save
        </Button>
        <Button
          onClick={handlePublish}
          className="disabled:cursor-not-allowed"
          disabled={!currentWorkflow.length || isPublishing}
        >
          {!isPublished ? "Publish" : "Unpublish"}
        </Button>
        <div className="flex gap-2 items-center col-span-2">
          {tier !== "Premium" && (
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
            disabled={isAutoSaving || tier !== "Premium"}
            checked={isChecked}
            onClick={handleClick}
            className="w-7 h-4"
            ThumbClassName="h-3 w-3 data-[state=checked]:translate-x-3"
          />
          <p className="text-sm text-neutral-400">auto-save workflow</p>
        </div>
        {tier === "Premium" && (
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
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
};

export default EditorSidebar;
