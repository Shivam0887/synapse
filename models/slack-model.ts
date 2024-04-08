import { models, model, Schema, InferSchemaType, Types } from "mongoose";
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export type SlackType = InferSchemaType<typeof SlackSchema> & {
  _id: Types.ObjectId;
};
export const Slack = models.Slack || model("Slack", SlackSchema);
