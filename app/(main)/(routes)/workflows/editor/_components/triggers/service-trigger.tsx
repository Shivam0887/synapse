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
  const { selectedNode } = useEditor().state.editor;
  const [databaseId, setDatabaseId] = useState<string>("");

  const onSave = async () => {
    const response = await onSaveTrigger(
      workflowId,
      selectedNode.id,
      trigger,
      selectedNode.type! as ConnectionTypes,
      databaseId
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
            if (data.data.databaseId) {
              setDatabaseId(data.data.databaseId);
            }
          } else {
            if (data.message) toast.message(data.message);
            else toast.error(data.error);
          }
        }
        setLoading(false);
      })();
    }
  }, [workflowId, selectedNode.id, selectedNode.type]);

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
