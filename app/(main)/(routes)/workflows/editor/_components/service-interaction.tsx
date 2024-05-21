import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { onContentChange } from "@/lib/editor-utils";
import { ConnectionTypes } from "@/lib/types";
import { ConnectionProviderProps } from "@/providers/connections-provider";
import { useEditor } from "@/providers/editor-provider";
import ActionButton from "./action-button";
import { Label } from "@/components/ui/label";
import { Ghost } from "lucide-react";

type ServiceInteractionProps = {
  nodeConnection: ConnectionProviderProps;
  isConnected: boolean;
  nodeType: ConnectionTypes;
};

const ServiceInteraction = ({
  nodeConnection,
  isConnected,
  nodeType,
}: ServiceInteractionProps) => {
  const { selectedNode } = useEditor().state.editor;
  const { discordNode, slackNode, notionNode } = nodeConnection;

  if (!isConnected) return <p>Not Connected</p>;

  const content =
    nodeType === "Discord"
      ? discordNode.content
      : nodeType === "Notion"
      ? notionNode.content
      : nodeType === "Slack"
      ? slackNode.content
      : "";

  return (
    <Card className="h-full">
      {selectedNode.type === "Discord" && (
        <CardHeader>
          <CardTitle>{discordNode.guildName}</CardTitle>
          <CardDescription>{discordNode.channelName}</CardDescription>
        </CardHeader>
      )}
      <CardContent className="max-h-96 overflow-y-scroll">
        {(selectedNode.type === "Discord" || selectedNode.type === "Slack") && (
          <div className="flex flex-col gap-3 py-3">
            <Label htmlFor="testMessage">Test Message</Label>
            <Input
              type="text"
              id="testMessage"
              value={content}
              onChange={(e) => onContentChange(e, nodeConnection, nodeType)}
            />
          </div>
        )}

        {selectedNode.type === "Google Drive" ? (
          <div className="mt-4 flex flex-col gap-2 items-center">
            <Ghost />
            <p className="text-center">Not available</p>
          </div>
        ) : (
          <div className="flex flex-col mt-3 gap-3">
            <ActionButton />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceInteraction;
