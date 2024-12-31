import { z } from "zod";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

import { Discord, DiscordType } from "@/models/discord.model";
import { APIGuildChannel, GuildChannelType, APIGuildMember } from "discord-api-types/v10";

const reqBodySchema = z.object({
  workflowId: z.string(),
  nodeId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const reqBody = await req.json();
    const { nodeId, workflowId } = reqBodySchema.parse(reqBody);

    const users: { id: string; username: string }[] = [];

    const discordInstance = await Discord.findOne<DiscordType>(
      { nodeId, workflowId },
      { _id: 0, guildId: 1, channelId: 1 }
    );

    if (discordInstance) {
      const fetchMembers = async () => {
        const guild = await axios.get<APIGuildChannel<GuildChannelType>[]>(`https://discord.com/api/v10/guilds/${discordInstance.guildId!}/channels`, {
          headers: {
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN!}`
          }
        });
        const channel = guild.data.some(({ id }) => id === discordInstance.channelId!);

        if(channel) {
          const members = await axios.get<APIGuildMember[]>(`https://discord.com/api/v10/guilds/${discordInstance.guildId!}/members?limit=1000`, {
            headers: {
              Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN!}`
            }
          });

          members.data.forEach(({ user }) => {
            if (!user?.bot) {
              users.push({ id: user.id, username: user.username });
            }
          });
        }       
      };

      await fetchMembers();
           
      return NextResponse.json({ success: true, users }, { status: 200 });
    } else {
      return NextResponse.json(
        { success: false, message: "not found" },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.log(error?.message);
    return NextResponse.json(
      { success: false, error: error?.message },
      { status: 500 }
    );
  }
}
