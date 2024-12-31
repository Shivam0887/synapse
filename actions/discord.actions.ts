"use server";

import ConnectToDB from "@/lib/connectToDB";
import { TActionResponse } from "@/lib/types";
import { Discord, DiscordType } from "@/models/discord.model";
import { auth } from "@clerk/nextjs/server";

export const getDiscordMetaData = async (
  nodeId: string
): Promise<
  TActionResponse<Pick<DiscordType, "webhookUrl" | "guildName" | "channelName">>
> => {
  try {
    await ConnectToDB();
    const { userId } = await auth();
    if (!userId)
      return {
        success: false,
        error: "user is not authenticated",
      };

    const webhook = await Discord.findOne(
      { nodeId },
      {
        _id: 0,
        webhookUrl: 1,
        guildName: 1,
        channelName: 1,
      }
    );

    if (webhook)
      return {
        success: true,
        data: webhook._doc,
      };

    return { success: false, error: "Discord webhook not found" };
  } catch (error: any) {
    console.log("Discord metadata error:", error?.message);
    return {
      success: false,
      error: error?.message,
    };
  }
};
