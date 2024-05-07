import { models, model, Schema, InferSchemaType, Types } from "mongoose";

export const SlackSchema = new Schema(
  {
    appId: { type: String, required: true },
    authenticated_userId: { type: String, required: true },
    authenticated_userToken: { type: String, unique: true },
    botUserId: { type: String, required: true },
    teamId: { type: String, required: true },
    teamName: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    accessToken: { type: String, unique: true },
    nodeId: { type: String, unique: true },
    nodeType: {
      type: String,
      default: () => "Slack",
    },
    channelId: { type: String, unique: true },
    webhookUrl: { type: String, unique: true },
    trigger: String,
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
    connectionId: [
      {
        type: Schema.Types.ObjectId,
        ref: "Connection",
      },
    ],
    workflowId: {
      type: Schema.Types.ObjectId,
      ref: "Workflow",
    },
  },
  { timestamps: true }
);

SlackSchema.index({ nodeId: 1 });

export type SlackType = InferSchemaType<typeof SlackSchema> & {
  _id?: Types.ObjectId;
};
export const Slack = models.Slack || model("Slack", SlackSchema);
