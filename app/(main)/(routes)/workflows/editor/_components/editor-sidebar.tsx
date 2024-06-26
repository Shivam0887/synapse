import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CustomNodeIcon from "./custom-node-icon";
import {
  changeTrigger,
  getCurrentTrigger,
  getNodeData,
} from "../../_actions/workflow-action";

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

import { onConnections, onDrapStart } from "@/lib/editor-utils";
import { ConnectionTypes, CustomNodeTypes } from "@/lib/types";
import { CustomNodeDefaultValues } from "@/lib/constant";
import ServiceAction from "./actions/service-action";
import { Crown, Info } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import ActionTooltip from "@/components/globals/action-tooltip";
import { Button } from "@/components/ui/button";
import { getTrigger } from "../../../connections/_actions/connection-action";
import { useBilling } from "@/providers/billing-provider";

type EditorSidebarProps = {
  isPublished: boolean;
};

const EditorSidebar = ({ isPublished }: EditorSidebarProps) => {
  const { tier } = useBilling();
  const { editorId } = useParams() as { editorId: string };

  const { nodes, selectedNode } = useEditor().state.editor;
  const { nodeConnection } = useNodeConnections();

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [parentTrigger, setParentTrigger] = useState({type: "Google Drive", id: ""});

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

  useEffect(() => {
    (async () => {
      const response = await getCurrentTrigger(editorId);
      if (response) {
        const data = JSON.parse(response);
        setParentTrigger({ id: data.id, type: data.type });
      }
    })();
  }, [editorId]);

  const onChangeTrigger = async () => {
    const nodeType = selectedNode.type as ConnectionTypes;
    const nodeId = selectedNode.id;

    if (nodeType === "Discord" || nodeType === "Slack") {
      (async () => {
        const response = await getTrigger(editorId, nodeId, nodeType);
        if (response) {
          const data = JSON.parse(response);
          if (data.success) {
            if (!data.data.trigger) {
              toast.error("please set trigger");
            } else {
              const response = await changeTrigger(editorId, nodeId, nodeType);
              if (response) {
                const data = JSON.parse(response);
                setParentTrigger(data);
                toast.success("trigger changed successfully!");
              }
            }
          } else {
            if (data.message) toast.message(data.message);
            else toast.error(data.error);
          }
        }
      })();
    } else if (nodeType === "Google Drive") {
      const response = await changeTrigger(editorId, nodeId, nodeType);
      if (response) {
        const data = JSON.parse(response);
        setParentTrigger(data);
        if (data.type === "None")
          toast.message("please set the trigger for Google Drive node");
        else toast.success("trigger changed successfully!");
      }
    }
  };

  return (
    <aside>
      <Tabs defaultValue="actions">
        <TabsList className="bg-transparent">
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <Separator />
        <TabsContent
          value="actions"
          className="relative h-screen overflow-y-scroll"
        >
          <>
            {isPublished && (
              <div className="absolute h-[70%] backdrop-blur-[2px] font-medium w-full z-50 flex items-center justify-center">
                Unpublish the workflow to continue!
              </div>
            )}
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
                    draggable={key === "AI" ? tier === "Premium Plan" : true}
                    className="w-full cursor-grab border-black dark:border-neutral-700 dark:bg-neutral-900"
                    onDragStart={(e) => onDrapStart(e, key as CustomNodeTypes)}
                  >
                    <CardHeader className="flex flex-row gap-4 p-4 items-center">
                      <div>
                        <CustomNodeIcon type={key as CustomNodeTypes} />
                      </div>
                      <div>
                        <CardTitle className="select-none text-base">
                          {key}
                        </CardTitle>
                        <CardDescription className="select-none">
                          {description}
                        </CardDescription>
                      </div>
                      {key === "AI" && tier !== "Premium Plan" && (
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
                ))}
            </div>
          </>
        </TabsContent>
        <TabsContent
          value="settings"
          className="relative h-[70vh] overflow-y-scroll flex flex-col gap-4 p-4"
        >
          <>
            {isPublished && (
              <div className="absolute h-full w-full font-medium z-50 backdrop-blur-[2px] flex items-center justify-center">
                Unpublish the workflow to continue!
              </div>
            )}
            <div className="px-2 py-4 text-center space-y-4 text-xl font-bold">
              <p>{selectedNode.data.title}</p>
              {!(
                selectedNode.type === "Notion" ||
                selectedNode.type === "None" ||
                selectedNode.type === "AI"
              ) && (
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
          </>
        </TabsContent>
      </Tabs>
    </aside>
  );
};

export default EditorSidebar;
