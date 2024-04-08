import { models, model, Schema, InferSchemaType } from "mongoose";
import { ConnectionsSchema } from "./connections-model";
import { User } from "./user-model";

export const NotionSchema = new Schema({
  accessToken: { type: String, unique: true },
  workspaceId: { type: String, unique: true },
  databaseId: { type: String, unique: true },
  workspaceName: { type: String, required: true },
  workspaceIcon: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  connections: [ConnectionsSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export type NotionType = InferSchemaType<typeof NotionSchema> & {
  _id: Types.ObjectId;
};
export const Notion = models.Notion || model("Notion", NotionSchema);
