import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CustomNodeIcon from "./custom-node-icon";
import { getNodeData } from "../../_actions/workflow-action";

import { useStore } from "@/providers/store-provider";
import { useEditor } from "@/providers/editor-provider";
import { useNodeConnections } from "@/providers/connections-provider";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ServiceTrigger from "./triggers/service-trigger";
import ServiceConnection from "./service-connection";
import ServiceInteraction from "./service-interaction";

import {
  fetchBotSlackChannels,
  onConnections,
  onDrapStart,
} from "@/lib/editor-utils";
import { ConnectionTypes, CustomNodeTypes } from "@/lib/types";
import { CustomNodeDefaultValues } from "@/lib/constant";
import ServiceAction from "./actions/service-action";

const EditorSidebar = () => {
  const { nodes, selectedNode } = useEditor().state.editor;
  const { nodeConnection } = useNodeConnections();
  const { googleFile } = useStore();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const { editorId } = useParams() as { editorId: string };
  const isGoogleDriveNodeExists = nodes.some(
    ({ type }) => type === "Google Drive"
  );

  useEffect(() => {
    if (
      selectedNode.type === "Discord" ||
      selectedNode.type === "Notion" ||
      selectedNode.type === "Slack"
    )
      onConnections(
        nodeConnection,
        selectedNode.id,
        editorId,
        selectedNode.type as ConnectionTypes
      );
    // eslint-disable-next-line
  }, [editorId, selectedNode.id, selectedNode.type]);

  // useEffect(() => {
  //   if (nodeConnection.slackNode.slackAccessToken) {
  //     fetchBotSlackChannels(
  //       nodeConnection.slackNode.slackAccessToken,
  //       setSlackChannels
  //     );
  //   }
  // }, [nodeConnection, setSlackChannels]);

  useEffect(() => {
    if (
      selectedNode.type === "Discord" ||
      selectedNode.type === "Notion" ||
      selectedNode.type === "Slack" ||
      selectedNode.type === "Google Drive"
    ) {
      (async () => {
        const response = await getNodeData(
          editorId,
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
      })();
    }
  }, [editorId, selectedNode.id, selectedNode.type]);

  return (
    <aside>
      <Tabs defaultValue="actions">
        <TabsList className="bg-transparent">
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <Separator />
        <TabsContent value="actions" className="h-screen overflow-y-scroll">
          <div className="flex flex-col gap-4 p-4 pb-56">
            {Object.entries(CustomNodeDefaultValues)
              .filter(
                ([key]) =>
                  !nodes.length ||
                  !(
                    !!nodes.length &&
                    key === "Google Drive" &&
                    isGoogleDriveNodeExists
                  )
              )
              .map(([key, { description }]) => (
                <Card
                  key={key}
                  draggable
                  className="w-full cursor-grab border-black dark:border-neutral-700 dark:bg-neutral-900"
                  onDragStart={(e) => onDrapStart(e, key as CustomNodeTypes)}
                >
                  <CardHeader className="flex flex-row gap-4 p-4 items-center">
                    <div>
                      <CustomNodeIcon type={key as CustomNodeTypes} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{key}</CardTitle>
                      <CardDescription>{description}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              ))}
          </div>
        </TabsContent>
        <TabsContent
          value="settings"
          className="h-[70vh] overflow-y-scroll flex flex-col gap-4 p-4"
        >
          <div className="px-2 py-4 text-center text-xl font-bold">
            {selectedNode.data.title}
          </div>

          {selectedNode.type === "None" ? (
            <div className="h-full flex items-center justify-center w-full">
              Please select a node to continue.
            </div>
          ) : (
            <Accordion type="multiple">
              <AccordionItem value="account">
                <AccordionTrigger className="!no-underline">
                  Account
                </AccordionTrigger>
                <AccordionContent>
                  {selectedNode.type && (
                    <ServiceConnection
                      workflowId={editorId}
                      isConnected={isConnected}
                    />
                  )}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="trigger">
                <AccordionTrigger>Trigger</AccordionTrigger>
                <AccordionContent>
                  <ServiceTrigger workflowId={editorId} />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="action">
                <AccordionTrigger>Action</AccordionTrigger>
                <AccordionContent>
                  <ServiceAction workflowId={editorId} />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="test">
                <AccordionTrigger>Test</AccordionTrigger>
                <AccordionContent>
                  <ServiceInteraction
                    nodeConnection={nodeConnection}
                    isConnected={isConnected}
                    nodeType={selectedNode.type as ConnectionTypes}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </TabsContent>
      </Tabs>
    </aside>
  );
};

export default EditorSidebar;
