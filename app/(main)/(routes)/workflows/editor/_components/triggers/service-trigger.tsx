"use client";

import { useEditor } from "@/providers/editor-provider";
import React, { useEffect, useState } from "react";
import GoogleDriveTrigger from "./google-drive-trigger";
import DiscordTrigger from "./discord-trigger";
import { Card, CardContent } from "@/components/ui/card";
import SlackTrigger from "./slack-trigger";
import {
  getTrigger,
  onSaveTrigger,
} from "../../../../connections/_actions/connection-action";
import { ConnectionTypes } from "@/lib/types";
import { toast } from "sonner";

type ServiceTriggerProps = {
  workflowId: string;
};

const ServiceTrigger = ({ workflowId }: ServiceTriggerProps) => {
  const [trigger, setTrigger] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [loading, setLoading] = useState(false);
  const { selectedNode, edges, nodes } = useEditor().state.editor;

  const onSave = async () => {
    const targetEdges = edges.filter((edge) => edge.source === selectedNode.id);
    const targetNodes = nodes.filter(({ id, data: { type } }) => {
      return (
        type === selectedNode.type &&
        targetEdges.some((edge) => edge.target === id)
      );
    });

    const sourceNodeTrigger = await getTrigger(
      workflowId,
      selectedNode.id,
      selectedNode.type! as ConnectionTypes
    );

    const targetTrigger = await Promise.all(
      targetNodes.map(async ({ id, type }) => {
        const result = await getTrigger(
          workflowId,
          id,
          type as ConnectionTypes
        );
        if (result) {
          const data = JSON.parse(result);
          if (data.success) return ({trigger: data.data.action.trigger as string, channelId:  data.data.channelId as string});
        }
      })
    );

    const sourceNodeChannelId = sourceNodeTrigger ? JSON.parse(sourceNodeTrigger).data.channelId : "";
    const isLoopExists = targetTrigger.some((data) => trigger === "0" && data?.trigger === trigger && data?.channelId === sourceNodeChannelId);
    if (isLoopExists) {
      toast.warning("Synapse detects a loop. Please change the trigger.");
      return;
    }

    const response = await onSaveTrigger(
      workflowId,
      selectedNode.id,
      trigger,
      selectedNode.type! as ConnectionTypes
    );
    if (response) {
      const data = JSON.parse(response);
      if (data.success) toast.message(data.data);
      else {
        if (data.message) toast.message(data.message);
        else toast.error(data.error);
      }
    }
  };

  useEffect(() => {
    if (
      (selectedNode.type as ConnectionTypes) === "Discord" ||
      (selectedNode.type as ConnectionTypes) === "Slack" ||
      (selectedNode.type as ConnectionTypes) === "Notion"
    ) {
      (async () => {
        setLoading(true);
        const response = await getTrigger(
          workflowId,
          selectedNode.id,
          selectedNode.type! as ConnectionTypes
        );
        if (response) {
          const data = JSON.parse(response);
          if (data.success) {
            setTrigger(data.data.trigger);
            setWorkspaceName(data.data.channelName);
          } else {
            if (data.message) toast.message(data.message);
            else toast.error(data.error);
          }
        }
        setLoading(false);
      })();
    }
  }, [workflowId, selectedNode.id, selectedNode.type, edges, nodes]);

  return (
    <Card>
      <CardContent className="p-4">
        {selectedNode.type === "Google Drive" && <GoogleDriveTrigger />}
        {selectedNode.type === "Discord" && (
          <DiscordTrigger
            loading={loading}
            onSave={onSave}
            setTrigger={setTrigger}
            trigger={trigger}
            workspaceName={workspaceName}
          />
        )}
        {selectedNode.type === "Slack" && (
          <SlackTrigger
            loading={loading}
            onSave={onSave}
            setTrigger={setTrigger}
            trigger={trigger}
            workspaceName={workspaceName}
          />
        )}
        {selectedNode.type === "Notion" && (
          <div className="text-center">
            <p>No Trigger.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceTrigger;
