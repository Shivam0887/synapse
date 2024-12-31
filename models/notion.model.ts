import { models, model, Schema, InferSchemaType, Types } from "mongoose";

const NotionSchema = new Schema(
  {
    workspaceId: { type: String, required: true },
    workspaceName: { type: String, required: true },
    workspaceIcon: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    accessToken: { type: String, required: true },
    nodeId: { type: String, required: true },
    botId: String,
    nodeType: {
      type: String,
      required: true,
    },
    action: {
      type: {
        trigger: {
          type: String,
          enum: ["0", "1"],
          default: "0",
        },
        isSaved: {
          type: Boolean,
          default: false,
        },
        _id: false,
      },
      default: {},
    },
    databaseId: String,
    pageId: String,
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
).index({ nodeId: 1 });

export type NotionType = InferSchemaType<typeof NotionSchema> & {
  _id?: Types.ObjectId;
};
export const Notion = models.Notion || model("Notion", NotionSchema);
