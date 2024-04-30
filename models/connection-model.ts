import { models, model, Schema, InferSchemaType, Types } from "mongoose";

export const ConnectionSchema = new Schema(
  {
    type: { type: String, unique: true },
    discordId: {
      type: Schema.Types.ObjectId,
      ref: "Discord",
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
  },
  { timestamps: true }
);

export type ConnectionType = InferSchemaType<typeof ConnectionSchema> & {
  _id?: Types.ObjectId;
};
export const Connection =
  models.Connection || model("Connection", ConnectionSchema);
