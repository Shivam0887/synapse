import { ConnectionTypes } from "@/lib/types";
import { useEditor } from "@/providers/editor-provider";
import ConnectionCard from "../../../connections/_components/connection-card";
import { CONNECTIONS } from "@/lib/constant";

const ServiceConnection = ({
  workflowId,
  isConnected,
}: {
  workflowId: string;
  isConnected: boolean;
}) => {
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
    </>
  );
};

export default ServiceConnection;
