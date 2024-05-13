import { NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";
// Import the necessary modules from discord.js
import {
  Client,
  GatewayIntentBits,
  GuildMember,
  Message,
  MessageReaction,
  PartialMessageReaction,
} from "discord.js";
import { Discord, DiscordType } from "@/models/discord-model";
import { User, UserType } from "@/models/user-model";
import { currentUser } from "@clerk/nextjs/server";
import { Workflow, WorkflowType } from "@/models/workflow-model";
import { Slack, SlackType } from "@/models/slack-model";
import { NotionType } from "@/models/notion-model";

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
});

// Log in to Discord with your app's token
client.login(process.env.DISCORD_BOT_TOKEN!);

const reqSchema = z.object({
  publish: z.boolean(),
  workflowId: z.string(),
});

type ConnectionType = {
  connections: {
    discordId: DiscordType[];
    slackId: SlackType[];
    notionId: NotionType[];
  };
};

// googleDrive is not required - but it has to be.
type WorkflowWithConnections = Omit<
  WorkflowType["googleDriveWatchTrigger"],
  "connections"
> &
  ConnectionType;
type DiscordWithConnections = Omit<DiscordType, "connections"> & ConnectionType;
type SlackWithConnections = Omit<SlackType, "connections"> & ConnectionType;

export async function POST(req: NextRequest) {
  try {
    const { publish, workflowId } = reqSchema.parse(await req.json());

    const user = await currentUser();
    const dbUser = await User.findOne<UserType>({ userId: user?.id });

    const workflow = await Workflow.findById<WorkflowWithConnections>(
      workflowId
    ).populate({
      path: "googleDriveWatchTrigger.discordId",
      model: Discord,
    });

    const discord = await Discord.find<DiscordWithConnections>({
      userId: dbUser?._id,
      workflowId,
    });
    const slack = await Slack.find<SlackWithConnections>({
      userId: dbUser?._id,
      workflowId,
    });

    const getChannels = async () => {
      return await Discord.find<DiscordType>(
        { workflowId, userId: dbUser?._id },
        { _id: 0, channelId: 1, trigger: 1, guildId: 1 }
      );
    };

    const onMessageCreate = async (message: Message) => {
      (await getChannels()).forEach((channel) => {
        if (!message.author.bot && channel.channelId === message.channelId) {
          if (
            channel.trigger === "0" &&
            (!!message.mentions.users.size || !!message.mentions.roles.size)
          ) {
            console.log("mention", message);
          } else if (
            channel.trigger === "1" &&
            !(!!message.mentions.users.size || !!message.mentions.roles.size)
          ) {
            console.log("messageCreate", channel);
          }
        }
      });
    };

    const onMessageReactionAdd = async (
      reaction: MessageReaction | PartialMessageReaction
    ) => {
      (await getChannels()).forEach((channel) => {
        if (
          channel.trigger === "2" &&
          channel.channelId === reaction.message.channelId
        ) {
          console.log("after messageReactionAdd", channel);
        }
      });
    };

    const onGuildMemberAdd = async (member: GuildMember) => {
      (await getChannels()).forEach((channel) => {
        if (channel.trigger === "3" && channel.guildId === member.guild.id) {
          console.log("guildMemberAdd", member);
        }
      });
    };

    client.on("messageCreate", onMessageCreate);
    client.on("messageReactionAdd", onMessageReactionAdd);
    client.on("guildMemberAdd", onGuildMemberAdd);
    client.on("error", (error) =>
      console.log("discord socket error:", error.message)
    );

    return new NextResponse(null, { status: 200 });
  } catch (error: any) {
    console.log(error?.message);
    if (error instanceof ZodError) {
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse("Something went wrong! Please try again later", {
      status: 500,
    });
  }
}
