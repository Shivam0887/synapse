import { models, model, Schema, InferSchemaType } from "mongoose";
import { DiscordWebhooks } from "./discord-webhooks-model";
import { Notion } from "./notion-model";
import { Slack } from "./slack-model";
import { User } from "./user-model";

export const ConnectionsSchema = new Schema({
  type: { type: String, unique: true },
  discordWebhooksId: {
    type: Schema.Types.ObjectId,
    ref: "DiscordWebhooks",
  },
  notionId: {
    type: Schema.Types.ObjectId,
    ref: "Notion",
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  slackId: {
    type: Schema.Types.ObjectId,
    ref: "Slack",
  },
});

export type ConnectionsType = InferSchemaType<typeof ConnectionsSchema>;
export const Connections =
  models.Connections || model("Connections", ConnectionsSchema);
