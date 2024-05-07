import { z } from "zod";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import React, { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEditor } from "@/providers/editor-provider";
import {
  getNotionDatabases,
  onCreatePage,
} from "@/app/(main)/(routes)/connections/_actions/notion-action";
import WorkflowLoading from "@/app/(main)/(routes)/workflows/editor/_components/workflow-loading";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

import { Label } from "@/components/ui/label";
import { getPropertyItem } from "@/lib/editor-utils";
import { NotionDatabaseType } from "@/lib/types";
import {
  UnsupportedTypes,
  databaseIdMapper,
  messageSchema,
} from "@/lib/constant";
import { onSaveNotionAction } from "@/app/(main)/(routes)/connections/_actions/connection-action";

const actionFormSchema = z.object({
  databaseId: z.string().optional(),
  pageId: z.string().optional(),
  trigger: z.enum(["0", "1"]),
  pageTitle: z.string().min(1).optional(),
});

const NotionAction = ({
  workflowId,
  isTesting,
}: {
  workflowId: string;
  isTesting: boolean;
}) => {
  const { selectedNode } = useEditor().state.editor;

  const submitBtnRef = useRef<HTMLButtonElement>(null);

  const [databases, setDatabases] = useState<NotionDatabaseType>([]);
  const [message, setMessage] = useState<{
    [x: string]: { [x: string]: string };
  }>({});

  const actionForm = useForm<z.infer<typeof actionFormSchema>>({
    resolver: zodResolver(actionFormSchema),
  });

  // watching for the latest value in the form
  const trigger = actionForm.watch().trigger;
  const databaseId = actionForm.watch().databaseId;
  const pageId = actionForm.watch().pageId;

  const onSubmit = async (values: z.infer<typeof actionFormSchema>) => {
    // If a database is selected as a trigger
    if (submitBtnRef.current && databaseId) {
      // explicitly invoking the "form's" onSubmit event by clicking on the submit button
      submitBtnRef.current.click();

      // dynamic form fields
      const properties: Record<string, any> = {};
      Object.entries(message).forEach(([name, type]) => {
        properties[name] = getPropertyItem(type);
      });

      const { pageTitle, ...rest } = values;
      const data = { ...rest, properties };

      // Is it a test message for creating a database item?
      if (!isTesting) {
        const response = await onSaveNotionAction({
          ...data,
          nodeId: selectedNode.id!,
          workflowId,
        });

        if (response) {
          const _data = JSON.parse(response);
          if (_data.success) toast.success(_data.data);
          else {
            if (_data.message) toast.message(_data.message);
            else toast.error(_data.error);
          }
        }
      } else {
        // If it is a test message, then we'll send a request to create a database item with the provided data
        const response = await onCreatePage({
          workflowId,
          nodeId: selectedNode.id!,
          isTesting,
          databaseId: data.databaseId!,
          properties: data.properties,
        });

        if (response) toast.success(JSON.parse(response));
      }
    } else if (pageId) {
      // If a new page creation trigger is selected
      const { pageTitle, ...rest } = values;
      const data = {
        ...rest,
        properties: {
          type: "title",
          title: [
            {
              type: "text",
              text: {
                content: pageTitle,
                link: null,
              },
            },
          ],
        },
      };

      // Is it a test message for creating a new page?
      if (!isTesting) {
        const response = await onSaveNotionAction({
          ...data,
          nodeId: selectedNode.id!,
          workflowId,
        });

        if (response) {
          const _data = JSON.parse(response);
          if (_data.success) toast.success(_data.data);
          else {
            if (_data.message) toast.message(_data.message);
            else toast.error(_data.error);
          }
        }
      } else {
        // If it is a test message, then we'll send a request to create a new page with the provided data
        const response = await onCreatePage({
          workflowId,
          nodeId: selectedNode.id!,
          isTesting,
          pageId: data.pageId!,
          properties: data.properties,
        });

        if (response) toast.success(JSON.parse(response));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const onError = (errors: any) => {
    console.log(errors);
  };

  useEffect(() => {
    (async () => {
      const response = await getNotionDatabases(workflowId, selectedNode.id);
      if (response) {
        const data = JSON.parse(response);
        if (data.success) setDatabases(data.data);
        else {
          if (data.message) toast.message(data.message);
          else toast.error(data.error);
        }
      }
    })();
  }, [workflowId, selectedNode.id]);

  useEffect(() => {
    databases.forEach(({ id, properties }) => {
      if (!databaseIdMapper.has(id)) {
        databaseIdMapper.set(id, properties);
      }
    });
  }, [databases]);

  return (
    <div className="relative">
      {false ? (
        <WorkflowLoading />
      ) : (
        <>
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
                    <div>
                      Trigger <span className="text-red-500">*</span>
                    </div>
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
                                Create Database Item
                              </p>
                              <p className="text-xs text-neutral-500 text-start line-clamp-1">
                                Creates an item in a database
                              </p>
                            </div>
                          </SelectItem>
                          <Separator />
                          <SelectItem value="1" className="cursor-pointer">
                            <div className="gap-2 flex flex-col items-start">
                              <p className="text-sm font-medium line-clamp-1">
                                Create Page
                              </p>
                              <p className="text-xs text-neutral-500 text-start line-clamp-1">
                                Creates a Page inside a parent page
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
              {trigger === "0" && (
                <>
                  <FormField
                    control={actionForm.control}
                    name="databaseId"
                    render={({ field }) => (
                      <FormItem>
                        <div>
                          Database <span className="text-red-500">*</span>
                        </div>
                        <FormControl>
                          <Select onValueChange={field.onChange}>
                            <SelectTrigger className="text-neutral-400">
                              <SelectValue placeholder="select database" />
                            </SelectTrigger>
                            <SelectContent>
                              {databases.map(({ id, name }) => (
                                <SelectItem key={id} value={id}>
                                  <div className="gap-2 flex flex-col items-start ">
                                    <p className="text-sm font-medium line-clamp-1">
                                      {name}
                                    </p>
                                    <p className="text-xs text-neutral-500 text-start line-clamp-1">
                                      {id}
                                    </p>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              {trigger === "1" && (
                <>
                  <FormField
                    control={actionForm.control}
                    name="pageId"
                    render={({ field }) => (
                      <FormItem>
                        <div>
                          Parent Page <span className="text-red-500">*</span>
                        </div>
                        <FormControl>
                          <Input
                            name={field.name}
                            ref={field.ref}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            disabled={field.disabled}
                            placeholder="page_id"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={actionForm.control}
                    name="pageTitle"
                    render={({ field }) => (
                      <FormItem>
                        <div>
                          Page Title <span className="text-red-500">*</span>
                        </div>
                        <FormControl>
                          <Input
                            name={field.name}
                            ref={field.ref}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            disabled={field.disabled}
                            placeholder="page title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <p className={trigger === "0" ? "absolute left-0 bottom-0" : ""}>
                <span className="text-red-500">*</span> - required field
              </p>
              {trigger === "1" && (
                <p>
                  <span className="rounded-md p-[3px] bg-orange-500 text-black">
                    Note
                  </span>{" "}
                  Page must be a part of the integration.
                </p>
              )}
              {(databaseId || pageId) && (
                <Button
                  variant="outline"
                  type="submit"
                  className={trigger === "0" ? "absolute left-0 -bottom-1" : ""}
                >
                  {isTesting ? "Test Message" : "save action"}
                </Button>
              )}
            </form>
          </Form>

          {trigger === "0" && (
            <form onSubmit={handleSubmit} className="space-y-3 mt-3">
              {databaseId &&
                databaseIdMapper.has(databaseId) &&
                databaseIdMapper
                  .get(databaseId)!
                  .map(({ name, type }: { name: string; type: string }) => (
                    <div key={name} className="space-y-2">
                      {!UnsupportedTypes.has(type) ? (
                        <Label htmlFor={`${name}:${type}`}>
                          {name} <span className="text-red-500">*</span>
                        </Label>
                      ) : (
                        <>
                          <div>{name}</div>
                          <Input
                            disabled
                            placeholder={`Type for ${name} is not supported`}
                          />
                        </>
                      )}
                      {!UnsupportedTypes.has(type) && (
                        <Input
                          id={`${name}:${type}`}
                          type={messageSchema[type]}
                          name={name}
                          placeholder={messageSchema[type]}
                          value={message[name]?.[type] ?? ""}
                          onChange={(e) => {
                            setMessage({
                              ...message,
                              [name]: { [type]: e.target.value },
                            });
                          }}
                          required
                        />
                      )}
                    </div>
                  ))}
              <Button
                variant="outline"
                className="invisible"
                type="submit"
                ref={submitBtnRef}
              />
            </form>
          )}
        </>
      )}
    </div>
  );
};

export default NotionAction;
