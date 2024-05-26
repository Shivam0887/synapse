import axios from "axios";
import { ZodError, z } from "zod";
import { absolutePathUrl } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

import ConnectToDB from "@/lib/connectToDB";
import { ConnectionTypes, ResultDataType, ResultType } from "@/lib/types";

import { User } from "@/models/user-model";
import { Slack, SlackType } from "@/models/slack-model";
import { Notion, NotionType } from "@/models/notion-model";
import { Discord, DiscordType } from "@/models/discord-model";
import { Workflow, WorkflowType } from "@/models/workflow-model";

import { onCreatePage } from "@/app/(main)/(routes)/connections/_actions/notion-action";
import { postContentToWebhook } from "@/app/(main)/(routes)/connections/_actions/discord-action";

import { ChannelCreatedEvent, KnownEventFromType, MemberJoinedChannelEvent, ReactionAddedEvent } from "@slack/bolt";
import { Client, GatewayIntentBits, GuildMember, Message, MessageReaction, PartialMessageReaction } from 'discord.js';

import { SocketModeClient } from "@slack/socket-mode";

export const SlackClient = new SocketModeClient({
  appToken: process.env.SLACK_APP_TOKEN!,
});

export const DiscordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
});

const reqSchema = z.object({
  publish: z.boolean(),
  workflowId: z.string(),
  _id: z.string(),
  clerkUserId: z.string(),
});

type ConnectionType = {
  webhookUrl?: string | null;
  nodeId: string;
  workflowId: string;
  accessToken: string;
  action?: {
    mode: "default" | "custom";
    message: string;
    trigger: string | null;
    user?: string | null;
  } | null;
  connections: {
    discordId: Pick<DiscordType, "_id" | "webhookUrl" | "action">[];
    slackId: Pick<SlackType, "_id" | "webhookUrl" | "action" | "accessToken">[];
    notionId: Pick<NotionType, "nodeId" | "workflowId">[];
  };
};

async function dfs(
  _id: string,
  nodeType: ConnectionTypes,
  triggerType: ConnectionTypes | "None",
  isInitial: boolean,
  result: ResultType
) {
  if (triggerType === "Notion" || triggerType === "None") return;
  if (nodeType === "Discord" || nodeType === "Slack" || nodeType === "Notion") {
    const Model = nodeType === "Discord" ? Discord : nodeType === "Slack" ? Slack : Notion;

    const collection = await Model.findById<ConnectionType>(_id, {
      _id: 0,
      action: 1,
      webhookUrl: 1,
      nodeId: 1,
      workflowId: 1,
      accessToken: 1,
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

    if (isInitial && collection && triggerType === "Google Drive") {
      const { accessToken, nodeId, workflowId, action, webhookUrl } =
        collection;
      if (nodeType === "Discord" && action && webhookUrl) {
        result[triggerType].push({
          action,
          webhookUrl,
          nodeType: "Discord",
        });
      } else if (nodeType === "Slack" && action && webhookUrl && accessToken) {
        result[triggerType].push({
          action,
          webhookUrl,
          nodeType: "Slack",
          accessToken,
        });
      } else if (nodeType === "Notion" && workflowId) {
        result[triggerType].push({
          nodeType: "Notion",
          nodeId,
          workflowId: workflowId.toString(),
        });
      }
    }

    if (collection) {
      await Promise.all(
        collection.connections.discordId.map(
          async ({ _id, action, webhookUrl }) => {
            await dfs(_id!.toString(), "Discord", triggerType, false, result);
            if (action && webhookUrl) {
              result[triggerType].push({
                action,
                webhookUrl,
                nodeType: "Discord",
              });
            }
          }
        )
      );

      await Promise.all(
        collection.connections.slackId.map(
          async ({ _id, action, webhookUrl, accessToken }) => {
            await dfs(_id!.toString(), "Slack", triggerType, false, result);
            if (action && webhookUrl && accessToken) {
              result[triggerType].push({
                action,
                webhookUrl,
                nodeType: "Slack",
                accessToken,
              });
            }
          }
        )
      );

      collection.connections.notionId.forEach(({ nodeId, workflowId }) => {
        if (workflowId) {
          result[triggerType].push({
            nodeType: "Notion",
            nodeId,
            workflowId: workflowId.toString(),
          });
        }
      });
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
  DiscordClient
}: ResultDataType & { DiscordClient?: Client<boolean> }) => {
  if (nodeType === "Notion") {
    await onCreatePage({
      workflowId: workflowId!,
      isTesting: false,
      nodeId: nodeId!,
    });
  } else if (action?.trigger) {
    if (nodeType === "Discord") {
      if (action.trigger === "1") {
        const user = DiscordClient!.users.cache.get(action.user!);
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

export async function POST(req: NextRequest) {
  try {
    const { publish, workflowId, _id, clerkUserId } = reqSchema.parse(await req.json());

    const result: ResultType = {
      Discord: [],
      Slack: [],
      "Google Drive": [],
    };
    

    ConnectToDB();

    const dbUser = await User.findById(_id, {
      WorkflowToDrive: 1,
    });

    if (dbUser) {
      const WorkflowToDrive = dbUser.WorkflowToDrive;

      const workflow = await Workflow.findById<Pick<WorkflowType, "_id" | "parentId" | "parentTrigger" | "googleDriveWatchTrigger">>(
        workflowId, 
        {
          parentTrigger: 1,
          parentId: 1,
          googleDriveWatchTrigger: 1,
        }
      );

      if (workflow?.parentTrigger && publish) {
        if (workflow.parentTrigger === "Google Drive" && workflow.googleDriveWatchTrigger?.connections) {
          const { discordId, notionId, slackId } = workflow.googleDriveWatchTrigger.connections;

          await Promise.all(
            discordId.map(async ({ _id }) => {
              await dfs(_id.toString(), "Discord", workflow.parentTrigger, true, result);
            })
          );

          await Promise.all(
            slackId.map(async ({ _id }) => {
              await dfs(_id.toString(), "Slack", workflow.parentTrigger, true, result);
            })
          );

          await Promise.all(
            notionId.map(async ({ _id }) => {
              await dfs(_id.toString(), "Notion", workflow.parentTrigger, true, result);
            })
          );

          WorkflowToDrive.set(workflowId, result["Google Drive"]);
          await dbUser.save();

          await axios.get(`${absolutePathUrl()}/api/drive/watch?workflowId=${workflowId}&userId=${clerkUserId}`);
        } 
        else if (workflow.parentId && (workflow.parentTrigger === "Discord" || workflow.parentTrigger === "Slack")) {
          const Model = workflow.parentTrigger === "Discord" ? Discord : Slack;
          const collection = await Model.findById(workflow.parentId);

          if (workflow.parentTrigger === "Discord" && collection.channelId && collection.guildId && collection.trigger) {
            await dfs(collection._id, workflow.parentTrigger, workflow.parentTrigger, false, result);

            await DiscordClient.login(process.env.DISCORD_BOT_TOKEN!);

            if (collection.trigger === "0" || collection.trigger === "1"){
              async function onDiscordMessageCreate (message: Message) {
                const workflow = await Workflow.findById(workflowId, { _id: 0, publish: 1 });
                if(workflow && !workflow.publish){
                  DiscordClient.off("messageCreate", onDiscordMessageCreate);
                }
                else if (!message.author.bot && collection.channelId === message.channelId) {
                  result["Discord"].forEach((data) => {
                    if (!(!!message.mentions.users.size || !!message.mentions.roles.size))
                      onMessageSend(data);
                  });
              
                  result["Discord"].forEach((data) => {
                    if (!!message.mentions.users.size || !!message.mentions.roles.size)
                      onMessageSend(data);
                  });
                }
              }

              DiscordClient.on("messageCreate", onDiscordMessageCreate);
            }
            else if (collection.trigger === "2"){
              async function onDiscordReactionAdd (reaction: MessageReaction | PartialMessageReaction) {
                const workflow = await Workflow.findById(workflowId, { _id: 0, publish: 1 });
                if(workflow && !workflow.publish){
                  DiscordClient.off("messageReactionAdd", onDiscordReactionAdd);
                }
                else if (collection.channelId === reaction.message.channelId) {
                  result["Discord"].forEach((data) => onMessageSend(data));
                }
              }

              DiscordClient.on("messageReactionAdd", onDiscordReactionAdd);
            }
            else if (collection.trigger === "3"){
              async function onDiscordMemberJoin (member: GuildMember){
                const workflow = await Workflow.findById(workflowId, { _id: 0, publish: 1 });
                if(workflow && !workflow.publish){
                  DiscordClient.off("guildMemberAdd", onDiscordMemberJoin);
                }
                else if (collection.guildId === member.guild.id) {
                  result["Discord"].forEach((data) => onMessageSend(data));
                }
              }

              DiscordClient.on("guildMemberAdd", onDiscordMemberJoin);
            }
          }
          else if (workflow.parentTrigger === "Slack" && collection.channelId && collection.teamId && collection.trigger) {
            await dfs(collection._id, workflow.parentTrigger, workflow.parentTrigger, false, result);

            await SlackClient.start();

            if(collection.trigger === "0" || collection.trigger === "1"){
              async function onSlackMessageCreate({ event, ack }: { event: KnownEventFromType<"message">, ack: any } ){
                if(ack) await ack();

                const workflow = await Workflow.findById(workflowId, { _id: 0, publish: 1 });
                if(workflow && !workflow.publish){
                  SlackClient.off("message", onSlackMessageCreate);
                }
                else if(event && collection.channelId === event?.channel && event?.channel_type === "channel"){
                  if(event.subtype === "file_share"){
                    result["Slack"].forEach((data) => {
                      let updatedAction = data.action;
                      if((data.nodeType === "Discord" || data.nodeType === "Slack") && event.files && event.files.length > 0) {
                        updatedAction = {
                          ...data.action,
                          message: `${data.action!.message} having name ${event.files[0].name}`
                        }
                      }
              
                      onMessageSend({ ...data, action: updatedAction });
                    })
                  } else if(!event.subtype){
                    result["Slack"].forEach((data) => {
                      onMessageSend(data);
                    });
                  }
                }
              };

              SlackClient.on("message", onSlackMessageCreate);
            }
            else if(collection.trigger === "2"){
              async function onSlackReactionAdd ({ event, ack }: { event: ReactionAddedEvent, ack: any }) {
                if(ack) await ack();

                const workflow = await Workflow.findById(workflowId, { _id: 0, publish: 1 });
                if(workflow && !workflow.publish){
                  SlackClient.off("reaction_added", onSlackReactionAdd);
                }
                else if(event && collection.channelId === event?.item.channel){
                  result["Slack"].forEach((data) => {
                    onMessageSend(data);
                  });
                }
              }

              SlackClient.on("reaction_added", onSlackReactionAdd);
            }
            else if(collection.trigger === "3"){
              async function onSlackChannelCreate ({ event, ack }: { event: ChannelCreatedEvent, ack: any }) {
                if(ack) await ack();

                const workflow = await Workflow.findById(workflowId, { _id: 0, publish: 1 });
                if(workflow && !workflow.publish){
                  SlackClient.off("channel_created", onSlackChannelCreate);
                }
                else if(event && collection.channelId === event?.channel.id && event?.channel.is_channel){
                  result["Slack"].forEach((data) => {
                    onMessageSend(data);
                  });
                }
              }

              SlackClient.on("channel_created", onSlackChannelCreate);
            }
            else if(collection.trigger === "4"){
              async function onSlackMemberJoin ({ event, ack }: { event: MemberJoinedChannelEvent, ack: any }) {
                if(ack) await ack();

                const workflow = await Workflow.findById(workflowId, { _id: 0, publish: 1 });
                if(workflow && !workflow.publish){
                  SlackClient.off("member_joined_channel", onSlackMemberJoin);
                }
                else if(event && collection.channelId === event?.channel && event?.channel_type === "channel" && event.team === collection.teamId){
                  result["Slack"].forEach((data) => {
                    onMessageSend(data);
                  });
                }
              }

              SlackClient.on("member_joined_channel", onSlackMemberJoin);
            }
          }
        }
      }
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