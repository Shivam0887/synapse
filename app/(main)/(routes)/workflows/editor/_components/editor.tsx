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
import {
  changeTrigger,
  deleteNode,
  onGetNodesEdges,
} from "../../_actions/workflow-action";
import { addConnection } from "../../../connections/_actions/connection-action";

type CustomEdgeType = { id: string; source: string; target: string };

const Editor = () => {
  const { dispatch, state } = useEditor();
  const { editorId } = useParams() as { editorId: string };
  const [isPublished, setIsPublished] = useState(false);

  const [nodes, setNodes] = useState<CustomNodeType[]>([]);
  const [edges, setEdges] = useState<CustomEdgeType[]>([]);
  const [isWorkflowLoading, setIsWorkflowLoading] = useState<boolean>(false);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance>();

  const nodeTypes = useMemo(
    () => ({
      AI: CustomNode,
      Slack: CustomNode,
      "Google Drive": CustomNode,
      Notion: CustomNode,
      "Google Calendar": CustomNode,
      Discord: CustomNode,
      Wait: CustomNode,
    }),
    []
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();

      const type = e.dataTransfer.getData("application/reactflow") as
        | CustomNodeTypes
        | undefined;
      if (!type) return;

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

      toast.warning(<p>save the workflow after node insertion</p>);
    },
    [reactFlowInstance]
  );

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nodes) => {
        const updatedNodes = applyNodeChanges(
          changes,
          nodes
        ) as CustomNodeType[];
        return updatedNodes;
      }),
    [setNodes]
  );

  const onNodesDelete = useCallback(
    async (nodes: CustomNodeType[]) => {
      const nodeId = nodes[0].id;
      const nodeType = nodes[0].type;

      const response = await deleteNode(editorId, nodeId, nodeType!);
      if (response) {
        const data = JSON.parse(response);
        if (data.success) {
          await changeTrigger(editorId, "", "None");

          toast.success(data.data);
          setTimeout(() => {
            toast.warning(<p>save the workflow after node deletion</p>);
          }, 1000);

          setTimeout(() => {
            toast.warning(
              <p>Current trigger is not set to a valid trigger.</p>
            );
          }, 1000);
        } else {
          if (data.message) toast.message(data.message);
          else toast.error(data.error);
        }
      }
    },
    [editorId]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((edges) => applyEdgeChanges(changes, edges));

      if (changes[0].type === "remove") {
        const edgeId = changes[0].id;
        const edge = edges.find((edge) => edge.id === edgeId);
        const sourceNodeType = nodes.find((node) => node.id === edge?.source)
          ?.data.type;
        const targetNodeType = nodes.find((node) => node.id === edge?.target)
          ?.data.type;

        //saving the edge connection changes in DB.
        if (sourceNodeType && targetNodeType && edge?.source && edge?.target) {
          addConnection({
            sourceId: edge.source,
            targetId: edge.target,
            sourceNodeType,
            targetNodeType,
            workflowId: editorId,
            type: "remove",
          })
            .then((response) => {
              if (response) {
                const data = JSON.parse(response);
                if (!data.success) {
                  if (data.message) toast.message(data.message);
                  else {
                    toast.error(data.error);
                  }
                }
              }
            })
            .catch((error: any) => {
              toast.error(error?.messsage);
            });
        }
      }
    },
    [setEdges, nodes, edges, editorId]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const sourceNodeType = nodes.find((node) => node.id === connection.source)
        ?.data.type;
      const targetNodeType = nodes.find((node) => node.id === connection.target)
        ?.data.type;

      setEdges((edges) => addEdge(connection, edges));

      //saving the edge connection changes in DB.
      if (
        sourceNodeType &&
        targetNodeType &&
        connection.source &&
        connection.target
      ) {
        addConnection({
          sourceId: connection.source,
          targetId: connection.target,
          sourceNodeType,
          targetNodeType,
          workflowId: editorId,
          type: "add",
        })
          .then((response) => {
            if (response) {
              const data = JSON.parse(response);
              if (!data.success) {
                if (data.message) toast.message(data.message);
                else {
                  toast.error(data.error);
                  onEdgesChange([
                    {
                      type: "remove",
                      id: `reactflow__edge-${connection.source}-${connection.target}`,
                    },
                  ]);
                }
              }
            }
          })
          .catch((error: any) => {
            toast.error(error?.messsage);
          });
      }
    },
    [setEdges, editorId, nodes, onEdgesChange]
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
            type: "None",
          },
          id: "",
          position: { x: 0, y: 0 },
          type: "None",
        },
      },
    });
  };

  const onGetWorkFlow = useCallback(async () => {
    setIsWorkflowLoading(true);
    const response = await onGetNodesEdges({ flowId: editorId });
    if (response) {
      const data = JSON.parse(response);
      if (data.status) {
        const _edges = data.data.edges as CustomEdgeType[];
        const _nodes = data.data.nodes as CustomNodeType[];

        setEdges(_edges);
        setNodes(_nodes);
      } else toast.error(data.error);
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
                onNodesDelete={onNodesDelete}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onClick={onClick}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onInit={setReactFlowInstance}
                defaultEdgeOptions={{ animated: true }}
                onError={(_, message: string) => {
                  toast(message);
                }}
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
          <FlowInstance
            isPublished={isPublished}
            setIsPublished={setIsPublished}
          >
            <EditorSidebar isPublished={isPublished} />
          </FlowInstance>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default Editor;
