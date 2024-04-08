import { models, model, Schema, InferSchemaType, Types } from "mongoose";

export const LocalGoogleCredentialSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  accessToken: {
    type: String,
    unique: true,
  },
  folderId: String,
  pageToken: String,
  channelId: {
    type: String,
    unique: true,
  },
  subscribed: {
    type: Boolean,
    default: () => false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export type LocalGoogleCredentialType = InferSchemaType<
  typeof LocalGoogleCredentialSchema
> & {
  _id: Types.ObjectId;
};
export const LocalGoogleCredential =
  models.LocalGoogleCredential ||
  model("LocalGoogleCredential", LocalGoogleCredentialSchema);
