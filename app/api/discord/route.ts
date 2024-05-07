import { Discord, DiscordType } from "@/models/discord-model";
import { Client, GatewayIntentBits } from "discord.js";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Create a new client instance
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

// Log in to Discord with your app's token
client.login(process.env.DISCORD_BOT_TOKEN!);

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
        const guild = await client.guilds.fetch(discordInstance.guildId!);
        const channel = await guild?.channels.fetch(discordInstance.channelId!);
        const members = (await channel?.guild.members.fetch())?.toJSON();

        members?.forEach((member) => {
          if (!member.user.bot) {
            users.push({ id: member.user.id, username: member.user.username });
          }
        });
      };

      // Wait for the ready event before fetching members
      await new Promise((resolve, reject) => {
        client.once("ready", async () => {
          try {
            await fetchMembers();
            resolve("users");
          } catch (error) {
            reject(error);
          }
        });
      });

      return NextResponse.json({ success: true, users }, { status: 200 });
    } else {
      return NextResponse.json(
        { success: false, message: "not found" },
        { status: 400 }
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
