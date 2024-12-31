import { models, model, Schema } from "mongoose";

const LogSchema = new Schema({
  userId: {
    type: String,
    required: true,
  },
  logs: [
    {
      status: {
        type: Boolean,
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
}).index({ userId: 1 });

export const Log = models.Log || model("Log", LogSchema);
