import { models, model, Schema, InferSchemaType, Types } from "mongoose";

const WorkflowSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    nodes: {
      type: String,
      default: () => "[]",
    },
    edges: {
      type: String,
      default: () => "[]",
    },
    nodeMetadata: String,
    name: { type: String, required: true },
    publish: { type: Boolean, default: () => false },
    description: { type: String, required: true },
    selectedNodeId: String,
    selectedNodeType: String,
    googleDriveId: [
      {
        type: Schema.Types.ObjectId,
        ref: "GoogleDrive",
      },
    ],
    discordId: [
      {
        type: Schema.Types.ObjectId,
        ref: "Discord",
      },
    ],
    notionId: [
      {
        type: Schema.Types.ObjectId,
        ref: "Notion",
      },
    ],
    slackId: [
      {
        type: Schema.Types.ObjectId,
        ref: "Slack",
      },
    ],
    parentTrigger: {
      type: String,
      enum: ["Google Drive", "Slack", "Discord", "None"],
      default: () => "None",
    },
    parentId: {
      type: String,
      default: () => "",
    },
    flowMetadata: [
      {
        webhookUrl: String,
        action: {
          mode: {
            type: String,
            enum: ["default", "custom"],
          },
          message: String,
          trigger: {
            type: String,
            enum: ["0", "1"],
            required: true,
          },
          user: String,
        },
        properties: {},
        nodeId: { type: String, required: true },
        nodeType: {
          type: String,
          enum: ["Discord", "Notion", "Slack", "Google Drive"],
          required: true,
        },
        accessToken: { type: String, required: true },
        pageId: String,
        databaseId: String,
        _id: false
      },
    ],
  },
  { timestamps: true }
);

export type WorkflowType = InferSchemaType<typeof WorkflowSchema> & {
  _id: Types.ObjectId;
};

export const Workflow = models.Workflow || model("Workflow", WorkflowSchema);
