"use server";

import ConnectToDB from "@/lib/connectToDB";
import { Option } from "@/lib/types";
import { Connection, ConnectionType } from "@/models/connection-model";
import { Slack } from "@/models/slack-model";
import { User } from "@/models/user-model";
import { Workflow } from "@/models/workflow-model";
import { currentUser } from "@clerk/nextjs/server";
import axios from "axios";
import { Types } from "mongoose";

type Props = {
  appId: string;
  userId: string;
  botUserId: string;
  teamId: string;
  teamName: string;
  slackAccessToken: string;
  authenticated_userId: string;
  authenticated_userToken: string;
  workflowId: string;
};

export const onSlackConnect = async ({
  appId,
  authenticated_userId,
  authenticated_userToken,
  botUserId,
  slackAccessToken,
  teamId,
  teamName,
  userId,
  workflowId,
}: Props) => {
  if (slackAccessToken) {
    ConnectToDB();
    const user = await User.findOne({ userId });

    const slack = await Slack.findOne<{ _id: Types.ObjectId } | null>({
      slackAccessToken,
      userId: user?._id,
    });

    if (!slack) {
      const workflow = await Workflow.findById(workflowId);
      const slackInstance = await Slack.create({
        userId: user?._id,
        appId,
        authenticated_userId,
        authenticated_userToken,
        slackAccessToken,
        botUserId,
        teamId,
        teamName,
        Wokflow: [workflow],
      });

      await Workflow.findByIdAndUpdate(workflowId, {
        $push: {
          Slack: slackInstance,
        },
      });

      const newConnection: ConnectionType | undefined = await Connection.create(
        {
          userId: user?._id,
          type: "Slack",
          slackId: slackInstance?._id,
        }
      );

      await Slack.findByIdAndUpdate(slackInstance?._id, {
        $push: {
          connections: newConnection,
        },
      });

      await User.findByIdAndUpdate(user?._id, {
        $push: {
          connections: newConnection,
          Slack: slackInstance,
        },
      });
    }
  }
};

export const getSlackMetaData = async (workflowId: string, nodeId: string) => {
  ConnectToDB();
  const user = await currentUser();

  const dbUser = await User.findOne({ userId: user?.id });

  if (dbUser) {
    const slack = await Slack.findOne({
      userId: dbUser?._id,
      workflowId,
      nodeId,
    });

    if (slack) {
      return JSON.stringify(slack);
    }
  }
};

export async function listBotChannels(
  slackAccessToken: string
): Promise<Option[] | undefined> {
  const url = `https://slack.com/api/conversations.list?${new URLSearchParams({
    types: "public_channel,private_channel",
    limit: "200",
  })}`;

  try {
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${slackAccessToken}` },
    });

    if (!data.ok) throw new Error(data.error);

    if (!data?.channels?.length) return [];

    return data.channels
      .filter((ch: any) => ch.is_member)
      .map((ch: any) => {
        return { label: ch.name, value: ch.id };
      });
  } catch (error: any) {
    console.error("Error listing bot channels:", error.message);
  }
}

const postMessageInSlackChannel = async (
  slackAccessToken: string,
  slackChannel: string,
  content: string
) => {
  try {
    await axios.post(
      "https://slack.com/api/chat.postMessage",
      { channel: slackChannel, text: content },
      {
        headers: {
          Authorization: `Bearer ${slackAccessToken}`,
          "Content-Type": "application/json;charset=utf-8",
        },
      }
    );
    console.log(`Message posted successfully to channel ID: ${slackChannel}`);
  } catch (error: any) {
    console.error(
      `Error posting message to Slack channel ${slackChannel}:`,
      error?.response?.data || error.message
    );
  }
};

// Wrapper function to post messages to multiple Slack channels
export const postMessageToSlack = async (
  slackAccessToken: string,
  selectedSlackChannels: Option[],
  content: string
) => {
  if (!content) return { message: "content is empty" };
  if (!selectedSlackChannels.length) return { message: "channel not selected" };

  try {
    selectedSlackChannels.forEach(({ value }) => {
      postMessageInSlackChannel(slackAccessToken, value, content);
    });

    return { message: "success" };
  } catch (error) {
    return { message: "message could not be sent to Slack" };
  }
};
