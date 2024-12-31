"use client";

import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useEditor } from "@/providers/editor-provider";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import {
  getPropertyItem,
  isUnsupportedPropertyType,
  typedEntries,
} from "@/lib/utils";
import {
  ActionValue,
  NotionDatabaseType,
  SupportedPropertyTypes,
} from "@/lib/types";
import { notionInputProperty } from "@/lib/utils";

import { saveNotionAction } from "@/actions/connection.actions";
import { getNotionDatabases, createPage } from "@/actions/notion.actions";

type Message = {
  [propertyType in SupportedPropertyTypes]: Record<string, string>;
};

type NotionActionFormProps = {
  workflowId: string;
  isTesting: boolean;
  trigger: ActionValue;
};

type Field = {
  trigger: "0" | "1";
  databaseId: string;
  pageId: string;
  pageTitle: string;
};

const NotionActionForm = ({
  workflowId,
  isTesting,
  trigger,
}: NotionActionFormProps) => {
  const { selectedNode } = useEditor().editorState.editor;

  const [databases, setDatabases] = useState<NotionDatabaseType[]>([]);
  const [fields, setFields] = useState<Field>({
    trigger,
    pageTitle: "",
    databaseId: "",
    pageId: "",
  });
  const [message, setMessage] = useState<Message>({
    checkbox: {},
    date: {},
    email: {},
    multi_select: {},
    number: {},
    people: {},
    phone_number: {},
    rich_text: {},
    select: {},
    status: {},
    title: {},
    url: {},
  });

  useEffect(() => {
    (async () => {
      const response = await getNotionDatabases(workflowId, selectedNode.id);
      if (!response.success) {
        toast.error(response.error);
        return;
      }

      setDatabases(response.data);
    })();
  }, [workflowId, selectedNode.id]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // If a database is selected as a trigger
    if (fields.trigger === "0") {
      // dynamic form fields
      const properties: Record<string, unknown> = {};

      typedEntries(message).forEach(([type, item]) => {
        typedEntries(item).forEach(([name, val]) => {
          properties[name] = getPropertyItem(type, val);
        });
      });

      const { pageTitle, ...rest } = fields;
      const data = { ...rest, properties };

      // Is it a test message for creating a database item?
      if (isTesting) {
        // If it is a test message, then we'll send a request to create a database item with the provided data
        const response = await createPage({
          workflowId,
          nodeId: selectedNode.id,
          isTesting,
          databaseId: data.databaseId,
          properties: data.properties,
        });

        if (!response.success) {
          toast.error(response.error);
          return;
        }

        toast.success(response.data);
      } else {
        const response = await saveNotionAction({
          ...data,
          nodeId: selectedNode.id!,
          workflowId,
        });

        if (!response.success) {
          toast.error(response.error);
          return;
        }

        toast.success(response.data);
      }
    } else {
      // If a new page creation trigger is selected
      const { pageTitle, ...rest } = fields;
      const data = {
        ...rest,
        properties: {
          type: "title",
          title: [
            {
              type: "text",
              text: {
                content: pageTitle,
              },
            },
          ],
        },
      };

      // Is it a test message for creating a new page?
      if (!isTesting) {
        const response = await saveNotionAction({
          ...data,
          nodeId: selectedNode.id!,
          workflowId,
        });

        if (!response.success) {
          toast.error(response.error);
          return;
        }

        toast.success(response.data);
      } else {
        // If it is a test message, then we'll send a request to create a new page with the provided data
        const response = await createPage({
          workflowId,
          nodeId: selectedNode.id!,
          isTesting,
          pageId: data.pageId,
          properties: data.properties,
        });

        if (!response.success) {
          toast.error(response.error);
          return;
        }

        toast.success(response.data);
      }
    }
  };

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div>
        Trigger <span className="text-red-500">*</span>
      </div>
      <Select
        required
        name="trigger"
        onValueChange={(val) => {
          setFields((prev) => ({
            ...prev,
            trigger: val as "0" | "1",
          }));
        }}
        defaultValue={fields.trigger}
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
              <p className="text-sm font-medium line-clamp-1">Create Page</p>
              <p className="text-xs text-neutral-500 text-start line-clamp-1">
                Creates a Page inside a parent page
              </p>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {fields.trigger === "0" ? (
        <>
          <div>
            Database <span className="text-red-500">*</span>
          </div>

          <Select
            required
            name="databaseId"
            onValueChange={(val) => {
              setFields((prev) => ({
                ...prev,
                databaseId: val,
              }));
            }}
          >
            <SelectTrigger className="text-neutral-400">
              <SelectValue placeholder="select database" />
            </SelectTrigger>
            <SelectContent>
              {databases.map(({ id, name }) => (
                <SelectItem key={id} value={id}>
                  <div className="gap-2 flex flex-col items-start ">
                    <p className="text-sm font-medium line-clamp-1">{name}</p>
                    <p className="text-xs text-neutral-500 text-start line-clamp-1">
                      {id}
                    </p>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {databases
            .find(({ id }) => id === fields.databaseId)
            ?.properties.map(({ name, type }) => (
              <div key={name} className="space-y-2">
                <Label htmlFor={`${name}:${type}`}>
                  {name} <span className="text-red-500">*</span>
                </Label>

                {isUnsupportedPropertyType(type) ? (
                  <Input
                    disabled
                    placeholder={`Type ${name} is not supported`}
                  />
                ) : (
                  <Input
                    required
                    id={`${name}:${type}`}
                    type={notionInputProperty[type]}
                    name={name}
                    placeholder={notionInputProperty[type]}
                    value={message[type][name]}
                    onChange={(e) => {
                      setMessage((prev) => ({
                        ...prev,
                        [type]: {
                          ...prev[type],
                          [name]:
                            type === "checkbox"
                              ? String(e.target.checked)
                              : e.target.value,
                        },
                      }));
                    }}
                  />
                )}
              </div>
            ))}
        </>
      ) : (
        <>
          <div>
            Parent Page <span className="text-red-500">*</span>
          </div>

          <Input
            type="text"
            name="pageId"
            required
            value={fields.pageId}
            onChange={(e) => {
              setFields((prev) => ({
                ...prev,
                pageId: e.target.value,
              }));
            }}
            placeholder="page_id"
          />

          <div>
            Page Title <span className="text-red-500">*</span>
          </div>
          <Input
            type="text"
            name="pageTitle"
            required
            value={fields.pageTitle}
            onChange={(e) => {
              setFields((prev) => ({
                ...prev,
                pageTitle: e.target.value,
              }));
            }}
            placeholder="page title"
          />
        </>
      )}

      <p>Note: Page/Database must be the connected to Synapse</p>
      <p>
        <span className="text-red-500">*</span> - required field
      </p>

      {(fields.databaseId || fields.pageId) && (
        <Button variant="outline" type="submit">
          {isTesting ? "Test Message" : "save action"}
        </Button>
      )}
    </form>
  );
};

export default NotionActionForm;
