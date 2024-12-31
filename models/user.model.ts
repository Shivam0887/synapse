import { models, model, Schema, InferSchemaType, Types } from "mongoose";

const UserSchema = new Schema(
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
    localImageUrl: String,
    tier: {
      type: String,
      enum: ["Free", "Pro", "Premium"],
      default: () => "Free",
    },
    credits: {
      type: String,
      default: () => "10",
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    stripePriceId: String,
    stripeCurrentPeriodEnd: Date,
    workflowId: [
      {
        type: Schema.Types.ObjectId,
        ref: "Workflow",
      },
    ],
    workflowPublishCount: {
      type: Number,
      default: () => 0,
    },
    isAutoSave: {
      type: Boolean,
      enum: [true, false],
      default: () => false,
    },
    currentWorkflowId: String,
    logId: {
      type: Schema.Types.ObjectId,
      ref: "Log",
    },
  },
  { timestamps: true }
).index({ userId: 1 });

export type UserType = InferSchemaType<typeof UserSchema> & {
  _id?: Types.ObjectId;
};

export const User = models?.User || model("User", UserSchema);
