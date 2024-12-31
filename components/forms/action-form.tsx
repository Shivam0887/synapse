"use client";

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
import { ActionDataType, CustomNodeType } from "@/lib/types";
import { toast } from "sonner";
import { useEditor } from "@/providers/editor-provider";
import { getTrigger, saveAction } from "@/actions/connection.actions";
import { z } from "zod";

type ActionFormProps = {
  actionData: ActionDataType;
  setActionData: React.Dispatch<React.SetStateAction<ActionDataType>>;
  defaultMessage: string;
  workflowId: string;
  nodeId: string;
  users: { id: string; username: string }[],
  parentTrigger: {
    type: Exclude<CustomNodeType, "AI" | "Notion">,
    id: string
  }
};

const actionSchema = z.object({
  user: z.string().optional(),
  message: z.string().default("test message"),
  mode: z.enum(["custom", "default"]).default("default"),
  trigger: z.enum(["0", "1"]).default("0"),
});

type TActionForm = z.infer<typeof actionSchema>;

const ActionForm = ({
  actionData,
  defaultMessage,
  setActionData,
  nodeId,
  workflowId,
  users,
  parentTrigger
}: ActionFormProps) => {
  const { selectedNode } = useEditor().editorState.editor;

  const actionForm = useForm<TActionForm>({
    resolver: zodResolver(actionSchema),
    defaultValues: {
      message: actionData.message,
      user: actionData.user,
      mode: actionData.mode,
      trigger: actionData.trigger,
    },
  });

  const onSubmit = async (values: TActionForm) => {
    if(!(selectedNode.type === "Slack" || selectedNode.type === "Discord")) return;

    if (values.trigger === "1" && !values.user) {
      toast.error("please select a user");
      return;
    }

    // "0" means channel message
    if (
      values.trigger === "0" && 
      selectedNode.type === parentTrigger.type
    ) {
      const sourceTrigger = await getTrigger(parentTrigger.id, parentTrigger.type);
      const targetTrigger = await getTrigger(selectedNode.id, selectedNode.type);

      if (sourceTrigger.success && targetTrigger.success) {
        const source = sourceTrigger.data;
        const target = targetTrigger.data;

        if (
          source.channelId === target.channelId &&
          source.trigger === target.trigger
        ) {
          toast.warning("Synapse detects loop. Please change the action.");
          return;
        }
      }
    }

    const data = {
      user: values.user,
      message: values.mode === "default" ? defaultMessage : values.message,
      mode: values.mode,
      trigger: values.trigger,
      nodeId,
      workflowId,
      nodeType: selectedNode.type,
    };

    const response = await saveAction(data);
    if (!response.success) {
      toast.error(response.error);
      return;
    }

    setActionData({
      message: values.message,
      trigger: values.trigger,
      mode: values.mode,
      user: values.user,
    });

    toast.success(response.data);
    actionForm.reset();
  };

  return (
    <div className="relative">
      <Form {...actionForm}>
        <form
          className="space-y-5"
          onSubmit={actionForm.handleSubmit(onSubmit)}
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
            name="mode"
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

          {actionForm.getValues("mode") === "custom" ? (
            <FormField
              control={actionForm.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} placeholder="Your message" type="text" />
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
    </div>
  );
};

export default ActionForm;
