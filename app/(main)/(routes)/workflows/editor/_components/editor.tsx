"use client";

import { CustomNodeType, CustomNodeTypes } from "@/lib/types";
import { useEditor } from "@/providers/editor-provider";
import { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  EdgeChange,
  MiniMap,
  NodeChange,
  ReactFlowInstance,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
} from "reactflow";
import "reactflow/dist/style.css";
import CustomNode from "./custom-node";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { toast } from "sonner";
import { v4 } from "uuid";
import { useParams } from "next/navigation";
import { CustomNodeDefaultValues } from "@/lib/constant";
import WorkflowLoading from "./workflow-loading";
import FlowInstance from "./flow-instance";
import EditorSidebar from "./editor-sidebar";
import { onGetNodesEdges } from "../../_actions/workflow-action";

type CustomEdgeType = { id: string; source: string; target: string };

const Editor = () => {
  const { dispatch, state } = useEditor();
  const { editorId } = useParams() as { editorId: string };

  const [nodes, setNodes] = useState<CustomNodeType[]>([]);
  const [edges, setEdges] = useState<CustomEdgeType[]>([]);
  const [isWorkflowLoading, setIsWorkflowLoading] = useState<boolean>(false);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance>();

  const nodeTypes = useMemo(
    () => ({
      Email: CustomNode,
      Condition: CustomNode,
      AI: CustomNode,
      Slack: CustomNode,
      "Google Drive": CustomNode,
      Notion: CustomNode,
      "Custom Webhook": CustomNode,
      "Google Calendar": CustomNode,
      Trigger: CustomNode,
      Action: CustomNode,
      Discord: CustomNode,
      Wait: CustomNode,
    }),
    []
  );

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();

      const type = e.dataTransfer.getData("application/reactflow") as CustomNodeTypes | undefined;
      if (!type) return;

      const triggerAlreadyExists = state.editor.nodes.find((node) => node.type === "Trigger");
      if (type === "Trigger" && triggerAlreadyExists) {
        toast("Only one trigger can be added to the automation at the moment.");
        return;
      }

      if (!reactFlowInstance) return;
      
      const position = reactFlowInstance.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      const newNode: CustomNodeType = {
        id: v4(),
        type,
        position,
        data: {
          title: type as string,
          description: CustomNodeDefaultValues[type].description,
          completed: false,
          current: false,
          metadata: {},
          type,
        },
      };

      reactFlowInstance.setNodes((nodes) => nodes.concat(newNode));
    },
    [state, reactFlowInstance]
  );

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const onNodesChange = useCallback((changes: NodeChange[]) =>
    setNodes((nodes) => {
      const updatedNodes = applyNodeChanges(changes, nodes) as CustomNodeType[];
      return updatedNodes;
    }),
    [setNodes]
  );

  const onEdgesChange = useCallback((changes: EdgeChange[]) => 
    setEdges((edges) => applyEdgeChanges(changes, edges)),
    [setEdges]
  );

  const onConnect = useCallback((connection: Connection) => 
    setEdges((edges) => addEdge(connection, edges)),
    [setEdges]
  );

  const onClick = (e: React.MouseEvent<HTMLDivElement> | undefined) => {
    e?.stopPropagation();
    dispatch({
      type: "SELECTED_ELEMENT",
      payload: {
        node: {
          data: {
            completed: false,
            current: false,
            description: "",
            metadata: {},
            title: "",
            type: "Trigger",
          },
          id: "",
          position: { x: 0, y: 0 },
          type: "Trigger",
        },
      },
    });
  };

  const onGetWorkFlow = useCallback(async () => {
    setIsWorkflowLoading(true);
    const response = await onGetNodesEdges({ flowId: editorId });
    if (response.status && response.data) {
      const _edges = JSON.parse(JSON.parse(response.data).edges) as CustomEdgeType[];
      const _nodes = JSON.parse(JSON.parse(response.data).nodes) as CustomNodeType[];

      setEdges(_edges);
      setNodes(_nodes);
    }
    setIsWorkflowLoading(false);
  }, [editorId]);

  useEffect(() => {
    dispatch({ type: "LOAD_DATA", payload: { edges, nodes } });
  }, [nodes, edges, dispatch]);

  useEffect(() => {
    onGetWorkFlow();
  }, [onGetWorkFlow]);

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={70}>
        <div className="flex w-full h-full items-center justify-center">
          <div className="relative" style={{ width: "100%", height: "100%" }}>
            {isWorkflowLoading ? (
              <WorkflowLoading />
            ) : (
              <ReactFlow
                nodes={state.editor.nodes}
                edges={state.editor.edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onClick={onClick}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onInit={setReactFlowInstance}
                onError={(_, message: string) => { toast(message) }}
                fitView
                maxZoom={1.5}
              >
                <Background
                  gap={12}
                  size={1}
                  variant={BackgroundVariant.Dots}
                />
                <MiniMap
                  className="!bg-background"
                  position="bottom-left"
                  zoomable
                  pannable
                  offsetScale={2}
                />
                <Controls showZoom={true} position="top-left" />
              </ReactFlow>
            )}
          </div>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={30} className="relative min-w-72 max-w-md">
        {isWorkflowLoading ? (
          <WorkflowLoading />
        ) : (
          <FlowInstance>
            <EditorSidebar />
          </FlowInstance>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default Editor;
