import { models, model, Schema, InferSchemaType } from "mongoose";
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
});

export type DiscordWebhooksType = InferSchemaType<typeof DiscordWebhooksSchema>;
export const DiscordWebhooks =
  models.DiscordWebhooks || model("DiscordWebhooks", DiscordWebhooksSchema);
