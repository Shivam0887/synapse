import { ConnectionTypes } from "@/lib/types";
import { useEditor } from "@/providers/editor-provider";
import { useStore } from "@/providers/store-provider";
import ConnectionCard from "../../../connections/_components/connection-card";
import MultipleSelector from "@/components/ui/multiple-selector";
import { CONNECTIONS } from "@/lib/constant";

const ServiceConnection = ({
  workflowId,
  isConnected,
}: {
  workflowId: string;
  isConnected: boolean;
}) => {
  const { slackChannels, selectedSlackChannels, setSelectedSlackChannels } =
    useStore();
  const { selectedNode } = useEditor().state.editor;
  const connection = CONNECTIONS[selectedNode.data.title as ConnectionTypes];

  return (
    <>
      {connection?.title && (
        <ConnectionCard
          title={connection.title}
          icon={connection.image}
          description={connection.description}
          type={connection.title}
          connected={{ [connection.title]: isConnected }}
        />
      )}

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
