import { models, model, Schema, InferSchemaType, Types } from "mongoose";

const defaultBooleanSchema = {
  type: Boolean,
  default: () => false,
};

const defaultStringSchema = {
  type: String,
  default: () => "",
};

const GoogleDriveSchema = new Schema({
  // view all changes - creation, deletion, renaming, open, pagination, trash-files, etc.
  nodeId: {
    type: String,
    required: true,
  },
  nodeType: {
    type: String,
    required: true,
  },
  changes: {
    type: String,
    enum: ["true", "false"],
    default: "true",
  },
  driveId: defaultStringSchema,
  supportedAllDrives: {
    type: String,
    enum: ["true", "false"],
    default: "false",
  },
  includeRemoved: {
    type: String,
    enum: ["true", "false"],
    default: "false",
  },
  restrictToMyDrive: {
    type: String,
    enum: ["true", "false"],
    default: "true",
  },
  fileId: defaultStringSchema,
  channelId: defaultStringSchema,
  resourceId: String,
  pageToken: String,
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
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
  expiresAt: { type: Number, required: true },
  workflowId: {
    type: Schema.Types.ObjectId,
    ref: "Workflow",
  },
}).index({ nodeId: 1 });

export type GoogleDriveType = InferSchemaType<typeof GoogleDriveSchema> & {
  _id: Types.ObjectId;
};

export const GoogleDrive =
  models.GoogleDrive || model("GoogleDrive", GoogleDriveSchema);
