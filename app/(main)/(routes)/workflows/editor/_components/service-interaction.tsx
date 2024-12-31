"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useEditor } from "@/providers/editor-provider";
import { useNodeConnections } from "@/providers/connections-provider";

import { toast } from "sonner";
import { Ghost } from "lucide-react";
import { usePathname } from "next/navigation";

import { postContentToWebhook } from "@/actions/utils.actions";
import NotionActionForm from "@/components/forms/notion-action-form";

type ServiceInteractionProps = {
  isConnected: boolean;
};

const ServiceInteraction = ({ isConnected }: ServiceInteractionProps) => {
  const pathname = usePathname();
  const { selectedNode } = useEditor().editorState.editor;
  const { discordNode, slackNode, setSlackNode, setDiscordNode } = useNodeConnections();

  if (!isConnected) return <p>Not Connected</p>;

  const nodeType = selectedNode.type;
  const workflowId = pathname.split("/").pop()!;

  const content =
    nodeType === "Discord" ? discordNode.content : slackNode.content;
  const webhookURL =
    nodeType === "Discord" ? discordNode.webhookURL : slackNode.webhookURL;

  const sendMessage = async (type: "Slack" | "Discord") => {
    const response = await postContentToWebhook(content, webhookURL, type);
    if (!response.success) {
      toast.error(response.error);
      return;
    }

    toast.success(response.data);

    if (nodeType === "Discord") {
      setDiscordNode((prev) => ({
        ...prev,
        content: "",
      }));
    } else {
      setSlackNode((prev) => ({
        ...prev,
        content: "",
      }));
    }
  };

  const onContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (nodeType === "Slack") {
      setSlackNode((prev) => ({
        ...prev,
        content: e.target.value,
      }));
    } else {
      setDiscordNode((prev) => ({
        ...prev,
        content: e.target.value,
      }));
    }
  };

  return (
    <Card>
      {(nodeType === "Discord" || nodeType === "Slack") && (
        <CardHeader>
          <CardTitle>
            {nodeType === "Slack" ? slackNode.teamName : discordNode.guildName}
          </CardTitle>
          <CardDescription>
            {nodeType === "Slack"
              ? slackNode.channelName
              : discordNode.channelName}
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className="mt-2">
        {(nodeType === "Discord" || nodeType === "Slack") && (
          <div className="flex flex-col gap-3 py-3">
            <Label htmlFor="testMessage">Test Message</Label>
            <Input
              type="text"
              id="testMessage"
              value={content}
              onChange={onContentChange}
            />
          </div>
        )}

        {nodeType === "Google Drive" ? (
          <div className="mt-4 flex flex-col gap-2 items-center">
            <Ghost />
            <p className="text-center">Not available</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {nodeType === "Discord" || nodeType === "Slack" ? (
              <Button variant="outline" onClick={() => sendMessage(nodeType)}>
                Test Message
              </Button>
            ) : nodeType === "Notion" ? (
              <NotionActionForm
                workflowId={workflowId}
                isTesting={true}
                trigger="0"
              />
            ) : (
              <></>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceInteraction;
