import { models, model, Schema, InferSchemaType, Types } from "mongoose";

export const UserSchema = new Schema(
  {
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
      type: String,
      default: () => "10",
    },
    connectionId: [
      {
        type: Schema.Types.ObjectId,
        ref: "Connection",
      },
    ],
    workflowId: [
      {
        type: Schema.Types.ObjectId,
        ref: "Workflow",
      },
    ],
    currentWorkflowId: String,
  },
  { timestamps: true }
);

UserSchema.index({ userId: 1 }, { unique: true });

export type UserType = InferSchemaType<typeof UserSchema> & {
  _id?: Types.ObjectId;
};
export const User = models.User || model("User", UserSchema);
