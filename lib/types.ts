import { WorkflowType } from "@/models/workflow-model";
import { ConnectionProviderProps } from "@/providers/connections-provider";
import { Node } from "reactflow";
import { z } from "zod";

export type ConnectionTypes = "Google Drive" | "Notion" | "Slack" | "Discord";

export type Connection = {
  title: ConnectionTypes;
  description: string;
  image: string;
  message?: Record<string, string>;
};

export type CustomNodeTypes =
  | "AI"
  | "Slack"
  | "Google Drive"
  | "Notion"
  | "None"
  | "Discord";

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

export const nodeMapper: Record<
  ConnectionTypes,
  Extract<
    keyof WorkflowType,
    "discordId" | "slackId" | "notionId" | "googleDriveWatchTrigger"
  >
> = {
  Notion: "notionId",
  Slack: "slackId",
  Discord: "discordId",
  "Google Drive": "googleDriveWatchTrigger",
};

export type TriggerProps = {
  loading: boolean;
  onSave: () => void;
  trigger: string;
  setTrigger: React.Dispatch<React.SetStateAction<string>>;
  workspaceName: string;
};

export type ActionDataType = {
  user: string | undefined;
  message: string;
  type: "default" | "custom";
  trigger: "0" | "1" | undefined;
};

export const actionSchema = z.object({
  user: z.string().optional(),
  message: z.string().default("test message"),
  type: z.enum(["custom", "default"]).default("default"),
  trigger: z.enum(["0", "1"]),
});

export type ActionType = z.infer<typeof actionSchema>;

export type ActionProps = {
  loading: boolean;
  actionData: ActionDataType;
  setActionData: React.Dispatch<React.SetStateAction<ActionDataType>>;
  defaultMessage: string;
  workflowId: string;
  nodeId: string;
};

export type PropertyTypes =
  | "number"
  | "date"
  | "email"
  | "checkbox"
  | "multi_select"
  | "people"
  | "phone_number"
  | "rich_text"
  | "select"
  | "status"
  | "title"
  | "url"
  // Types included automatically, if present in notion db schema- created_by, created_time, last_edited_by, last_edited_time
  | "last_edited_by"
  | "last_edited_time"
  | "created_by"
  | "created_time"
  // Unsupported types 'cause they are highly complex and time consuming to implement- files, formula, relation, rollup, unique_id, verification
  | "files"
  | "relation"
  | "rollup"
  | "unique_id"
  | "formula"
  | "verification";

export type NotionDatabaseType = {
  id: string;
  name: string;
  properties: {
    name: string;
    type: PropertyTypes;
  }[];
}[];

export type ResultDataType = {
  webhookUrl?: string | null;
  action?: {
    mode?: "default" | "custom" | null;
    message?: string | null;
    trigger?: string | null;
    user?: string | null;
  } | null;
  nodeId?: string | null;
  nodeType: "Discord" | "Notion" | "Slack" | "Google Drive";
  accessToken?: string | null;
  workflowId?: string | null;
};

export type ResultType = {
  Discord: ResultDataType[];
  Slack: ResultDataType[];
  "Google Drive": ResultDataType[];
};

type DiscordUser = {
  id: string;
  username: string;
  bot?: boolean;
};

export type EventData = {
  MESSAGE_CREATE: {
    channel_id: string;
    mentions: DiscordUser[];
    mention_roles: string[];
    type: number; // DEFAULT (0), REPLY (19)
    webhook_id?: string;
    author: DiscordUser;
  };
  MESSAGE_REACTION_ADD: {
    user_id: string;
    channel_id: string;
    guild_id?: string;
    emoji: {
      id?: string;
      name?: string;
    };
    type: number; // NORMAL (0)
  };
  GUILD_MEMBER_ADD: {
    guild_id: string;
    user?: DiscordUser;
  };
};
