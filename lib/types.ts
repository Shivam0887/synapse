import { GoogleDriveType } from "@/models/google-drive.model";
import { Node } from "@xyflow/react";
import { Auth } from "googleapis";
import { LucideIcon } from "lucide-react";

export type TPlan = "Free" | "Pro" | "Premium";

export type ConnectionTypes = "Google Drive" | "Notion" | "Slack" | "Discord";

export type TriggerValue = "0" | "1" | "2" | "3" | "4";
export type ActionValue = "0" | "1";

export type OAuth2Client = Auth.OAuth2Client;

export type Connection = {
  title: ConnectionTypes;
  description: string;
  image: string;
  message?: Record<string, string>;
};

export type CustomNodeType =
  | "AI"
  | "Slack"
  | "Google Drive"
  | "Notion"
  | "None"
  | "Discord";

export type CustomNodeData = {
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
};

export type CustomNode = Node<CustomNodeData, CustomNodeType>;

export type EditorActions =
  | {
      type: "LOAD_DATA";
      payload: {
        nodes: CustomNode[];
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
        nodes: CustomNode[];
      };
    }
  | { type: "REDO" }
  | { type: "UNDO" }
  | {
      type: "SELECTED_ELEMENT";
      payload: {
        node: CustomNode;
      };
    };

export const nodeMapper: Record<
  ConnectionTypes,
  "discordId" | "slackId" | "notionId" | "googleDriveId"
> = {
  Notion: "notionId",
  Slack: "slackId",
  Discord: "discordId",
  "Google Drive": "googleDriveId",
};

export type TriggerProps = {
  loading: boolean;
  onSave: () => void;
  trigger: TriggerValue;
  setTrigger: React.Dispatch<React.SetStateAction<TriggerValue>>;
  workspaceName: string;
};

export type ActionDataType = {
  user: string | undefined;
  message: string;
  mode: "default" | "custom";
  trigger: ActionValue;
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

export type SupportedPropertyTypes =
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
  | "url";

export type NotionDatabaseType = {
  id: string;
  name: string;
  properties: {
    name: string;
    type: PropertyTypes;
  }[];
};

export type ResultDataType = {
  webhookUrl?: string | null;
  action?: {
    mode?: "default" | "custom" | null;
    trigger: ActionValue;
    message?: string | null;
    user?: string | null;
  } | null;
  properties: Record<string, unknown>;
  nodeId: string;
  nodeType: ConnectionTypes;
  accessToken: string;
  pageId?: string | null;
  databaseId?: string | null;
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

export type TPlanDetails = {
  [plan in TPlan]: {
    icon: LucideIcon;
    desc: string;
    available: boolean;
  }[];
};

export type TActionResponse<T = string> =
  | {
      success: true;
      data: T;
    }
  | { success: false; error: string };

export type Credentials = {
  access_token?: string | null;
  refresh_token?: string | null;
  expires_in?: number | null;
  scope?: string;
  token_type?: string | null;
  id_token?: string | null;
};

export type GoogleDriveInstance = Pick<
  GoogleDriveType,
  | "changes"
  | "fileId"
  | "driveId"
  | "includeRemoved"
  | "restrictToMyDrive"
  | "supportedAllDrives"
  | "accessToken"
  | "refreshToken"
  | "expiresAt"
  | "nodeId"
  | "channelId"
  | "resourceId"
  | "pageToken"
>;