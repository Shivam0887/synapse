import { models, model, Schema, InferSchemaType, Types } from "mongoose";

export const DiscordSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    webhookId: {
      type: String,
      unique: true,
    },
    webhookUrl: String,
    webhookName: String,
    guildName: String,
    guildId: String,
    channelId: String,    
    trigger: { type: String, enum: ["0", "1", "2", "3"] },
    action: {
      trigger: String,
      user: String,
      message: String,
      mode: {
        type: String,
        enum: ["default", "custom"],
        default: () => "default",
      },
    },
    channelName: String,
    connections: {
      discordId: [
        {
          type: Schema.Types.ObjectId,
          ref: "Discord",
        },
      ],
      notionId: [
        {
          type: Schema.Types.ObjectId,
          ref: "Notion",
        },
      ],
      slackId: [
        {
          type: Schema.Types.ObjectId,
          ref: "Slack",
        },
      ],
    },
    workflowId: {
      type: Schema.Types.ObjectId,
      ref: "Workflow",
    },
    nodeId: {
      type: String,
      unique: true,
    },
    nodeType: {
      type: String,
      default: () => "Discord",
    },
    accessToken: { type: String, unique: true },
    refreshToken: { type: String, unique: true },
  },
  { timestamps: true }
);

DiscordSchema.index({ nodeId: 1 });

export type DiscordType = InferSchemaType<typeof DiscordSchema> & {
  _id?: Types.ObjectId;
};

export const Discord = models.Discord || model("Discord", DiscordSchema);
