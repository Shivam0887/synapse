import { models, model, Schema, InferSchemaType, Types } from "mongoose";
import { User } from "./user-model";

export const WorkflowsSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  nodes: String,
  edges: String,
  name: { type: String, required: true },
  discordTemplate: String,
  notionTemplate: String,
  slackTemplate: String,
  slackChannels: [String],
  slackAccessToken: String,
  notionAccessToken: String,
  notionDbId: String,
  flowPath: String,
  cronPath: String,
  publish: { type: Boolean, default: () => false },
  description: { type: String, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

WorkflowsSchema.index({ userId: 1 });

export type WorkflowsType = InferSchemaType<typeof WorkflowsSchema> & {
  _id: Types.ObjectId;
};
export const Workflows =
  models.Workflows || model("Workflows", WorkflowsSchema);
