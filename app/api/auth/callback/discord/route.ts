import axios from "axios";
import ConnectToDB from "@/lib/connectToDB";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse, NextRequest } from "next/server";

import { Discord } from "@/models/discord-model";
import { Workflow } from "@/models/workflow-model";
import { User, UserType } from "@/models/user-model";
import { absolutePathUrl } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const user = await currentUser();
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return new NextResponse("Code not provided", { status: 400 });
  }
  if (!user) {
    return new NextResponse("user not authenticated", { status: 401 });
  }

  try {
    ConnectToDB();
    const dbUser = await User.findOne<UserType>({ userId: user.id });

    const response = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        code,
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: "authorization_code",
        redirect_uri: `${absolutePathUrl()}/api/auth/callback/discord`,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (response && response.data) {
      ConnectToDB();
      const accessToken = response.data.access_token;
      const refreshToken = response.data.refresh_token;

      const UserGuilds: any = await axios.get(
        `https://discord.com/api/v10/users/@me/guilds`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const UserGuild = UserGuilds.data.filter(
        (guild: any) => guild.id == response.data.webhook.guild_id
      );

      const channels = await axios.get(
        `https://discord.com/api/v10/guilds/${UserGuild[0].id}/channels`,
        {
          headers: {
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN!}`,
          },
        }
      );

      const channel = channels?.data?.find(
        (channel: any) => channel.guild_id === UserGuild[0].id
      );

      const nodeMetaData = await Workflow.findById(dbUser?.currentWorkflowId, {
        selectedNodeId: 1,
        selectedNodeType: 1,
      });

      if (
        channel &&
        nodeMetaData?.selectedNodeId &&
        nodeMetaData.selectedNodeType === "Discord"
      ) {
        const discord = await Discord.create({
          workflowId: dbUser?.currentWorkflowId,
          userId: dbUser?._id,
          webhookId: response.data.webhook.id,
          webhookName: response.data.webhook.name,
          webhookUrl: response.data.webhook.url,
          guildId: response.data.webhook.guild_id,
          guildName: UserGuild[0].name,
          template: "",
          channelId: response.data.webhook.channel_id,
          channelName: channel.name,
          accessToken,
          refreshToken,
          nodeId: nodeMetaData.selectedNodeId,
          nodeType: nodeMetaData.selectedNodeType,
        });

        await Workflow.findByIdAndUpdate(dbUser?.currentWorkflowId, {
          $push: {
            discordId: discord?._id,
          },
        });
      }
    }

    return NextResponse.redirect(
      `${absolutePathUrl()}/workflows/editor/${dbUser?.currentWorkflowId}`
    );
  } catch (error: any) {
    console.log(error?.message);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
