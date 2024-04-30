import { WorkflowType } from "@/models/workflow-model";
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
export type NodeType = Extract<
  keyof ConnectionProviderProps,
  "googleNode" | "discordNode" | "slackNode" | "notionNode"
>;

export type Connection = {
  title: ConnectionTypes;
  description: string;
  image: string;
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
  | "Discord"
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

export type Option = {
  value: string;
  label: string;
  disable?: boolean;
  /** fixed option that can't be removed. */
  fixed?: boolean;
  /** Group the options by providing key. */
  [key: string]: string | boolean | undefined;
};

export type TriggerProps = {
  loading: boolean;
  onSave: () => void;
  trigger: string;
  setTrigger: React.Dispatch<React.SetStateAction<string>>;
  workspaceName: string;
};
