import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CustomNodeIcon from "./custom-node-icon";
import { WorkflowType } from "@/models/workflow-model";
import { getWorkflowNodes } from "../../_actions/workflow-action";

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

import ServiceTrigger from "./service-trigger";
import ServiceConnection from "./service-connection";
import ServiceInteraction from "./service-interaction";

import { SlackType } from "@/models/slack-model";
import { NotionType } from "@/models/notion-model";
import { DiscordType } from "@/models/discord-model";

import {
  fetchBotSlackChannels,
  onConnections,
  onDrapStart,
} from "@/lib/editor-utils";
import { CustomNodeTypes } from "@/lib/types";
import { CustomNodeDefaultValues } from "@/lib/constant";

export type WorkflowWithNodeTypes = {
  discordId: DiscordType[];
  notionId: NotionType[];
  slackId: SlackType[];
  googleDriveWatchTrigger: Pick<WorkflowType, "googleDriveWatchTrigger">;
};

const EditorSidebar = () => {
  const { state } = useEditor();
  const { nodes, selectedNode } = state.editor;
  const { nodeConnection } = useNodeConnections();
  const { googleFile, setSlackChannels } = useStore();
  const [workflow, setWorkflow] = useState<WorkflowWithNodeTypes>();
  const { editorId } = useParams() as { editorId: string };

  useEffect(() => {
    onConnections(nodeConnection, state, editorId);
    /* eslint-disable-next-line */
  }, [state.editor.selectedNode]);

  // useEffect(() => {
  //   if (nodeConnection.slackNode.slackAccessToken) {
  //     fetchBotSlackChannels(
  //       nodeConnection.slackNode.slackAccessToken,
  //       setSlackChannels
  //     );
  //   }
  // }, [nodeConnection, setSlackChannels]);

  useEffect(() => {
    (async () => {
      const response = await getWorkflowNodes(editorId);
      if (response) {
        const data = JSON.parse(response);
        if (data.success) {
          const workflow = data.workflow as WorkflowWithNodeTypes;
          setWorkflow(workflow);
        } else toast(data.error);
      }
    })();
  }, [editorId]);

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
                ([_, { type }]) =>
                  (!nodes.length && type === "Trigger") || nodes.length
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

          <Accordion type="multiple">
            <AccordionItem value="account">
              <AccordionTrigger className="!no-underline">
                Account
              </AccordionTrigger>
              <AccordionContent>
                {selectedNode.type && (
                  <ServiceConnection workflowId={editorId} />
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
                <ServiceInteraction
                  nodeConnection={nodeConnection}
                  workflow={workflow}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>
      </Tabs>
    </aside>
  );
};

export default EditorSidebar;
