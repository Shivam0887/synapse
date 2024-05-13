import { Button } from "@/components/ui/button";
import { ConnectionTypes } from "@/lib/types";
import {
  DiscordNodeType,
  SlackNodeType,
  useNodeConnections,
} from "@/providers/connections-provider";
import { postContentToWebhook } from "../../../connections/_actions/discord-action";
import { usePathname } from "next/navigation";
import { useEditor } from "@/providers/editor-provider";
import NotionAction from "./actions/notion-action";

const ActionButton = () => {
  const pathname = usePathname();
  const { selectedNode } = useEditor().state.editor;
  const { nodeConnection } = useNodeConnections();
  const { discordNode, setDiscordNode, slackNode, setSlackNode } =
    nodeConnection;

  const type = selectedNode.type as ConnectionTypes;
  const workflowId = pathname.split("/").pop()!;

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
          </>
        );
      case "Notion":
        return (
          <div>
            <NotionAction workflowId={workflowId} isTesting={true} />
          </div>
        );
      case "Slack":
        return (
          <>
            <Button
              variant="outline"
              onClick={(e) =>
                onSendMessage(
                  e,
                  slackNode.content,
                  slackNode.webhookURL,
                  type,
                  setSlackNode
                )
              }
            >
              Test Message
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
