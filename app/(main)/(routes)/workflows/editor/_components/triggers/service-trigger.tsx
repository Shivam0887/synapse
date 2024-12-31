"use client";

import { toast } from "sonner";
import { Ghost } from "lucide-react";
import React, { useEffect, useState } from "react";

import SlackTrigger from "./slack-trigger";
import DiscordTrigger from "./discord-trigger";
import GoogleDriveTrigger from "./google-drive-trigger";

import { isConnectionType } from "@/lib/utils";
import { useEditor } from "@/providers/editor-provider";
import { Card, CardContent } from "@/components/ui/card";
import { getTrigger, saveTrigger } from "@/actions/connection.actions";
import { CustomNode, CustomNodeType, TriggerValue } from "@/lib/types";
import { Edge } from "@xyflow/react";

type ServiceTriggerProps = {
  workflowId: string;
  parentTrigger: {
    type: Exclude<CustomNodeType, "AI" | "Notion">,
    id: string
  }
};

const findTargetEdges = (nodes: CustomNode[], edges: Edge[], nodeId: string, nodeType: "Slack" | "Notion" | "Discord") => {
  // Edges that came out of the node having its id equals to the nodeId.
  const targetEdges = edges.filter(({ source }) => source === nodeId);

  const targetNodes = nodes.filter(({ id }) =>
    targetEdges.some(({ target, type }) => target === id && type === nodeType)
  );

  return targetNodes.reduce((totalTargetNodes, { id }) => {
    totalTargetNodes.concat(findTargetEdges(nodes, edges, id, nodeType));
    return totalTargetNodes;
  }, [] as CustomNode[]);
}

const ServiceTrigger = ({ workflowId, parentTrigger }: ServiceTriggerProps) => {
  const [trigger, setTrigger] = useState<TriggerValue>("0");
  const [workspaceName, setWorkspaceName] = useState("");
  const [loading, setLoading] = useState(false);
  const { selectedNode, edges, nodes } = useEditor().editorState.editor;

  const onTriggerSave = async () => {
    try {
      if (!(selectedNode.type === "Slack" || selectedNode.type === "Discord") || trigger === undefined) return;

      // If the selected node is the current trigger node
      if(parentTrigger.id === selectedNode.id){
        
        const targetNodes = findTargetEdges(nodes, edges, selectedNode.id, selectedNode.type);

        const sourceNodeTrigger = await getTrigger(
          selectedNode.id,
          selectedNode.type
        );

        if (!sourceNodeTrigger.success) {
          toast.error(sourceNodeTrigger.error);
          return;
        }

        const targetTrigger = await Promise.all(
          targetNodes.map(async ({ id, type }) => {
            if (isConnectionType(type) && type !== "Google Drive"){
              const result = await getTrigger(id, type);
              if (result.success) {
                return {
                  trigger: result.data.action?.trigger ?? "0",
                  channelId: result.data.channelId,
                };
              }
            } 
          })
        );

        const sourceNodeChannelId = sourceNodeTrigger.data.channelId;
        const isLoopExists = targetTrigger.some(
          (data) =>
            trigger === "0" &&
            data?.trigger === trigger &&
            data?.channelId === sourceNodeChannelId
        );
        
        if (isLoopExists) {
          toast.warning("Synapse detects a loop. Please change the trigger.");
          return;
        }
      }

      const response = await saveTrigger(
        workflowId,
        selectedNode.id,
        trigger,
        selectedNode.type
      );

      if (!response.success) toast.error(response.error);
      else toast.success(response.data);
    } catch (error) {
      console.log("Error on trigger save");
      if (error instanceof Error) toast.error(error.message);
    }
  };

  useEffect(() => {
    (async () => {
      if (isConnectionType(selectedNode.type) && selectedNode.type !== "Google Drive") {
        setLoading(true);
        const response = await getTrigger(selectedNode.id, selectedNode.type);
        if (!response.success) {
          toast.error(response.error);
          return;
        }

        setTrigger(response.data.trigger);
        setWorkspaceName(response.data.channelName);

        setLoading(false);
      }
    })();
  }, [selectedNode.id, selectedNode.type]);

  return (
    <Card>
      <CardContent className="p-4">
        {selectedNode.type === "Google Drive" && (
          <GoogleDriveTrigger nodeId={selectedNode.id} />
        )}
        {selectedNode.type === "Discord" && (
          <DiscordTrigger
            loading={loading}
            onSave={onTriggerSave}
            setTrigger={setTrigger}
            trigger={trigger}
            workspaceName={workspaceName}
          />
        )}
        {selectedNode.type === "Slack" && (
          <SlackTrigger
            loading={loading}
            onSave={onTriggerSave}
            setTrigger={setTrigger}
            trigger={trigger}
            workspaceName={workspaceName}
          />
        )}
        {selectedNode.type === "Notion" && (
          <div className="flex flex-col items-center gap-2">
            <Ghost />
            <p className="text-center font-medium">Not available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceTrigger;
