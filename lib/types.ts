import { ConnectionProviderProps } from "@/providers/connections-provider";
import { Node } from "reactflow";
import { z } from "zod";

export const ProfileSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1, "Required"),
});

export const WorkflowFormSchema = z.object({
  name: z.string().min(1, "Required"),
  description: z.string().min(1, "Required"),
});

export type ConnectionTypes = "Google Drive" | "Notion" | "Slack" | "Discord";

export type Connection = {
  title: ConnectionTypes;
  description: string;
  image: string;
  connectionKey: keyof ConnectionProviderProps;
  accessTokenKey?: string;
  alwaysTrue?: boolean;
  slackSpecial?: boolean;
};

export type CustomNodeTypes =
  | "Email"
  | "Condition"
  | "AI"
  | "Slack"
  | "Google Drive"
  | "Notion"
  | "Custom Webhook"
  | "Google Calendar"
  | "Trigger"
  | "Action"
  | "Wait";

export type CustomNodeDataType = {
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
  metadata: any;
  type: CustomNodeTypes;
};

export type CustomNodeType = Node<CustomNodeDataType, CustomNodeTypes>;

export type EditorActions =
  | {
      type: "LOAD_DATA";
      payload: {
        nodes: CustomNodeType[];
        edges: {
          id: string;
          source: string;
          target: string;
        }[];
      };
    }
  | {
      type: "UPDATE_NODE";
      payload: {
        nodes: CustomNodeType[];
      };
    }
  | { type: "REDO" }
  | { type: "UNDO" }
  | {
      type: "SELECTED_ELEMENT";
      payload: {
        node: CustomNodeType;
      };
    };

export const nodeMapper: Record<string, string> = {
  Notion: "notionNode",
  Slack: "slackNode",
  Discord: "discordNode",
  "Google Drive": "googleNode",
};
