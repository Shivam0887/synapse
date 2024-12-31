"use client";

import type { CustomNode } from "@/lib/types";

import { useMemo } from "react";
import CustomHandle from "./custom-handle";
import CustomNodeIcon from "./custom-node-icon";
import { Position, useNodeId, NodeProps, useReactFlow } from "@xyflow/react";

import { z } from "zod";
import { v4 } from "uuid";
import axios from "axios";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";

import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitErrorHandler, SubmitHandler, useForm } from "react-hook-form";

const formSchema = z.object({
  message: z.string().min(20),
});

type FormType = z.infer<typeof formSchema>;

const CustomEditorNode = ({ data, selected, type }: NodeProps<CustomNode>) => {
  const nodeId = useNodeId();
  const reactFlow = useReactFlow();

  const logo = useMemo(() => <CustomNodeIcon type={type} />, [type]);

  const form = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  });

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
            id: v4(),
          }));
          const edges = raw.edges.map((edge: any) => {
            if(/^\d+$/.test(edge.source) && /^\d+$/.test(edge.target)){
              const sourceIndex = parseInt(edge.source);
              const targetIndex = parseInt(edge.target);

              return {
                source: nodes[sourceIndex].id,
                target: nodes[targetIndex].id,
                id: v4(),
              };
            }
          });
          reactFlow.setNodes(nodes);
          reactFlow.setEdges(edges);
        }
      }
    } catch (error: any) {
      toast.error(error?.message);
    }
  };

  const onError: SubmitErrorHandler<FormType> = (error) => {
    if (error?.message?.message) toast.error(error.message.message);
  };

  return (
    <div className={`${selected ? "border border-blue-600 rounded-lg" : ""}`}>
      {!(type === "Google Drive" || type === "AI") && (
        <CustomHandle
          position={Position.Top}
          type="target"
          style={{ zIndex: 100 }}
        />
      )}

      <Card
        className={cn(
          "relative h-auto max-w-[300px] dark:border-muted-foreground/70",
          { "min-w-[800px]": type === "AI" }
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
          {type === "AI" && (
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
          {type}
        </Badge>

        <div
          className={cn("absolute left-2 top-4 w-2 h-2 rounded-full", {
            "bg-green-500": Math.random() < 0.6,
            "bg-orange-500": Math.random() >= 0.6 && Math.random() < 0.8,
            "bg-red-500": Math.random() >= 0.8,
          })}
        />
      </Card>

      {!(type === "AI" || type === "Notion") && (
        <CustomHandle type="source" position={Position.Bottom} />
      )}
    </div>
  );
};

export default CustomEditorNode;
