"use client";

import axios from "axios";
import { toast } from "sonner";
import { z, ZodError } from "zod";
import { Ghost } from "lucide-react";
import { useEffect, useState } from "react";

import { CONNECTIONS } from "@/lib/constants";
import { ActionDataType, CustomNodeType } from "@/lib/types";
import { isConnectionType, isValidTrigger } from "@/lib/utils";

import { useEditor } from "@/providers/editor-provider";
import { getTrigger } from "@/actions/connection.actions";

import ActionForm from "@/components/forms/action-form";
import { Card, CardContent } from "@/components/ui/card";
import WorkflowLoading from "@/components/workflow-loading";
import NotionActionForm from "@/components/forms/notion-action-form";

type ServiceActionProps = {
  workflowId: string;
  parentTrigger: {
    type: Exclude<CustomNodeType, "AI" | "Notion">;
    id: string;
  };
};

const responseSchema = z.array(
  z.object({
    id: z.string(),
    username: z.string(),
  })
);

const ServiceAction = ({ workflowId, parentTrigger }: ServiceActionProps) => {
  const { selectedNode, edges, nodes } = useEditor().editorState.editor;
  const [loading, setLoading] = useState(false);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [defaultMessage, setDefaultMessage] = useState("");
  const [users, setUsers] = useState<{ id: string; username: string }[]>([]);

  const [actionData, setActionData] = useState<ActionDataType>({
    trigger: "0",
    message: "",
    mode: "default",
    user: "",
  });

  // loading the channel members
  useEffect(() => {
    (async () => {
      if (selectedNode.type === "Discord" || selectedNode.type === "Slack") {
        setUsersLoaded(true);
        const url =
          selectedNode.type === "Discord" ? "/api/discord" : "/api/slack";

        try {
          const response = await axios.post(url, {
            workflowId,
            nodeId: selectedNode.id,
          });

          if (response.status === 200) {
            const users = responseSchema.parse(response.data.users);
            setUsers(users);
          }
        } catch (error) {
          if (error instanceof Error || error instanceof ZodError)
            toast.error(error.message);
        }
        setUsersLoaded(false);
      }
    })();
  }, [selectedNode.id, selectedNode.type, workflowId]);

  useEffect(() => {
    (async () => {
      if (
        isConnectionType(selectedNode.type) &&
        selectedNode.type !== "Google Drive"
      ) {
        // finding an edge between the source and the target(selectedNode) node
        const edge = edges.find(({ target }) => target === selectedNode.id);

        // finding the type of the source node
        const sourceNodeType = nodes.find(
          (node) => node.id === edge?.source
        )?.type;

        setLoading(true);

        if (isValidTrigger(sourceNodeType)) {
          if (sourceNodeType === "Google Drive")
            setDefaultMessage("A change occur in your Google Drive: ");
          else {
            const response = await getTrigger(edge!.source, sourceNodeType);

            if (!response.success) {
              toast.error(response.error);
              return;
            }

            const data = response.data;
            const nodeType = data.nodeType;

            if (nodeType === "Discord" || nodeType === "Slack") {
              const node = CONNECTIONS[nodeType].message!;
              const message = node[data.trigger];
              setDefaultMessage(message);
            }
          }
        }

        const response = await getTrigger(selectedNode.id, selectedNode.type);

        if (!response.success) {
          toast.error(response.error);
          return;
        }

        const data = response.data;

        setActionData({
          trigger: data.action?.trigger ?? "0",
          mode: data.action?.mode ?? "default",
          message: data.action?.message ?? "",
          user: "",
        });

        setLoading(false);
      }
    })();
  }, [selectedNode.type, workflowId, selectedNode.id, edges, nodes]);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="relative">
          {selectedNode.type === "Google Drive" && (
            <div className="flex flex-col items-center gap-2">
              <Ghost />
              <p className="text-center font-medium">Not available</p>
            </div>
          )}
          {loading && usersLoaded ? (
            <WorkflowLoading />
          ) : (
            <>
              {(selectedNode.type === "Slack" ||
                selectedNode.type === "Discord") && (
                <ActionForm
                  parentTrigger={parentTrigger}
                  actionData={actionData}
                  defaultMessage={
                    defaultMessage
                      ? defaultMessage
                      : "For default message, set trigger to a valid node."
                  }
                  setActionData={setActionData}
                  nodeId={selectedNode.id}
                  workflowId={workflowId}
                  users={users}
                />
              )}
              {selectedNode.type === "Notion" && (
                <NotionActionForm
                  workflowId={workflowId}
                  isTesting={false}
                  trigger={actionData.trigger}
                />
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceAction;
