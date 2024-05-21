import { CustomNodeDataType, CustomNodeTypes } from "@/lib/types";
import { useEditor } from "@/providers/editor-provider";
import { memo, useMemo } from "react";
import { Position, useNodeId, useReactFlow } from "reactflow";
import CustomNodeIcon from "./custom-node-icon";
import CustomHandle from "./custom-handle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { updateNodeId } from "../../_actions/workflow-action";
import { toast } from "sonner";
import { z } from "zod";
import { SubmitErrorHandler, SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { v4 as uuid } from "uuid";

type CustomNodeProps = {
  data: CustomNodeDataType;
  selected?: boolean;
};

const formSchema = z.object({
  message: z.string().min(20),
});

type FormType = z.infer<typeof formSchema>;

const CustomNode = ({ data, selected }: CustomNodeProps) => {
  const reactFlow = useReactFlow();

  const { dispatch, state } = useEditor();
  const { id } = state.editor.selectedNode;
  const nodeId = useNodeId();
  const workflowId = usePathname().split("/").pop()!;

  const logo = useMemo(() => <CustomNodeIcon type={data.type} />, [data]);

  const form = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  });

  const onNodeIdUpdate = async (nodeType: CustomNodeTypes) => {
    const response = await updateNodeId(workflowId, nodeId!, nodeType);
    if (response) {
      const data = JSON.parse(response);
      if (data.message) toast.message(data.message);
      else toast.error(data.error);
    }
  };

  const onSubmit: SubmitHandler<FormType> = async ({ message }) => {
    try {
      const response = await axios.post(
        "/api/ai/google",
        { prompt: message },
        { headers: { "Content-Type": "application/json" } }
      );
      if (response) {
        const raw = JSON.parse(response.data.data);
        if (Array.isArray(raw?.nodes) && Array.isArray(raw?.edges)) {
          const nodes = raw.nodes.map((node: any) => ({
            ...node,
            id: uuid(),
          }));

          const edges = raw.edges.map((edge: any) => {
            const sourceIndex = edge.source.charCodeAt(6) - 48;
            const targetIndex = edge.target.charCodeAt(6) - 48;

            return {
              source: nodes[sourceIndex].id,
              target: nodes[targetIndex].id,
              id: uuid(),
            };
          });

          reactFlow.setNodes(nodes);
          reactFlow.setEdges(edges);
        }
      }
    } catch (error: any) {
      console.log(error?.message);
      toast.error(error?.message);
    }
  };

  const onError: SubmitErrorHandler<FormType> = (error) => {
    if (error?.message?.message) toast.error(error.message.message);
  };

  return (
    <div className={`${selected ? "border border-blue-600 rounded-lg" : ""}`}>
      {!(data.type === "Google Drive" || data.type === "AI") && (
        <CustomHandle
          position={Position.Top}
          type="target"
          style={{ zIndex: 100 }}
        />
      )}

      <Card
        onClick={(e) => {
          e.stopPropagation();
          const node = state.editor.nodes.find((node) => node.id === nodeId);
          if (node && node.type && id !== node.id) {
            onNodeIdUpdate(node.type);
            dispatch({ type: "SELECTED_ELEMENT", payload: { node } });
          }
        }}
        className={cn(
          "relative h-auto max-w-[300px] dark:border-muted-foreground/70",
          { "min-w-[800px]": data.type === "AI" }
        )}
      >
        <CardHeader className="flex flex-row items-center gap-4 mt-5">
          <div>{logo}</div>
          <div>
            <CardTitle className="text-base">{data.title}</CardTitle>
            <CardDescription className="flex flex-col items-start mt-2 gap-2">
              <span className="text-xs text-white">
                ID: <b className="text-muted-foreground/80">{nodeId}</b>
              </span>
              <span>{data.description}</span>
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {data.type === "AI" && (
            <div className="space-y-5">
              <p className="text-sm">
                <span className="p-2 text-red-500">Warning:</span>
                Already created workflow will be erased.
              </p>
              <Form {...form}>
                <form
                  className="space-y-3"
                  onSubmit={form.handleSubmit(onSubmit, onError)}
                >
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            {...field}
                            minRows={10}
                            className="resize-none"
                            placeholder="Google Drive is connected to slack, slack is connected to discord, and so on."
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button type="submit" variant="secondary">
                    Create workflow
                  </Button>
                </form>
              </Form>
            </div>
          )}
        </CardContent>

        <Badge variant="secondary" className="absolute right-2 top-2">
          {data.type}
        </Badge>

        <div
          className={cn("absolute left-2 top-4 w-2 h-2 rounded-full", {
            "bg-green-500": Math.random() < 0.6,
            "bg-orange-500": Math.random() >= 0.6 && Math.random() < 0.8,
            "bg-red-500": Math.random() >= 0.8,
          })}
        />
      </Card>

      {!(data.type === "AI" || data.type === "Notion") && (
        <CustomHandle type="source" position={Position.Bottom} />
      )}
    </div>
  );
};

export default memo(CustomNode);
