"use client";

import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CustomNodeIcon from "./custom-node-icon";

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

import { CustomNodeDefaultValues } from "@/lib/constants";
import ServiceAction from "./actions/service-action";
import { Crown, Info } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import ActionTooltip from "@/components/globals/action-tooltip";
import { Button } from "@/components/ui/button";
import { useBilling } from "@/providers/billing-provider";
import {
  changeTrigger,
  getCurrentTrigger,
  getConnectionStatus,
} from "@/actions/workflow.actions";
import { isConnectionType, isValidTrigger, typedEntries } from "@/lib/utils";
import { getDiscordMetaData } from "@/actions/discord.actions";
import { getSlackMetaData } from "@/actions/slack.actions";
import { CustomNodeType } from "@/lib/types";

type EditorSidebarControllerProps = {
  isPublished: boolean;
};

type ParentTriggerType = {
  type: Exclude<CustomNodeType, "AI" | "Notion">;
  id: string;
};

const EditorSidebarController = ({
  isPublished,
}: EditorSidebarControllerProps) => {
  const { tier } = useBilling();
  const { editorId } = useParams() as { editorId: string };

  const { selectedNode } = useEditor().editorState.editor;
  const { setDiscordNode, setSlackNode } = useNodeConnections();

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [parentTrigger, setParentTrigger] = useState<ParentTriggerType>({
    type: "Google Drive",
    id: "",
  });

  useEffect(() => {
    (async () => {
      if (selectedNode.type === "Discord") {
        const res = await getDiscordMetaData(selectedNode.id);
        if (res.success) {
          const connection = res.data;
          setDiscordNode({
            webhookURL: connection.webhookUrl!,
            content: "",
            guildName: connection.guildName!,
            channelName: connection.channelName!,
          });
        }
      } else if (selectedNode.type === "Slack") {
        const res = await getSlackMetaData(selectedNode.id);
        if (res.success) {
          const connection = res.data;
          setSlackNode({
            channelName: connection.channelName,
            teamName: connection.teamName,
            content: "",
            webhookURL: connection.webhookUrl!,
          });
        }
      }
    })();
  }, [selectedNode.id, selectedNode.type, setDiscordNode, setSlackNode]);

  useEffect(() => {
    (async () => {
      if (isConnectionType(selectedNode.type)) {
        const response = await getConnectionStatus(
          editorId,
          selectedNode.id,
          selectedNode.type
        );

        if (!response.success) toast.error(response.error);
        else setIsConnected(response.data);
      }
    })();
  }, [editorId, selectedNode.id, selectedNode.type]);

  useEffect(() => {
    (async () => {
      const response = await getCurrentTrigger(editorId);
      if (!response.success) {
        toast.error(response.error);
        return;
      }

      const data = response.data;
      setParentTrigger({ id: data.id, type: data.type });
    })();
  }, [editorId]);

  const onChangeTrigger = async () => {
    const nodeType = selectedNode.type;
    const nodeId = selectedNode.id;

    if (isConnectionType(nodeType) && nodeType !== "Notion") {
      const response = await changeTrigger(editorId, nodeId, nodeType);
      if (!response.success) {
        toast.error(response.error);
        return;
      }

      const data = response.data;
      setParentTrigger(data);
      if (data.type === "None")
        toast.message("please set the trigger for Google Drive node");
      else toast.success("trigger changed successfully!");
    }
  };

  const onDrapStart = (
    e: React.DragEvent<HTMLDivElement>,
    nodeType: CustomNodeType
  ) => {
    e.dataTransfer.setData("application/reactflow", nodeType);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside className="h-full">
      <Tabs defaultValue="actions" className="h-full">
        <TabsList className="bg-transparent">
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <Separator />
        <TabsContent
          value="actions"
          className="relative h-full overflow-y-auto"
        >
          <>
            {isPublished && (
              <div className="absolute inset-0 backdrop-blur-[2px] font-medium z-50 flex items-center justify-center">
                Unpublish the workflow to continue!
              </div>
            )}
            <div className="flex flex-col gap-4 p-4 pb-56">
              {typedEntries(CustomNodeDefaultValues).map(
                ([key, { description }]) => (
                  <Card
                    key={key}
                    draggable={key === "AI" ? tier === "Premium" : true}
                    className="w-full cursor-grab border-black dark:border-neutral-700 dark:bg-neutral-900"
                    onDragStart={(e) => onDrapStart(e, key)}
                  >
                    <CardHeader className="flex flex-row gap-4 p-4 items-center">
                      <div>
                        <CustomNodeIcon type={key} />
                      </div>
                      <div>
                        <CardTitle className="select-none text-base">
                          {key}
                        </CardTitle>
                        <CardDescription className="select-none">
                          {description}
                        </CardDescription>
                      </div>
                      {key === "AI" && tier !== "Premium" && (
                        <TooltipProvider>
                          <ActionTooltip
                            label={
                              <Crown className="cursor-pointer stroke-yellow-400 fill-yellow-400" />
                            }
                          >
                            Subscribe to Premium Plan
                          </ActionTooltip>
                        </TooltipProvider>
                      )}
                    </CardHeader>
                  </Card>
                )
              )}
            </div>
          </>
        </TabsContent>
        <TabsContent
          value="settings"
          className="relative h-full overflow-y-auto flex flex-col p-4"
        >
          <>
            {isPublished && (
              <div className="absolute inset-0 font-medium z-50 backdrop-blur-[2px] flex items-center justify-center">
                Unpublish the workflow to continue!
              </div>
            )}
            <div className="px-2 py-4 text-center space-y-4 text-xl font-bold">
              <p>{selectedNode.data.title}</p>
              {isValidTrigger(selectedNode.type) && (
                <div className="space-y-3">
                  <div className="text-sm flex flex-col justify-center text-neutral-500">
                    <div className="flex gap-2 items-center justify-center">
                      Current Trigger: {parentTrigger.type}
                      <TooltipProvider>
                        <ActionTooltip
                          label={<Info className="w-4 h-4 cursor-pointer" />}
                          side="bottom"
                        >
                          <p className="text-xs">
                            The node which initiates the workflow.
                          </p>
                        </ActionTooltip>
                      </TooltipProvider>
                    </div>
                    {parentTrigger.id && <p>ID:{parentTrigger.id}</p>}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onChangeTrigger}
                  >
                    Change trigger
                  </Button>
                </div>
              )}
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
                    {!(
                      selectedNode.type === undefined ||
                      selectedNode.type === "AI"
                    ) && (
                      <ServiceConnection
                        isConnected={isConnected}
                        selectedNodeType={selectedNode.type}
                      />
                    )}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="trigger">
                  <AccordionTrigger>Trigger</AccordionTrigger>
                  <AccordionContent>
                    <ServiceTrigger
                      workflowId={editorId}
                      parentTrigger={parentTrigger}
                    />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="action">
                  <AccordionTrigger>Action</AccordionTrigger>
                  <AccordionContent>
                    <ServiceAction
                      workflowId={editorId}
                      parentTrigger={parentTrigger}
                    />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="test">
                  <AccordionTrigger>Test</AccordionTrigger>
                  <AccordionContent className="mb-10">
                    {isConnectionType(selectedNode.type) && (
                      <ServiceInteraction isConnected={isConnected} />
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </>
        </TabsContent>
      </Tabs>
    </aside>
  );
};

export default EditorSidebarController;
