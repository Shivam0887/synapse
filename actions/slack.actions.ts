"use server";

import ConnectToDB from "@/lib/connectToDB";
import { auth } from "@clerk/nextjs/server";
import { Slack, SlackType } from "@/models/slack.model";
import { TActionResponse } from "@/lib/types";

export const getSlackMetaData = async (
  nodeId: string
): Promise<TActionResponse<Pick<SlackType, "channelName" | "teamName" | "webhookUrl">>> => {
  try {
    await ConnectToDB();
    const { userId } = await auth();

    if(!userId) return {
      success: false,
      error: "user is not authenticated"
    }

    const slack = await Slack.findOne({
      nodeId,
    }, { _id: 0, channelName: 1, teamName: 1, webhookUrl: 1 });

    if (!slack) return { success: false, error: "Failed to get slack meta data" };
    
    return { success: true, data: slack._doc };
  } catch (error: any) {
    console.log("Discord metadata error: ", error?.message);
    return { success: false, error: "Failed to get slack meta data" };
  }
};
