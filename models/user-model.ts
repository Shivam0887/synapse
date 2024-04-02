import { models, model, Schema, InferSchemaType, Types } from "mongoose";
import { LocalGoogleCredentialSchema } from "./localGoogleCredential-model";
import { ConnectionsSchema } from "./connections-model";
import { SlackSchema } from "./slack-model";
import { NotionSchema } from "./notion-model";
import { DiscordWebhooksSchema } from "./discord-webhooks-model";
import { WorkflowsSchema } from "./workflows-model";

export const UserSchema = new Schema({
  userId: {
    type: String,
    required: true,
  },
  name: String,
  email: {
    type: String,
    required: true,
  },
  imageUrl: String,
  tier: {
    type: String,
    default: () => "Free",
  },
  credits: {
    type: Number,
    default: () => 10,
  },
  localGoogleId: {
    type: String,
    unique: true,
  },
  googleResourceId: {
    type: String,
    unique: true,
  },
  LocalGoogleCredential: LocalGoogleCredentialSchema,
  DiscordWebhooks: [DiscordWebhooksSchema],
  Notion: [NotionSchema],
  Slack: [SlackSchema],
  connections: [ConnectionsSchema],
  workflows: [WorkflowsSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

UserSchema.index({ userId: 1 }, { unique: true });

export type UserType = InferSchemaType<typeof UserSchema> & {
  _id: Types.ObjectId;
};
export const User = models.User || model("User", UserSchema);
