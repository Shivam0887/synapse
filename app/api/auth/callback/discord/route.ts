import ConnectToDB from "@/lib/connectToDB";
import { NextResponse, NextRequest } from "next/server";

import { Discord } from "@/models/discord.model";
import { Workflow } from "@/models/workflow.model";
import { User, UserType } from "@/models/user.model";
import { absolutePathUrl, oauthRedirectUri } from "@/lib/utils";

import {
  RESTAPIPartialCurrentUserGuild,
  APIGuildChannel,
  ChannelType,
} from "discord-api-types/v10";

const clientId = process.env.DISCORD_CLIENT_ID!;
const clientSecret = process.env.DISCORD_CLIENT_SECRET!;
const redirectUri = oauthRedirectUri + "/discord";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const userId = req.nextUrl.searchParams.get("state");

  if (!code) {
    return new NextResponse("Code not provided", { status: 400 });
  }
  if (!userId) {
    return new NextResponse("user not authenticated", { status: 401 });
  }

  try {
    await ConnectToDB();
    const dbUser = await User.findOne<UserType>({ userId });

    const response = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) throw new Error("Discord connection error");

    const data = await response.json();

    const accessToken = data.access_token;
    const refreshToken = data.refresh_token;

    const UserGuilds = (await (
      await fetch("https://discord.com/api/v10/users/@me/guilds", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    ).json()) as RESTAPIPartialCurrentUserGuild[];

    const UserGuild = UserGuilds.filter(
      (guild) => guild.id == data.webhook.guild_id
    );

    const channels = (await (
      await fetch(
        `https://discord.com/api/v10/guilds/${UserGuild[0].id}/channels`,
        {
          headers: {
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN!}`,
          },
        }
      )
    ).json()) as APIGuildChannel<ChannelType>[];

    const channel = channels.find(
      (channel) => channel.guild_id === UserGuild[0].id
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
        webhookId: data.webhook.id,
        webhookName: data.webhook.name,
        webhookUrl: data.webhook.url,
        guildId: data.webhook.guild_id,
        guildName: UserGuild[0].name,
        template: "",
        channelId: data.webhook.channel_id,
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

    return NextResponse.redirect(
      `${absolutePathUrl}/workflows/editor/${dbUser?.currentWorkflowId}`
    );
  } catch (error) {
    if (error instanceof Error)
      console.log("Failed to connect with Discord:", error.message);

    return new NextResponse(
      "Internal Server Error. Failed to connect with Discord",
      { status: 500 }
    );
  }
}
