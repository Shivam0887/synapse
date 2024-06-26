import { models, model, Schema, InferSchemaType, Types } from "mongoose";

export const NotionSchema = new Schema(
  {
    workspaceId: String,
    workspaceName: { type: String, required: true },
    workspaceIcon: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    accessToken: String,
    nodeId: { type: String, unique: true },
    botId: String,
    nodeType: {
      type: String,
      default: () => "Notion",
    },
    databaseId: String,
    pageId: String,
    trigger: String,
    properties: {},
    // Can have multiple source node
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
    workflowId: {
      type: Schema.Types.ObjectId,
      ref: "Workflow",
    },
  },
  { timestamps: true }
);

NotionSchema.index({ nodeId: 1 });

export type NotionType = InferSchemaType<typeof NotionSchema> & {
  _id?: Types.ObjectId;
};
export const Notion = models.Notion || model("Notion", NotionSchema);
