import { useEditor } from "@/providers/editor-provider";
import React, { useEffect, useState } from "react";
import GoogleDriveFiles from "./google-drive-files";
import DiscordTrigger from "./discord-trigger";
import { Card, CardContent } from "@/components/ui/card";
import SlackTrigger from "./slack-trigger";
import {
  getTrigger,
  onSaveTrigger,
} from "../../../connections/_actions/connection-action";
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

  const onSave = async () => {
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
    if ((selectedNode.type as ConnectionTypes) !== "Google Drive") {
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

          setLoading(false);
        }
      })();
    }
  }, [workflowId, selectedNode.id, selectedNode.type]);

  return (
    <Card>
      <CardContent className="p-4">
        {selectedNode.type === "Google Drive" && <GoogleDriveFiles />}
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
      </CardContent>
    </Card>
  );
};

export default ServiceTrigger;
