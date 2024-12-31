import { models, model, Schema, InferSchemaType, Types } from "mongoose";

const SlackSchema = new Schema(
  {
    appId: { type: String, required: true },
    authenticated_userId: { type: String, required: true },
    authenticated_userToken: String,
    botUserId: { type: String, required: true },
    teamId: { type: String, required: true },
    teamName: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    accessToken: { type: String, required: true },
    nodeId: { type: String, required: true },
    nodeType: {
      type: String,
      required: true,
    },
    channelId: { type: String, required: true },
    webhookUrl: { type: String, required: true },
    trigger: { type: String, enum: ["0", "1", "2", "3", "4"], default: "0" },
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
  },
  { timestamps: true }
).index({ nodeId: 1 });

export type SlackType = InferSchemaType<typeof SlackSchema> & {
  _id?: Types.ObjectId;
};
export const Slack = models?.Slack || model("Slack", SlackSchema);
