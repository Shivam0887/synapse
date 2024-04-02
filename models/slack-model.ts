import { models, model, Schema, InferSchemaType } from "mongoose";
import { ConnectionsSchema } from "./connections-model";

export const SlackSchema = new Schema({
  appId: { type: String, required: true },
  authedUserId: { type: String, required: true },
  authedUserToken: { type: String, unique: true },
  slackAccessToken: { type: String, unique: true },
  botUserId: { type: String, required: true },
  teamId: { type: String, required: true },
  teamName: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  connections: [ConnectionsSchema],
});

export type SlackType = InferSchemaType<typeof SlackSchema>;
export const Slack = models.Slack || model("Slack", SlackSchema);
