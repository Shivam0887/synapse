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
import { Workflow, WorkflowType } from "@/models/workflow-model";
import { Slack, SlackType } from "@/models/slack-model";
import { Notion, NotionType } from "@/models/notion-model";
import { ConnectionTypes, ResultDataType, ResultType } from "@/lib/types";
import ConnectToDB from "@/lib/connectToDB";
import { Types } from "mongoose";
import { onCreatePage } from "@/app/(main)/(routes)/connections/_actions/notion-action";
import { postContentToWebhook } from "@/app/(main)/(routes)/connections/_actions/discord-action";

import axios from "axios";
import { User, UserType } from "@/models/user-model";
import { getUser } from "@/app/(main)/(routes)/connections/_actions/get-user";

// Create a new client instance
const DiscordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
});

// Log in to Discord with your app's token
DiscordClient.login(process.env.DISCORD_BOT_TOKEN!);

const reqSchema = z.object({
  publish: z.boolean(),
  workflowId: z.string(),
  _id: z.string(),
});

type ConnectionType = {
  connections: {
    discordId: Pick<DiscordType, "_id" | "webhookUrl" | "action">[];
    slackId: Pick<SlackType, "_id" | "webhookUrl" | "action" | "accessToken">[];
    notionId: Pick<NotionType, "nodeId" | "workflowId">[];
  };
};

const result: ResultType = {
  Discord: {
    metaData: {channelId: "", guildId: "", trigger: ""},
    result: []
  },
  Slack: {
    metaData: {channelId: "", teamId: "", trigger: ""},
    result: []
  },
  "Google Drive": {
    result: []
  }
};

async function dfs(
  _id: string,
  nodeType: ConnectionTypes,
  triggerType: ConnectionTypes | "None",
  connections?: {
    discordId: Types.ObjectId[];
    slackId: Types.ObjectId[];
    notionId: Types.ObjectId[];
  }
) {
  if (triggerType === "Notion" || triggerType === "None") return;
  if (triggerType === "Google Drive" && connections) {
    await Promise.all(
      connections.discordId.map(
        async (_id) => await dfs(_id.toJSON(), "Discord", triggerType)
      )
    );

    await Promise.all(
      connections.slackId.map(
        async (_id) => await dfs(_id.toJSON(), "Slack", triggerType)
      )
    );
  } else if(nodeType === "Discord" || nodeType === "Slack"){
    const Model = nodeType === "Discord" ? Discord : Slack;
    const collection = await Model.findById<ConnectionType>(_id, { _id: 0,
      connections: 1,
    })
      .populate({
        path: "connections.discordId",
        select: "_id webhookUrl action",
        model: Discord,
      })
      .populate({
        path: "connections.slackId",
        select: "_id webhookUrl action accessToken",
        model: Slack,
      })
      .populate({
        path: "connections.notionId",
        select: "nodeId workflowId",
        model: Notion,
      });

    if (collection) {
      await Promise.all(
        collection.connections.discordId.map(
          async ({ _id, action, webhookUrl }) => {
            await dfs(_id!.toString(), "Discord", triggerType);
            if (action && webhookUrl) {
              result[triggerType]["result"].push({
                action,
                webhookUrl,
                nodeType: "Discord",
              });
            }
          })
      );

      await Promise.all(
        collection.connections.slackId.map(
          async ({ _id, action, webhookUrl, accessToken }) => {
            await dfs(_id!.toString(), "Slack", triggerType);
            if (action && webhookUrl && accessToken) {
              result[triggerType]["result"].push({
                action,
                webhookUrl,
                nodeType: "Slack",
                accessToken,
              });
            }
          })
      );

      collection.connections.notionId.forEach(
        ({ nodeId, workflowId }) => {
          if(workflowId){
            result[triggerType]["result"].push({
              nodeType: "Notion",
              nodeId,
              workflowId: workflowId.toString()
            });
          }
        }
      )
    }
  }
}
 
const onMessageSend = async ({
  nodeType,
  action,
  webhookUrl,
  nodeId,
  workflowId,
  accessToken,
}: ResultDataType) => {
  if (nodeType === "Notion") {
    await onCreatePage({ workflowId: workflowId!, isTesting: false, nodeId: nodeId! });
  } else if (action?.trigger) {
    if (nodeType === "Discord") {
      if (action.trigger === "1") {
        const user = DiscordClient.users.cache.get(action.user!);
        if (user) user.send(action.message!);
      } else await postContentToWebhook(action.message!, webhookUrl!, nodeType);
    } else {
      if (action.trigger === "1") {
        await axios.post(
          "https://slack.com/api/chat.postMessage",
          { channel: action.user!, text: action.message! },
          {
            headers: {
              Authorization: `Bearer ${accessToken!}`,
            },
          }
        );
      } else await postContentToWebhook(action.message!, webhookUrl!, nodeType);
    }
  }
};

// Currently logged-in user-id 
let UserId = "";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  const teamId = searchParams.get("teamId");
  const channelId = searchParams.get("channelId");
  const isChannel = searchParams.get("isChannel");
  const eventType = searchParams.get("eventType");
  const channelType = searchParams.get("channelType");
  const id = searchParams.get("userId");

  if(id) UserId = id;

  try {
    if (eventType && UserId) {
      ConnectToDB();
      const dbUser = await User.findById<UserType>(UserId, {
        WorkflowToSlack: 1,
      });

      if(dbUser){
        const type = eventType as "0" | "1" | "2" | "3" | "4";
        
        dbUser.WorkflowToSlack.forEach(({ publish, result, metaData }) => {
          if (publish) {
            const isChannelIdExists = !channelId
              ? false
              : metaData?.channelId === channelId;
            const isTeamIdExists = !teamId
              ? false
              : metaData?.teamId === teamId;
            const channel_type = !channelType ? false : channelType === "channel";

            if((type === "0" || type === "1") && type === metaData?.trigger && isChannelIdExists && channel_type){
              result.forEach((data) => { 
                const { webhookUrl, accessToken, nodeType, nodeId, action, workflowId } = data;
                onMessageSend({webhookUrl, accessToken, nodeType, nodeId, action, workflowId})
              })
            } else if(type === "2" && type === metaData?.trigger && isChannelIdExists){
              result.forEach((data) => { 
                const { webhookUrl, accessToken, nodeType, nodeId, action, workflowId } = data;
                onMessageSend({webhookUrl, accessToken, nodeType, nodeId, action, workflowId})
              })
            } else if(type === "3" && type === metaData?.trigger && isChannelIdExists && isChannel){
              result.forEach((data) => { 
                const { webhookUrl, accessToken, nodeType, nodeId, action, workflowId } = data;
                onMessageSend({webhookUrl, accessToken, nodeType, nodeId, action, workflowId})
              })
            } else if(type === "4" && type === metaData?.trigger && isChannelIdExists && channel_type && isTeamIdExists){
              result.forEach((data) => { 
                const { webhookUrl, accessToken, nodeType, nodeId, action, workflowId } = data;
                onMessageSend({webhookUrl, accessToken, nodeType, nodeId, action, workflowId})
              })
            }
          }
        })
      }
    }
    return new NextResponse(null, { status: 200 });
  } catch (error: any) {
    console.log(error?.message);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { publish, workflowId, _id } = reqSchema.parse(await req.json());
    
    ConnectToDB();
    
    const dbUser = await User.findById(_id, {
      WorkflowToDiscord: 1,
      WorkflowToSlack: 1,
    });
    
    if (dbUser) {
      UserId = _id;
      const WorkflowToDiscord = dbUser.WorkflowToDiscord;
      const WorkflowToSlack = dbUser.WorkflowToSlack;

      const workflow = await Workflow.findById<WorkflowType>(workflowId, {
        parentTrigger: 1,
        parentId: 1,
      });

      if (workflow?.parentTrigger && publish) {
        if (workflow.parentTrigger === "Google Drive") {
          const collection = await Workflow.findById<Pick<WorkflowType, "googleDriveWatchTrigger">>(
            workflowId,
            { googleDriveWatchTrigger: 1 }
          );
          if (collection && collection.googleDriveWatchTrigger?.connections) {
            await dfs(
              "",
              "Google Drive",
              "Google Drive",
              collection.googleDriveWatchTrigger.connections
            );
          }
        } else if (workflow.parentId && workflow.parentTrigger !== "None") {
          const Model = workflow.parentTrigger === "Discord" ? Discord : Slack;
          const collection = await Model.findById(workflow.parentId);

          if (workflow.parentTrigger === "Discord" && collection.channelId && collection.guildId && collection.trigger){
            result["Discord"]["metaData"] = {
              channelId: collection.channelId,
              guildId: collection.guildId,
              trigger: collection.trigger,
            };
          }

          if(workflow.parentTrigger === "Slack" && collection.channelId && collection.teamId && collection.trigger){
            axios
                .get("http://localhost:3000/api/automate", {
                  params: {
                    userId: _id,
                  },
                })
                .then((data) => console.log(data.status))
                .catch((error) => console.log(error));

            result["Slack"]["metaData"] = {
              channelId: collection.channelId,
              teamId: collection.teamId,
              trigger: collection.trigger,
            };
          }

          if (collection) 
            await dfs(collection._id, workflow.parentTrigger, workflow.parentTrigger);
        }

        if (workflow.parentTrigger === "Discord") {
          WorkflowToDiscord.set(workflowId, {
            publish,
            metaData: result["Discord"]["metaData"],
            result: result["Discord"]["result"],
          });
          await dbUser.save();
        }
        if (workflow.parentTrigger === "Slack") {
          WorkflowToSlack.set(workflowId, {
            publish,
            metaData: result["Slack"]["metaData"],
            result: result["Slack"]["result"],
          });
          await dbUser.save();
        }
      }

      if (workflow?.parentTrigger && !publish) {
        if (workflow.parentTrigger === "Discord" && WorkflowToDiscord.has(workflowId)) {
          WorkflowToDiscord.delete(workflowId);
          await dbUser.save();
        } else if (workflow.parentTrigger === "Slack" && WorkflowToSlack.has(workflowId)) {
          WorkflowToSlack.delete(workflowId);
          await dbUser.save();
        }
      }

      // const onMessageCreate = async (message: Message) => {
      //   result["Discord"]["metaData"].forEach(({ channelId }) => {
      //     if (!message.author.bot && channelId === message.channelId) {
      //       result["Discord"]["0"].forEach((data) => {
      //         if (!(!!message.mentions.users.size || !!message.mentions.roles.size))
      //           onMessageSend({ ...data, workflowId });
      //       });

      //       result["Discord"]["1"].forEach((data) => {
      //         if (!!message.mentions.users.size || !!message.mentions.roles.size)
      //           onMessageSend({ ...data, workflowId });
      //       });
      //     }
      //   });
      // };

      // const onMessageReactionAdd = async (reaction: MessageReaction | PartialMessageReaction) => {
      //   result["Discord"]["metaData"].forEach(({ channelId }) => {
      //     if (channelId === reaction.message.channelId) {
      //       result["Discord"]["2"].forEach((data) => onMessageSend({ ...data, workflowId }));
      //     }
      //   });
      // };

      // const onGuildMemberAdd = async (member: GuildMember) => {
      //   result["Discord"]["metaData"].forEach(({ guildId }) => {
      //     if (guildId === member.guild.id) {
      //       result["Discord"]["3"].forEach((data) => onMessageSend({ ...data, workflowId }));
      //     }
      //   });
      // };

      // if (publish) {
      //   console.log("published");
      //   DiscordClient.on("messageCreate", onMessageCreate);
      //   DiscordClient.on("messageReactionAdd", onMessageReactionAdd);
      //   DiscordClient.on("guildMemberAdd", onGuildMemberAdd);
      // } else {
      //   console.log("Unpublished");
      //   DiscordClient.off("messageCreate", onMessageCreate);
      //   DiscordClient.off("messageReactionAdd", onMessageReactionAdd);
      //   DiscordClient.off("guildMemberAdd", onGuildMemberAdd);
      // }

      // DiscordClient.on("error", (error) =>
      //   console.log("discord socket error:", error.message)
      // );
    }
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

