import { ConnectionsProvider } from "@/providers/connections-provider";
import EditorProvider from "@/providers/editor-provider";
import Editor from "../_components/editor";
import { StoreProvider } from "@/providers/store-provider";
import { currentUser } from "@clerk/nextjs/server";
import { User } from "@/models/user-model";
import ConnectToDB from "@/lib/connectToDB";

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

const Page = async ({ params }: { params: { editorId: string } }) => {
  const { editorId: workflowId } = params;

  ConnectToDB();
  const user = await currentUser();
  const dbUser = await User.findOneAndUpdate(
    { userId: user?.id },
    {
      $set: {
        currentWorkflowId: workflowId,
      },
    }
  );

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

  return (
    <div className="h-full">
      <EditorProvider>
        <StoreProvider>
          <ConnectionsProvider>
            <Editor />
          </ConnectionsProvider>
        </StoreProvider>
      </EditorProvider>
    </div>
  );
};

export default Page;
