"use client";

import { CustomNode, CustomNodeType } from "@/lib/types";
import { useEditor } from "@/providers/editor-provider";
import {
  RefAttributes,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ReactFlow,
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
  Edge,
  ReactFlowProps,
  EdgeRemoveChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { toast } from "sonner";
import { v4 } from "uuid";
import { useParams } from "next/navigation";
import { CustomNodeDefaultValues } from "@/lib/constants";
import WorkflowLoading from "@/components/workflow-loading";
import EditorSidebar from "./editor-sidebar";
import EditorSidebarController from "./editor-sidebar-controller";
import { useBilling } from "@/providers/billing-provider";
import { useStore } from "@/providers/store-provider";
import {
  deleteNode,
  getNodesEdges,
  saveWorkflow,
  updateNodeId,
} from "@/actions/workflow.actions";
import { addConnection } from "@/actions/connection.actions";
import CustomEditorNode from "./custom-editor-node";

const nodeTypes = {
  AI: CustomEditorNode,
  Slack: CustomEditorNode,
  "Google Drive": CustomEditorNode,
  Notion: CustomEditorNode,
  "Google Calendar": CustomEditorNode,
  Discord: CustomEditorNode,
};

const CustomReactFlow = (
  props: ReactFlowProps<CustomNode, Edge> & RefAttributes<HTMLDivElement>
) => {
  return <ReactFlow {...props} />;
};

const Editor = () => {
  const { editorDispatch, editorState } = useEditor();
  const { editorId } = useParams() as { editorId: string };

  const { tier } = useBilling();
  const { setIsAutoSaving, isChecked } = useStore();

  const [isPublished, setIsPublished] = useState(false);
  const [nodes, setNodes] = useState<CustomNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isWorkflowLoading, setIsWorkflowLoading] = useState<boolean>(false);

  const reactFlowInstanceRef = useRef<
    ReactFlowInstance<CustomNode, Edge> | undefined
  >(undefined);

  const isPremiumUser = useMemo(() => tier === "Premium", [tier]);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const onDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();

      const type = e.dataTransfer.getData("application/reactflow") as
        | Exclude<CustomNodeType, "None">
        | undefined;

      if (!type) return;

      if (!reactFlowInstanceRef.current) return;

      const position = reactFlowInstanceRef.current.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      const newNode: CustomNode = {
        id: v4(),
        type,
        position,
        data: {
          title: type,
          description: CustomNodeDefaultValues[type].description,
          completed: false,
          current: false,
        },
      };

      reactFlowInstanceRef.current.addNodes(newNode);

      if (!isPremiumUser)
        toast.warning("save the workflow after node insertion");
    },
    [isPremiumUser]
  );

  const onNodesChange = useCallback(
    async (changes: NodeChange[]) => {
      let updatedNodes: CustomNode[] = [];
      setNodes((nodes) => {
        updatedNodes = applyNodeChanges(changes, nodes) as CustomNode[];
        return updatedNodes;
      });

      if(changes[0].type === "select" && !changes[0].selected) {
        editorDispatch({
          type: "SELECTED_ELEMENT",
          payload: {
            node: {
              data: {
                completed: false,
                current: false,
                description: "",
                title: "",
              },
              id: "",
              position: { x: 0, y: 0 },
              type: "None",
            },
          },
        });
      }

      if (changes[0].type === "add" || changes[0].type === "remove") {
        if (isPremiumUser && isChecked) {
          setIsAutoSaving(true);
          const response = await saveWorkflow({
            nodes: JSON.stringify(updatedNodes),
            workflowId: editorId,
          });

          if (!response.success) {
            toast.error(response.error);
            setIsAutoSaving(false);
            return;
          }

          toast.success(response.data);
        }
      }
    },
    [setNodes, editorId, isPremiumUser, setIsAutoSaving, isChecked, editorDispatch]
  );

  const onNodesDelete = useCallback(
    async (nodes: CustomNode[]) => {
      const nodeId = nodes[0].id;
      const nodeType = nodes[0].type;

      try {
        const response = await deleteNode(editorId, nodeId, nodeType!);

        if (!response.success) {
          toast.error(response.error);
          return;
        }

        const data = response.data;
        toast.success(data.message);

        if (!isPremiumUser)
          toast.warning("save the workflow after node deletion");
      } catch (error) {
        if (error instanceof Error) toast.error(error.message);
      }
    },
    [editorId, isPremiumUser]
  );

  const onNodeClick = useCallback(
    async (e: React.MouseEvent, node: CustomNode) => {
      const response = await updateNodeId(editorId, node.id, node.type!);
      if (!response.success){
        toast.error(response.error);
        return;
      }

      toast.success(response.data);
      editorDispatch({ type: "SELECTED_ELEMENT", payload: { node } });
  }, [editorDispatch, editorId]);

  const onEdgesChange = useCallback(async (changes: EdgeChange[]) => {
    setEdges((edges) => applyEdgeChanges(changes, edges));
  }, []);

  const onEdgesDelete = useCallback(async (deletedEdges: Edge[]) => {
    const edgeId = deletedEdges[0].id;
    const edge = edges.find((edge) => edge.id === edgeId);
    const sourceNodeType = nodes.find((node) => node.id === edge?.source)?.type;
    const targetNodeType = nodes.find((node) => node.id === edge?.target)?.type;

    //saving the edge connection changes in DB.
    if (sourceNodeType && targetNodeType && edge?.source && edge?.target) {
      const connectionResponse = await addConnection({
        sourceId: edge.source,
        targetId: edge.target,
        sourceNodeType,
        targetNodeType,
        type: "remove",
      });

      if (!connectionResponse.success) {
        toast.error(connectionResponse.error);
        return;
      }
      
      toast.success(connectionResponse.data);

      const changes: EdgeRemoveChange[] = [{ type: "remove", id: edgeId }];
      const response = await saveWorkflow({
        edges: JSON.stringify(applyEdgeChanges(changes, edges)),
        workflowId: editorId,
      });

      if (!response.success) toast.error(response.error);
      else toast.success(response.data);
    }
  }, [edges, nodes, editorId]);

  const onConnect = useCallback(
    async (connection: Connection) => {
      const sourceNodeType = nodes.find((node) => node.id === connection.source)?.type;
      const targetNodeType = nodes.find((node) => node.id === connection.target)?.type;

      //saving the edge connection changes in DB.
      if (sourceNodeType && targetNodeType) {
        const connectionResponse = await addConnection({
          sourceId: connection.source,
          targetId: connection.target,
          sourceNodeType,
          targetNodeType,
          type: "add",
        });

        if (!connectionResponse.success) {
          toast.error(connectionResponse.error);
          return;
        }

        setEdges((edges) => addEdge(connection, edges));
        const response = await saveWorkflow({
          edges: JSON.stringify(addEdge(connection, edges)),
          workflowId: editorId,
        });

        if (!response.success) toast.error(response.error);
        else toast.success(response.data);
      }
    },
    [setEdges, nodes, edges, editorId]
  );

  useEffect(() => {
    editorDispatch({ type: "LOAD_DATA", payload: { edges, nodes } });
  }, [nodes, edges, editorDispatch]);

  useEffect(() => {
    (async () => {
      try {
        setIsWorkflowLoading(true);
        const response = await getNodesEdges({ workflowId: editorId });
        if (!response.success) {
          toast.error(response.error);
          return;
        }

        const data = response.data;
        const _edges = JSON.parse(data.edges) as Edge[];
        const _nodes = JSON.parse(data.nodes) as CustomNode[];

        setEdges(_edges);
        setNodes(_nodes);
      } catch (error) {
        if (error instanceof Error) toast.error(error.message);
      } finally {
        setIsWorkflowLoading(false);
      }
    })();
  }, [editorId]);

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={70}>
        <div className="flex w-full h-full items-center justify-center">
          <div className="relative w-full h-full">
            {isWorkflowLoading ? (
              <WorkflowLoading />
            ) : (
              <CustomReactFlow
                nodes={editorState.editor.nodes}
                edges={editorState.editor.edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onNodesDelete={onNodesDelete}
                onEdgesChange={onEdgesChange}
                onEdgesDelete={onEdgesDelete}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onInit={(instance) => {
                  reactFlowInstanceRef.current = instance;
                }}
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
                <Controls 
                  showZoom={true} 
                  position="top-left" 
                />
              </CustomReactFlow>
            )}
          </div>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={30} className="relative xl:max-w-md md:max-w-sm">
        {isWorkflowLoading ? (
          <WorkflowLoading />
        ) : (
          <EditorSidebar
            isPublished={isPublished}
            setIsPublished={setIsPublished}
          >
            <EditorSidebarController isPublished={isPublished} />
          </EditorSidebar>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default Editor;
