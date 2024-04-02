import { models, model, Schema, InferSchemaType } from "mongoose";
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
  slackAccessToken: { type: String, required: true },
  notionAccessToken: String,
  notionDbId: String,
  flowPath: String,
  cronPath: String,
  publish: { type: Boolean, default: () => false },
  description: { type: String, required: true },
});

export type WorkflowsType = InferSchemaType<typeof WorkflowsSchema>;
export const Workflows =
  models.Workflows || model("Workflows", WorkflowsSchema);
