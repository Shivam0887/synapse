import { Button } from "@/components/ui/button";
import { ConnectionTypes, Option } from "@/lib/types";
import {
  ConnectionProviderProps,
  DiscordNodeType,
  SlackNodeType,
  useNodeConnections,
} from "@/providers/connections-provider";
import React, { useCallback } from "react";
import { postContentToWebhook } from "../../../connections/_actions/discord-action";
import { usePathname } from "next/navigation";
import { onCreateNodeTemplate } from "../../_actions/workflow-action";
import { toast } from "sonner";
import { onCreateNewPageInDatabase } from "../../../connections/_actions/notion-action";
import { postMessageToSlack } from "../../../connections/_actions/slack-action";
import { useEditor } from "@/providers/editor-provider";

type ActionButtonProps = {
  content: string;
  selectedSlackChannels: Option[];
  setSelectedSlackChannels: React.Dispatch<React.SetStateAction<Option[]>>;
};

const ActionButton = ({
  content,
  selectedSlackChannels,
  setSelectedSlackChannels,
}: ActionButtonProps) => {
  const pathname = usePathname();
  const { selectedNode } = useEditor().state.editor;
  const { nodeConnection } = useNodeConnections();
  const {
    discordNode,
    setDiscordNode,
    slackNode,
    setSlackNode,
    notionNode,
    setNotionNode,
  } = nodeConnection;

  const type = selectedNode.type as ConnectionTypes;
  const workflowId = pathname.split("/").pop()!;
  const nodeId = selectedNode.id;

  const onSendMessage = async (
    e: any,
    content: string,
    webhookUrl: string,
    type: ConnectionTypes,
    setContent: (val: any) => void
  ) => {
    const res = await postContentToWebhook(content, webhookUrl, type);

    if (res && res.message === "success") {
      if (type === "Discord") {
        setContent((prev: DiscordNodeType) => ({
          ...prev,
          content: "",
        }));
      } else if (type === "Slack") {
        setContent((prev: SlackNodeType) => ({
          ...prev,
          content: "",
        }));
      }
    }
  };

  const onStoreNotionContent = useCallback(async () => {
    const res = await onCreateNewPageInDatabase(
      nodeConnection.notionNode.databaseId,
      nodeConnection.notionNode.accessToken,
      nodeConnection.notionNode.content
    );

    if (res) {
      nodeConnection.setNotionNode((prev) => ({ ...prev, content: "" }));
    }
  }, [nodeConnection]);

  const onCreateLocalNodeTemplate = async () => {
    if (type === "Discord") {
      const res = await onCreateNodeTemplate({
        content,
        type,
        workflowId,
        nodeId,
      });

      if (res) toast(res);
    } else if (type === "Slack") {
      const res = await onCreateNodeTemplate({
        content,
        type,
        workflowId,
        nodeId,
      });

      if (res) toast(res);
    } else if (type === "Notion") {
      const res = await onCreateNodeTemplate({
        content,
        type,
        workflowId,
        accessToken: nodeConnection.notionNode.accessToken,
        notionDbId: nodeConnection.notionNode.databaseId,
        nodeId,
      });

      if (res) toast(res);
    }
  };

  const renderActionButton = () => {
    switch (type) {
      case "Discord":
        return (
          <>
            <Button
              variant="outline"
              onClick={(e) =>
                onSendMessage(
                  e,
                  discordNode.content,
                  discordNode.webhookURL,
                  type,
                  setDiscordNode
                )
              }
            >
              Test Message
            </Button>
            <Button variant="outline" onClick={onCreateLocalNodeTemplate}>
              Save Template
            </Button>
          </>
        );
      case "Notion":
        return (
          <>
            <Button variant="outline" onClick={onStoreNotionContent}>
              Test Message
            </Button>
            <Button variant="outline" onClick={onCreateLocalNodeTemplate}>
              Save Template
            </Button>
          </>
        );
      case "Slack":
        return (
          <>
            <Button
              variant="outline"
              onClick={(e) =>
                onSendMessage(
                  e,
                  discordNode.content,
                  discordNode.webhookURL,
                  type,
                  setSlackNode
                )
              }
            >
              Test Message
            </Button>
            <Button variant="outline" onClick={onCreateLocalNodeTemplate}>
              Save Template
            </Button>
          </>
        );
      default:
        return null;
    }
  };
  return renderActionButton();
};

export default ActionButton;
