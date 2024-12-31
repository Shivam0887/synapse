import axios from "axios";
import { ZodError, z } from "zod";
import { absolutePathUrl } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

import {
  ConnectionTypes,
  EventData,
  ResultDataType,
  ResultType,
} from "@/lib/types";
import ConnectToDB from "@/lib/connectToDB";
import DiscordClient from "@/lib/discord-bot";

import { User, UserType } from "@/models/user.model";
import { Slack, SlackType } from "@/models/slack.model";
import { Notion, NotionType } from "@/models/notion.model";
import { Discord, DiscordType } from "@/models/discord.model";
import { Workflow, WorkflowType } from "@/models/workflow.model";

import { KnownEventFromType } from "@slack/bolt";
import { LogLevel, SocketModeClient } from "@slack/socket-mode";

import { createPage } from "@/actions/notion.actions";
import { postContentToWebhook, sendMessage } from "@/actions/utils.actions";
import { GoogleDrive } from "@/models/google-drive.model";

const SlackClient = new SocketModeClient({
  appToken: process.env.SLACK_APP_TOKEN!,
});

const discordClient = new DiscordClient(process.env.DISCORD_BOT_TOKEN!);

const reqSchema = z.object({
  nodeId: z.string({ message: "No nodeId provided" }),
  userId: z.string({ message: "No userId provided" }),
  workflowId: z.string({ message: "No workflowId provided" }),
});

type Connections = {
  connections: {
    discordId: Pick<
      DiscordType,
      "webhookUrl" | "action" | "accessToken" | "nodeId"
    >[];
    slackId: Pick<
      SlackType,
      "webhookUrl" | "action" | "accessToken" | "nodeId"
    >[];
    notionId: Pick<NotionType, "action" | "accessToken" | "nodeId" | "properties" | "pageId" | "databaseId">[];
  };
};

const hasCredits = async (workflowId: string, userId: string) => {
  await ConnectToDB();
  const dbUser = await User.findOne<Pick<UserType, "credits" | "tier">>({ userId }, {
    credits: 1,
    tier: 1,
  });

  const workflow = await Workflow.findById<Pick<WorkflowType, "publish">>(workflowId, { publish: 1, _id: 0 });
  const isLimit = (dbUser && dbUser.tier !== "Premium" && parseInt(dbUser.credits) === 0);

  if (isLimit) {
    await Workflow.findByIdAndUpdate(workflowId, {
      $set: {
        publish: false,
      },
    });

    await axios.patch(`${absolutePathUrl}/api/logs?userId=${userId}`, {
      status: false,
      action: "Limit Exceeds",
      message: `Workflow Id: ${workflowId}, Workflow unpublished due to low credits!`,
    });
  }

  return isLimit || !workflow?.publish;
};

async function dfs(
  nodeId: string,
  nodeType: Exclude<ConnectionTypes, "Notion">,
  triggerType: Exclude<ConnectionTypes, "Notion">,
  result: ResultType
) {
  const triggerModel =
    nodeType === "Discord"
      ? Discord
      : nodeType === "Slack"
      ? Slack
      : GoogleDrive;

  const connections = (
    await triggerModel
      .findOne<Connections>({ nodeId }, { connections: 1, _id: 0 })
      .populate({
        path: "connections.discordId",
        select: "webhookUrl action accessToken nodeId",
        model: Discord,
      })
      .populate({
        path: "connections.slackId",
        select: "webhookUrl action accessToken nodeId",
        model: Slack,
      })
      .populate({
        path: "connections.notionId",
        select: "action accessToken nodeId properties pageId databaseId",
        model: Notion,
      })
  )?.connections;

  if (connections) {
    await Promise.all(
      connections.discordId.map(
        async ({ accessToken, nodeId, action, webhookUrl,  }) => {
          await dfs(nodeId, "Discord", triggerType, result);
          result[triggerType].push({
            action,
            webhookUrl,
            nodeType: "Discord",
            accessToken,
            nodeId,
            properties: {}
          });
        }
      )
    );

    await Promise.all(
      connections.slackId.map(
        async ({ accessToken, nodeId, action, webhookUrl }) => {
          await dfs(nodeId, "Slack", triggerType, result);
          result[triggerType].push({
            action,
            webhookUrl,
            nodeType: "Slack",
            accessToken,
            nodeId,
            properties: {}
          });
        }
      )
    );

    await Promise.all(
      connections.notionId.map(
        async ({ accessToken, nodeId, action, properties, databaseId, pageId }) => {
          result[triggerType].push({
            action,
            nodeType: "Notion",
            accessToken,
            nodeId,
            properties,
            databaseId,
            pageId
          });
        }
      )
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { workflowId, userId, nodeId } = reqSchema.parse(await req.json());

    await ConnectToDB();
    const dbUser = await User.findOne({ userId }, { _id: 1 });

    if (!dbUser) return new NextResponse("user not found", { status: 404 });

    const workflow = await Workflow.findById<
      Pick<WorkflowType, "parentId" | "publish" | "parentTrigger">
    >(
      workflowId, {
      parentId: 1,
      parentTrigger: 1,
      publish: 1,
    });

    if (!workflow)
      return new NextResponse("workflow not found", { status: 404 });

    if (workflow.parentTrigger === "None" || !workflow.publish || workflow.parentId !== nodeId)
      return new NextResponse(
        "Bad request. Either have no trigger set or unpublished workflow",
        { status: 400 }
      );

    // Result based on the trigger type
    const result: ResultType = {
      Discord: [],
      Slack: [],
      "Google Drive": [],
    };

    await dfs(workflow.parentId, workflow.parentTrigger, workflow.parentTrigger, result);

    await Workflow.findByIdAndUpdate(workflowId, {
      $set: {
        flowMetadata: result[workflow.parentTrigger]
      }
    });

    if(workflow.parentTrigger === "Google Drive") {
      await axios.patch(`${absolutePathUrl}/api/drive/watch`, {
        workflowId,
        userId,
        nodeId,
      });
    }
    else {
      if (workflow.parentTrigger === "Discord"){
        const discord = await Discord.findOne<Pick<DiscordType, "trigger" | "channelId" | "guildId">>( 
          { 
            nodeId: workflow.parentId 
          }, 
          {
            trigger: 1,
            channelId: 1,
            guildId: 1,
            _id: 0
          }
        );

        if(!discord) {
          return new NextResponse("Please make sure that you set your Discord trigger.", { status: 404 })
        };

        const { trigger, channelId, guildId } = discord;

        discordClient.connect();

        if (trigger === "0" || trigger === "1") {
          async function onDiscordMessageCreate(message: EventData["MESSAGE_CREATE"]) {
            const isLimit = await hasCredits(workflowId, userId);
            
            if (isLimit) { 
              discordClient.off("messageCreate", onDiscordMessageCreate);
              discordClient.disconnect();
            }
            else if (!message.author?.bot && channelId === message.channel_id) {
              result["Discord"].map(async (data) => {
                await sendMessage({ ...data, workflowId });
              });
            }
          }

          discordClient.on("messageCreate", onDiscordMessageCreate);
        } else if (trigger === "2") {
          async function onDiscordReactionAdd(reaction: EventData["MESSAGE_REACTION_ADD"]) {
            const isLimit = await hasCredits(workflowId, userId);

            if (isLimit) { 
              discordClient.off("messageReactionAdd", onDiscordReactionAdd);    
              discordClient.disconnect();
            }        
            else if (channelId === reaction.channel_id) {
              result["Discord"].map(async (data) =>
                await sendMessage({ ...data, workflowId })
              );
            }
          }

          discordClient.on("messageReactionAdd", onDiscordReactionAdd);
        } else if (trigger === "3") {
          async function onDiscordMemberJoin(member: EventData["GUILD_MEMBER_ADD"]) {
            const isLimit = await hasCredits(workflowId, userId);

            if (isLimit) {
              discordClient.off("guildMemberAdd", onDiscordMemberJoin);
              discordClient.disconnect();
            }
            else if (guildId === member.guild_id) {
              result["Discord"].map(async (data) =>
                await sendMessage({ ...data, workflowId })
              );
            }
          }

          discordClient.on("guildMemberAdd", onDiscordMemberJoin);
        }
      } 
      else {
        const slack = await Slack.findOne<Pick<SlackType, "trigger" | "channelId" | "teamId">>( 
          { 
            nodeId: workflow.parentId 
          }, 
          {
            trigger: 1,
            channelId: 1,
            teamId: 1,
            _id: 0
          }
        );

        if(!slack) {
          return new NextResponse("Please make sure that you set your Slack trigger.", { status: 404 })
        };

        const { trigger, channelId, teamId } = slack;

        await SlackClient.start();

        if (trigger === "0" || trigger === "1") {
          async function onSlackMessageCreate({ event, ack }: {
            event: KnownEventFromType<"message">;
            ack: any;
          }) {
            if (ack) await ack();
            const isLimit = await hasCredits(workflowId, userId);
            
            if (isLimit) {
              SlackClient.off("message", onSlackMessageCreate); 
              SlackClient.disconnect();
            }
            else if(channelId === event?.channel && event?.channel_type === "channel") {
              if (event.subtype === "file_share") {
                result["Slack"].map(async (data) => {
                  if (
                    (data.nodeType === "Discord" || data.nodeType === "Slack") &&
                    event.files &&
                    event.files.length > 0 &&
                    data.action!.mode === "default"
                  ) {
                    data.action!.message += `having name ${event.files[0].name}`
                  }

                  await sendMessage({ ...data, workflowId });
                });
              } else if (!event.subtype) {
                result["Slack"].map(async (data) => {
                  await sendMessage({ ...data, workflowId});
                });
              }
            }
          }

          SlackClient.on("message", onSlackMessageCreate);
        } else if (trigger === "2") {
          async function onSlackReactionAdd({ event, ack }: {
            event: KnownEventFromType<"reaction_added">;
            ack: any;
          }) {
            if (ack) await ack();

            const isLimit = await hasCredits(workflowId, userId);

            if (isLimit) { 
              SlackClient.off("reaction_added", onSlackReactionAdd);
              SlackClient.disconnect();
            }
            else if (event && channelId === event?.item.channel) {
              result["Slack"].map(async (data) => {
                await sendMessage({ ...data, workflowId });
              });
            }
          }

          SlackClient.on("reaction_added", onSlackReactionAdd);
        } else if (trigger === "3") {
          async function onSlackChannelCreate({ event, ack }: {
            event: KnownEventFromType<"channel_created">;
            ack: any;
          }) {
            if (ack) await ack();

            const isLimit = await hasCredits(workflowId, userId);

            if (isLimit) {
              SlackClient.off("channel_created", onSlackChannelCreate);
              SlackClient.disconnect();
            }
            else if (channelId === event?.channel.id && event?.channel.is_channel) {
              result["Slack"].map(async (data) => {
                await sendMessage({ ...data, workflowId });
              });
            }
          }

          SlackClient.on("channel_created", onSlackChannelCreate);
        } else if (trigger === "4") {
          async function onSlackMemberJoin({ event, ack }: {
            event: KnownEventFromType<"member_joined_channel">;
            ack: any;
          }) {
            if (ack) await ack();

            const isLimit = await hasCredits(workflowId, userId);

            if (isLimit) {
              SlackClient.off("member_joined_channel", onSlackMemberJoin);
              SlackClient.disconnect();
            }
            else if (
                channelId === event?.channel &&
                event?.channel_type === "channel" &&
                event.team === teamId
              ) {
                result["Slack"].map(async (data) => {
                  await sendMessage({ ...data, workflowId });
                });
            }
          }

          SlackClient.on("member_joined_channel", onSlackMemberJoin);
        }
      }
    }

    return new NextResponse(null, { status: 200 });
  } catch (error: any) {
    console.log("Failed to automate", error?.message);
    if (error instanceof ZodError) {
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse("Something went wrong! Please try again later", {
      status: 500,
    });
  }
}
