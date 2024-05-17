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
      default: () => "Free",
    },
    credits: {
      type: String,
      default: () => "10",
    },
    workflowId: [
      {
        type: Schema.Types.ObjectId,
        ref: "Workflow",
      },
    ],
    currentWorkflowId: String,
    WorkflowToDiscord: {
      type: Map,
      of: {
        publish: Boolean,
        metaData: {
          channelId: String,
          guildId: String,
          trigger: String,
        },
        result: [
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
      },
      default: () => {},
    },
    WorkflowToSlack: {
      type: Map,
      of: {
        publish: Boolean,
        metaData: {
          channelId: String,
          teamId: String,
          trigger: String,
        },
        result: [
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
      },
      default: () => {},
    },
  },
  { timestamps: true }
);

UserSchema.index({ userId: 1 }, { unique: true });

export type UserType = InferSchemaType<typeof UserSchema> & {
  _id?: Types.ObjectId;
};
export const User = models?.User || model("User", UserSchema);
