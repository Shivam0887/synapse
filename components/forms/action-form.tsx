import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import WorkflowLoading from "@/app/(main)/(routes)/workflows/editor/_components/workflow-loading";
import {
  ActionProps,
  ActionType,
  ConnectionTypes,
  actionSchema,
} from "@/lib/types";
import { toast } from "sonner";
import { getTrigger, onSaveAction } from "@/app/(main)/(routes)/connections/_actions/connection-action";
import { useEditor } from "@/providers/editor-provider";

const ActionForm = ({
  actionData,
  defaultMessage,
  loading,
  setActionData,
  nodeId,
  workflowId,
  users,
}: ActionProps & { users: { id: string; username: string }[] }) => {
  const { selectedNode, edges, nodes } = useEditor().state.editor;
  const actionForm = useForm<ActionType>({
    resolver: zodResolver(actionSchema),
    defaultValues: {
      message: actionData.message,
      user: actionData.user,
      type: actionData.type,
      trigger: actionData.trigger,
    },
    values: {
      message: actionData.message,
      user: actionData.user,
      type: actionData.type,
      trigger: actionData.trigger!,
    },
  });

  const onSubmit = async (values: ActionType) => {
    if (values.trigger === "1" && !values.user) {
      toast.error("please select a user");
      return;
    }

    const sourceEdge = edges.find(({ target }) => target === nodeId);
    const sourceNode = nodes.find(({ id }) => id === sourceEdge?.source);

    if(values.trigger === "0" && sourceNode && sourceNode.type === selectedNode.type){
      const sourceTrigger = await getTrigger(workflowId, sourceNode.id, sourceNode.type as ConnectionTypes);
      const targetTrigger = await getTrigger(workflowId, nodeId, selectedNode.type as ConnectionTypes);
  
      if(sourceTrigger && targetTrigger){
        const source = (JSON.parse(sourceTrigger)).data;
        const targetChannelId = (JSON.parse(targetTrigger)).data.channelId;

        if(source.channelId === targetChannelId && source.trigger === values.trigger){
          toast.warning('Synapse detects loop. Please change the action.')
          return;
        }
      }
    }

    const data = {
      user: values.user,
      message: values.type === "default" ? defaultMessage : values.message,
      type: values.type,
      trigger: values.trigger,
      nodeId,
      workflowId,
      nodeType: selectedNode.type as ConnectionTypes,
    };

    setActionData({
      message: values.message,
      trigger: values.trigger,
      type: values.type,
      user: values.user,
    });

    const response = await onSaveAction(data);
    if (response) {
      const data = JSON.parse(response);
      if (data.message) toast.message(data.message);
      else toast.error(data.error);
    }
    actionForm.reset();
  };

  const onError = (errors: any) => {
    console.log(errors);
  };

  return (
    <div className="relative">
      {loading ? (
        <WorkflowLoading />
      ) : (
        <Form {...actionForm}>
          <form
            className="space-y-5"
            onSubmit={actionForm.handleSubmit(onSubmit, onError)}
          >
            <FormField
              control={actionForm.control}
              name="trigger"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="text-neutral-400">
                        <SelectValue placeholder="select action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0" className="cursor-pointer">
                          <div className="gap-2 flex flex-col items-start ">
                            <p className="text-sm font-medium line-clamp-1">
                              Send Channel Message
                            </p>
                            <p className="text-xs text-neutral-500 text-start line-clamp-1">
                              Send a new message to a specific #channel you
                              choose.
                            </p>
                          </div>
                        </SelectItem>
                        <Separator />
                        <SelectItem value="1" className="cursor-pointer">
                          <div className="gap-2 flex flex-col items-start">
                            <p className="text-sm font-medium line-clamp-1">
                              Send Direct Message
                            </p>
                            <p className="text-xs text-neutral-500 text-start line-clamp-1">
                              Send a direct message to a specific user in the
                              channel.
                            </p>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {actionForm.getValues("trigger") === "1" && (
              <FormField
                control={actionForm.control}
                name="user"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="select user" />
                          <SelectContent>
                            {users.map(({ id, username }) => (
                              <SelectItem value={id} key={id}>
                                {username}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </SelectTrigger>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={actionForm.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex justify-between items-center"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="default" />
                        </FormControl>
                        <FormLabel> Default message</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="custom" />
                        </FormControl>
                        <FormLabel> Custom message</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {actionForm.getValues("type") === "custom" ? (
              <FormField
                control={actionForm.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Your message"
                        type="text"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <Input
                placeholder="Your message"
                type="text"
                disabled
                value={defaultMessage}
              />
            )}

            <Button variant="outline" type="submit">
              save action
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
};

export default ActionForm;
