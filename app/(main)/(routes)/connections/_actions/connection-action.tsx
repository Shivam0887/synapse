"use server";

import ConnectToDB from "@/lib/connectToDB";
import { ConnectionTypes } from "@/lib/types";
import { Discord } from "@/models/discord-model";
import { Notion } from "@/models/notion-model";
import { Slack } from "@/models/slack-model";
import { User, UserType } from "@/models/user-model";
import { currentUser } from "@clerk/nextjs/server";

export const getTrigger = async (
  workflowId: string,
  nodeId: string,
  nodeType: ConnectionTypes
) => {
  try {
    ConnectToDB();
    const user = await currentUser();
    const dbUser = await User.findOne<UserType>({
      userId: user?.id,
    });

    if (dbUser && workflowId && nodeId) {
      const Model =
        nodeType === "Discord"
          ? Discord
          : nodeType === "Notion"
          ? Notion
          : Slack;

      const response = await Model.findOne(
        { userId: dbUser?._id, workflowId, nodeId },
        {
          _id: 0,
          trigger: 1,
          channelName: 1,
        }
      );

      if (response)
        return JSON.stringify({
          success: true,
          data: {
            trigger: response.trigger,
            channelName: response.channelName,
          },
        });
    }

    return JSON.stringify({
      success: false,
      message: "parameters are missing",
    });
  } catch (error: any) {
    console.log(error?.message);
    return JSON.stringify({ success: false, error: error?.message });
  }
};

export const onSaveTrigger = async (
  workflowId: string,
  nodeId: string,
  trigger: string,
  nodeType: ConnectionTypes
) => {
  try {
    ConnectToDB();
    const user = await currentUser();
    const dbUser = await User.findOne<UserType>({
      userId: user?.id,
    });

    if (dbUser && workflowId && nodeId) {
      const Model =
        nodeType === "Discord"
          ? Discord
          : nodeType === "Notion"
          ? Notion
          : Slack;

      const response = await Model.findOneAndUpdate(
        { userId: dbUser?._id, workflowId, nodeId },
        {
          $set: {
            trigger,
          },
        }
      );

      if (response)
        return JSON.stringify({
          success: true,
          data: "trigger saved successfully!",
        });
    }

    return JSON.stringify({
      success: false,
      message: "parameters are missing",
    });
  } catch (error: any) {
    console.log(error?.message);
    return JSON.stringify({ success: false, error: error?.message });
  }
};
