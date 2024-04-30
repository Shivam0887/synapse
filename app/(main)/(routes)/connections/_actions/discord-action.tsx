"use server";

import ConnectToDB from "@/lib/connectToDB";
import { ConnectionTypes } from "@/lib/types";
import { Discord } from "@/models/discord-model";
import { User, UserType } from "@/models/user-model";
import { currentUser } from "@clerk/nextjs/server";
import axios from "axios";

export const getDiscordMetaData = async (
  workflowId: string,
  nodeId: string
) => {
  try {
    ConnectToDB();
    const user = await currentUser();
    const dbUser = await User.findOne<UserType>({
      userId: user?.id,
    });

    if (dbUser && workflowId && nodeId) {
      const webhook = await Discord.findOne(
        { userId: dbUser?._id, workflowId, nodeId },
        {
          _id: 0,
          webhookUrl: 1,
          webhookName: 1,
          guildName: 1,
          channelName: 1,
        }
      );

      if (webhook) return JSON.stringify(webhook);
    }
  } catch (error: any) {
    console.log(error?.message);
  }
};

export const postContentToWebhook = async (
  content: string,
  webhookUrl: string,
  nodeType: ConnectionTypes
) => {
  if (content) {
    const format =
      nodeType === "Discord"
        ? { content }
        : nodeType === "Slack"
        ? { text: content }
        : {};
    const isPosted = await axios.post(webhookUrl, format);
    if (isPosted) return { message: "success" };
    return { message: "failed request" };
  }

  return { message: "content not provided" };
};
