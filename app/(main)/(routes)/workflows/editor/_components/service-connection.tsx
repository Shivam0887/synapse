import { ConnectionTypes } from "@/lib/types";
import { useEditor } from "@/providers/editor-provider";
import { useStore } from "@/providers/store-provider";
import ConnectionCard from "../../../connections/_components/connection-card";
import MultipleSelector from "@/components/ui/multiple-selector";
import { CONNECTIONS } from "@/lib/constant";
import { useEffect, useState } from "react";
import { getNodeData } from "../../_actions/workflow-action";
import { toast } from "sonner";

const ServiceConnection = ({ workflowId }: { workflowId: string }) => {
  const { slackChannels, selectedSlackChannels, setSelectedSlackChannels } =
    useStore();
  const { selectedNode } = useEditor().state.editor;
  const [isConnected, setIsConnected] = useState<boolean>(
    selectedNode.type === "Google Drive"
  );

  const connection = CONNECTIONS[selectedNode.data.title as ConnectionTypes];

  useEffect(() => {
    const getData = async () => {
      const response = await getNodeData(
        workflowId,
        selectedNode.id,
        selectedNode.type!
      );
      if (response) {
        const data = JSON.parse(response);
        if (data.success) setIsConnected(data.isConnected);
        else {
          if (data.message) toast.message(data.message);
          else toast.error(data.error);
        }
      }
    };

    if (
      selectedNode.type === "Discord" ||
      selectedNode.type === "Notion" ||
      selectedNode.type === "Slack"
    ) {
      getData();
    }
  }, [workflowId, selectedNode]);

  return (
    <>
      <ConnectionCard
        title={connection.title}
        icon={connection.image}
        description={connection.description}
        type={connection.title}
        connected={{ [connection.title]: isConnected }}
      />

      {/* {selectedNode.type === "Slack" && isConnected && (
        <div className="p-6">
          {slackChannels.length ? (
            <MultipleSelector
              value={selectedSlackChannels}
              onChange={setSelectedSlackChannels}
              defaultOptions={slackChannels}
              placeholder="Select channels"
              emptyIndicator={
                <p className="text-center text-lg leading-10 dark:text-gray-400">
                  No results found.
                </p>
              }
            />
          ) : (
            <p>
              No slack channels found. Please add your Slack bot to your Slack
              channels.
            </p>
          )}
        </div>
      )} */}
    </>
  );
};

export default ServiceConnection;
