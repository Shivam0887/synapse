import { models, model, Schema, InferSchemaType, Types } from "mongoose";

export const NotionSchema = new Schema(
  {
    workspaceId: { type: String, unique: true },
    workspaceName: { type: String, required: true },
    workspaceIcon: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    accessToken: { type: String, unique: true },
    nodeId: { type: String, unique: true },
    botId: { type: String, unique: true },
    nodeType: {
      type: String,
      default: () => "Notion",
    },
    databaseId: String,
    pageId: String,
    trigger: String,
    properties: {},
    // Can have multiple source node
    connectionId: [
      {
        type: Schema.Types.ObjectId,
        ref: "Connection",
      },
    ],
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
