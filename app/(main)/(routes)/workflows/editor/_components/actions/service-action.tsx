import { Card, CardContent } from "@/components/ui/card";
import { useEditor } from "@/providers/editor-provider";
import React, { useEffect, useState } from "react";
import { getTrigger } from "../../../../connections/_actions/connection-action";
import { ActionDataType, ConnectionTypes } from "@/lib/types";
import { toast } from "sonner";
import { CONNECTIONS } from "@/lib/constant";
import { z } from "zod";
import ActionForm from "@/components/forms/action-form";
import axios from "axios";
import NotionAction from "./notion-action";
import { Ghost } from "lucide-react";

type ServiceActionProps = {
  workflowId: string;
};

const responseSchema = z.array(
  z.object({
    id: z.string(),
    username: z.string(),
  })
);

const ServiceAction = ({ workflowId }: ServiceActionProps) => {
  const { selectedNode, edges, nodes } = useEditor().state.editor;
  const [loading, setLoading] = useState(false);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [defaultMessage, setDefaultMessage] = useState("");
  const [users, setUsers] = useState<{ id: string; username: string }[]>([]);

  const [actionData, setActionData] = useState<ActionDataType>({
    trigger: undefined,
    message: "",
    type: "default",
    user: "",
  });

  // finding an edge between the source and the target(selectedNode) node
  const edge = edges.find(({ target }) => target === selectedNode.id);

  // finding the type of the source node
  const sourceNodeType = nodes.find((node) => node.id === edge?.source);

  // loading the channel members
  useEffect(() => {
    if (selectedNode.type === "Discord" || selectedNode.type === "Slack") {
      (async () => {
        setUsersLoaded(true);
        const url =
          selectedNode.type === "Discord" ? "/api/discord" : "/api/slack";
        try {
          const response = await axios.post(url, {
            workflowId,
            nodeId: selectedNode.id,
          });
          if (response) {
            const result = responseSchema.safeParse(response.data.users);
            if (result.success) {
              setUsers(result.data);
            } else toast.error(result.error.message);
          }
        } catch (error: any) {
          console.log(error?.message);
        }
        setUsersLoaded(false);
      })();
    }
  }, [selectedNode.id, selectedNode.type, workflowId]);

  useEffect(() => {
    if (selectedNode.type === "Discord" || selectedNode.type === "Slack") {
      (async () => {
        if (edge && sourceNodeType) {
          setLoading(true);
          const triggerResponse = await getTrigger(
            workflowId,
            edge.source,
            sourceNodeType.type as ConnectionTypes
          );

          const actionResponse = await getTrigger(
            workflowId,
            selectedNode.id,
            selectedNode.type as ConnectionTypes
          );

          if (actionResponse) {
            const { success, data, message, error } =
              JSON.parse(actionResponse);
            if (success) {
              setActionData({
                trigger: data.action.trigger,
                type: data.action.mode,
                message: data.action.message,
                user: data.action.user,
              });
            } else {
              if (message) toast.message(message);
              else toast.error(error);
            }
          }

          if (triggerResponse) {
            const { success, data, message, error } =
              JSON.parse(triggerResponse);
            if (success) {
              const nodeType = data.nodeType as ConnectionTypes;
              if (nodeType === "Discord" || nodeType === "Slack") {
                const node = CONNECTIONS[nodeType].message!;
                const message = node[data.trigger];
                setDefaultMessage(message);
              }
            } else {
              if (message) toast.message(message);
              else toast.error(error);
            }
          }

          setLoading(false);
        }
      })();
    }
  }, [selectedNode.type, workflowId, selectedNode.id, edge, sourceNodeType]);

  return (
    <Card>
      <CardContent className="p-4">
        {selectedNode.type === "Google Drive" && (
          <div className="flex flex-col items-center gap-2">
            <Ghost />
            <p className="text-center font-medium">Not available</p>
          </div>
        )}
        {(selectedNode.type === "Slack" || selectedNode.type === "Discord") && (
          <ActionForm
            actionData={actionData}
            defaultMessage={
              defaultMessage
                ? defaultMessage
                : "Must have a trigger node for default message"
            }
            loading={loading && usersLoaded}
            setActionData={setActionData}
            nodeId={selectedNode.id}
            workflowId={workflowId}
            users={users}
          />
        )}
        {selectedNode.type === "Notion" && (
          <NotionAction workflowId={workflowId} isTesting={false} />
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceAction;
