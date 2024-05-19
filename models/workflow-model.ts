import { models, model, Schema, InferSchemaType, Types } from "mongoose";

export const WorkflowSchema = new Schema(
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
    cronPath: String,
    name: { type: String, required: true },
    publish: { type: Boolean, default: () => false },
    description: { type: String, required: true },
    selectedNodeId: { type: String, unique: true },
    selectedNodeType: String,

    // a workspace can have multiple node except googleDrive
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
    // considering only one googleNode trigger in a single workspace at that moment.
    googleDriveWatchTrigger: {
      // view all changes - creation, deletion, renaming, open, pagination, trash-files, etc.
      isListening: {
        type: Boolean,
        default: () => false,
      },
      pageToken: String,
      changes: {
        type: String,
        enum: ["true", "false", ""],
      },
      // view files changes - creation, deletion, renaming, etc.
      files: {
        type: String,
        enum: ["true", "false", ""],
      },
      folderId: { type: String, default: () => "" },
      supportedAllDrives: {
        type: String,
        enum: ["true", "false", ""],
      },
      includeRemoved: {
        type: String,
        enum: ["true", "false", ""],
      },
      restrictToMyDrive: {
        type: String,
        enum: ["true", "false", ""],
      },
      fileId: { type: String, default: () => "" },
      channelId: String,
      expiresAt: Number,
      resourceUri: String,
      resourceId: String,
      connections: {
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
      },
    },
    parentTrigger: {
      type: String,
      enum: ["Google Drive", "Slack", "Discord", "None"],
      default: () => "None",
    },
    parentId: {
      type: String,
      default: () => "",
    },
  },
  { timestamps: true }
);

export type WorkflowType = InferSchemaType<typeof WorkflowSchema> & {
  _id: Types.ObjectId;
};

export const Workflow = models.Workflow || model("Workflow", WorkflowSchema);
