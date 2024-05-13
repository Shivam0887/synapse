import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { onContentChange } from "@/lib/editor-utils";
import { ConnectionTypes, Option, nodeMapper } from "@/lib/types";
import { ConnectionProviderProps } from "@/providers/connections-provider";
import { useEditor } from "@/providers/editor-provider";
import { useStore } from "@/providers/store-provider";
import GoogleFileDetails from "./google-file-details";
import ActionButton from "./action-button";
import { useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { getFileMetaData } from "../../../connections/_actions/google-action";
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
  const { googleFile, setGoogleFile } = useStore();

  const { selectedNode } = useEditor().state.editor;
  const { discordNode, slackNode, notionNode } = nodeConnection;

  useEffect(() => {
    const reqGoogle = async () => {
      const res = await axios.get("/api/drive");
      if (res) {
        toast.message("File fetched");
        setGoogleFile(res.data.message.files[0]);
      } else {
        toast.error("Something went wrong");
      }
    };

    // reqGoogle();
  }, [setGoogleFile]);

  useEffect(() => {
    const fetchFileMetaData = async () => {
      await getFileMetaData();
    };
    // fetchFileMetaData();
  }, []);

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
        {Object.keys(googleFile).length > 0 && nodeType !== "Google Drive" && (
          <Card className="w-full">
            <CardHeader className="px-2 py-3">
              <div className="flex flex-col gap-4">
                <CardTitle>Drive File</CardTitle>
              </div>
              <div className="flex flex-wrap gap-2">
                <GoogleFileDetails
                  nodeConnection={nodeConnection}
                  nodeType="discordNode"
                  googleFile={googleFile}
                />
              </div>
            </CardHeader>
          </Card>
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
