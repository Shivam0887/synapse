import { models, model, Schema, InferSchemaType, Types } from "mongoose";
import { ConnectionsSchema } from "./connections-model";
import { User } from "./user-model";

export const DiscordWebhooksSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  webhookId: {
    type: String,
    unique: true,
  },
  url: {
    type: String,
    unique: true,
  },
  name: String,
  guildName: String,
  guildId: String,
  channelId: {
    type: String,
    unique: true,
  },
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

export type DiscordWebhooksType = InferSchemaType<
  typeof DiscordWebhooksSchema
> & {
  _id: Types.ObjectId;
};
export const DiscordWebhooks =
  models.DiscordWebhooks || model("DiscordWebhooks", DiscordWebhooksSchema);
