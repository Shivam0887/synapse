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
    localImageUrl: String,
    tier: {
      type: String,
      default: () => "Free Plan",
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
    WorkflowToDrive: {
      type: Map,
      of: [
        {
          webhookUrl: String,
          action: {
            mode: {
              type: String,
              enum: ["default", "custom"],
            },
            message: String,
            trigger: String,
            user: String,
          },
          nodeId: String,
          nodeType: {
            type: String,
            enum: ["Discord", "Notion", "Slack"],
            required: true,
          },
          accessToken: String,
          workflowId: String,
        },
      ],
      default: () => {},
    },
    logs: [
      {
        status: {
          type: Boolean,
          enum: [true, false],
          required: true,
        },
        action: {
          type: String,
          required: true,
        },
        message: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

UserSchema.index({ userId: 1 }, { unique: true });

export type UserType = InferSchemaType<typeof UserSchema> & {
  _id?: Types.ObjectId;
};

export const User = models?.User || model("User", UserSchema);
