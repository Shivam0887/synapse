import { models, model, Schema, InferSchemaType, Types } from "mongoose";

const DiscordSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    webhookId: { type: String, required: true },
    webhookUrl: { type: String, required: true },
    webhookName: { type: String, required: true },
    guildName: { type: String, required: true },
    guildId: { type: String, required: true },
    channelId: { type: String, required: true },
    trigger: { type: String, enum: ["0", "1", "2", "3"], default: "0" },
    action: {
      type: {
        trigger: {
          type: String,
          enum: ["0", "1"],
          default: "0",
        },
        user: String,
        message: { type: String, default: "" },
        mode: {
          type: String,
          enum: ["default", "custom"],
          default: "default",
        },
        isSaved: {
          type: Boolean,
          default: false,
        },
        _id: false
      },
      default: {},
    },
    channelName: { type: String, required: true },
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
      required: true,
    },
    nodeType: {
      type: String,
      required: true,
    },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
  },
  { timestamps: true }
).index({ nodeId: 1 });

export type DiscordType = InferSchemaType<typeof DiscordSchema> & {
  _id?: Types.ObjectId;
};

export const Discord = models.Discord || model("Discord", DiscordSchema);
