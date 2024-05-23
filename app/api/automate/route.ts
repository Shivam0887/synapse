import { NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";

import { Discord, DiscordType } from "@/models/discord-model";
import { Workflow, WorkflowType } from "@/models/workflow-model";
import { Slack, SlackType } from "@/models/slack-model";
import { Notion, NotionType } from "@/models/notion-model";
import { ConnectionTypes, ResultDataType, ResultType } from "@/lib/types";
import ConnectToDB from "@/lib/connectToDB";
import { Types } from "mongoose";

import axios from "axios";
import { User, UserType } from "@/models/user-model";
import {
  GuildMember,
  Message,
  MessageReaction,
  PartialMessageReaction,
} from "discord.js";

// Import the necessary modules from discord.js
import { Client, GatewayIntentBits } from "discord.js";
import { onCreatePage } from "@/app/(main)/(routes)/connections/_actions/notion-action";
import { postContentToWebhook } from "@/app/(main)/(routes)/connections/_actions/discord-action";

import fs from "fs/promises";
import path from "path";
import { absolutePathUrl } from "@/lib/utils";

const dirPath = path.join(__dirname, "_data");
const filePath = path.join(dirPath, "data.txt");

async function saveData(data: string) {
  // Ensure the subfolder exists
  await fs.mkdir(dirPath, { recursive: true });
  await fs.writeFile(filePath, data);
}

async function getData() {
  const data = await fs.readFile(filePath, "utf8");
  return data;
}

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

const result: ResultType = {
  Discord: {
    metaData: { channelId: "", guildId: "", trigger: "" },
    result: [],
  },
  Slack: {
    metaData: { channelId: "", teamId: "", trigger: "" },
    result: [],
  },
  "Google Drive": {
    result: [],
  },
};

const onMessageSend = async ({
  nodeType,
  action,
  webhookUrl,
  nodeId,
  workflowId,
  accessToken,
}: ResultDataType) => {
  if (nodeType === "Notion") {
    await onCreatePage({
      workflowId: workflowId!,
      isTesting: false,
      nodeId: nodeId!,
    });
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

async function dfs(
  _id: string,
  nodeType: ConnectionTypes,
  triggerType: ConnectionTypes | "None",
  isInitial: boolean
) {
  if (triggerType === "Notion" || triggerType === "None") return;
  if (nodeType === "Discord" || nodeType === "Slack" || nodeType === "Notion") {
    const Model =
      nodeType === "Discord" ? Discord : nodeType === "Slack" ? Slack : Notion;
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

    if (isInitial && collection) {
      const { accessToken, nodeId, workflowId, action, webhookUrl } =
        collection;
      if (nodeType === "Discord" && action && webhookUrl) {
        result[triggerType]["result"].push({
          action,
          webhookUrl,
          nodeType: "Discord",
        });
      } else if (nodeType === "Slack" && action && webhookUrl && accessToken) {
        result[triggerType]["result"].push({
          action,
          webhookUrl,
          nodeType: "Slack",
          accessToken,
        });
      } else if (nodeType === "Notion" && workflowId) {
        result[triggerType]["result"].push({
          nodeType: "Notion",
          nodeId,
          workflowId: workflowId.toString(),
        });
      }
    }

    if (!isInitial && collection) {
      await Promise.all(
        collection.connections.discordId.map(
          async ({ _id, action, webhookUrl }) => {
            await dfs(_id!.toString(), "Discord", triggerType, false);
            if (action && webhookUrl) {
              result[triggerType]["result"].push({
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
            await dfs(_id!.toString(), "Slack", triggerType, false);
            if (action && webhookUrl && accessToken) {
              result[triggerType]["result"].push({
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
          result[triggerType]["result"].push({
            nodeType: "Notion",
            nodeId,
            workflowId: workflowId.toString(),
          });
        }
      });
    }
  }
}

const onMessageCreate = async (message: Message) => {
  const { channelId } = result["Discord"]["metaData"];
  if (!message.author.bot && channelId === message.channelId) {
    result["Discord"]["result"].forEach((data) => {
      if (!(!!message.mentions.users.size || !!message.mentions.roles.size))
        onMessageSend(data);
    });

    result["Discord"]["result"].forEach((data) => {
      if (!!message.mentions.users.size || !!message.mentions.roles.size)
        onMessageSend(data);
    });
  }
};

const onMessageReactionAdd = async (
  reaction: MessageReaction | PartialMessageReaction
) => {
  const { channelId } = result["Discord"]["metaData"];
  if (channelId === reaction.message.channelId) {
    result["Discord"]["result"].forEach((data) => onMessageSend(data));
  }
};

const onGuildMemberAdd = async (member: GuildMember) => {
  const { guildId } = result["Discord"]["metaData"];
  if (guildId === member.guild.id) {
    result["Discord"]["result"].forEach((data) => onMessageSend(data));
  }
};

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  const teamId = searchParams.get("teamId");
  const channelId = searchParams.get("channelId");
  const isChannel = searchParams.get("isChannel");
  const eventType = searchParams.get("eventType");
  const channelType = searchParams.get("channelType");
  const id = searchParams.get("clerkUserId");

  const userId = await getData();

  try {
    if (eventType && userId) {
      ConnectToDB();
      const dbUser = await User.findById<UserType>(userId, {
        WorkflowToSlack: 1,
      });

      if (dbUser) {
        const type = eventType as "0" | "1" | "2" | "3" | "4";

        dbUser.WorkflowToSlack.forEach(({ publish, result, metaData }) => {
          if (publish) {
            const isChannelIdExists = !channelId
              ? false
              : metaData?.channelId === channelId;
            const isTeamIdExists = !teamId
              ? false
              : metaData?.teamId === teamId;
            const channel_type = !channelType
              ? false
              : channelType === "channel";

            if (
              (type === "0" || type === "1") &&
              type === metaData?.trigger &&
              isChannelIdExists &&
              channel_type
            ) {
              result.forEach((data) => {
                const {
                  webhookUrl,
                  accessToken,
                  nodeType,
                  nodeId,
                  action,
                  workflowId,
                } = data;
                onMessageSend({
                  webhookUrl,
                  accessToken,
                  nodeType,
                  nodeId,
                  action,
                  workflowId,
                });
              });
            } else if (
              type === "2" &&
              type === metaData?.trigger &&
              isChannelIdExists
            ) {
              result.forEach((data) => {
                const {
                  webhookUrl,
                  accessToken,
                  nodeType,
                  nodeId,
                  action,
                  workflowId,
                } = data;
                onMessageSend({
                  webhookUrl,
                  accessToken,
                  nodeType,
                  nodeId,
                  action,
                  workflowId,
                });
              });
            } else if (
              type === "3" &&
              type === metaData?.trigger &&
              isChannelIdExists &&
              isChannel
            ) {
              result.forEach((data) => {
                const {
                  webhookUrl,
                  accessToken,
                  nodeType,
                  nodeId,
                  action,
                  workflowId,
                } = data;
                onMessageSend({
                  webhookUrl,
                  accessToken,
                  nodeType,
                  nodeId,
                  action,
                  workflowId,
                });
              });
            } else if (
              type === "4" &&
              type === metaData?.trigger &&
              isChannelIdExists &&
              channel_type &&
              isTeamIdExists
            ) {
              result.forEach((data) => {
                const {
                  webhookUrl,
                  accessToken,
                  nodeType,
                  nodeId,
                  action,
                  workflowId,
                } = data;
                onMessageSend({
                  webhookUrl,
                  accessToken,
                  nodeType,
                  nodeId,
                  action,
                  workflowId,
                });
              });
            }
          }
        });
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
    const { publish, workflowId, _id, clerkUserId } = reqSchema.parse(
      await req.json()
    );

    ConnectToDB();

    const dbUser = await User.findById(_id, {
      WorkflowToDiscord: 1,
      WorkflowToSlack: 1,
      WorkflowToDrive: 1,
    });

    if (dbUser) {
      await saveData(_id);

      const WorkflowToDiscord = dbUser.WorkflowToDiscord;
      const WorkflowToSlack = dbUser.WorkflowToSlack;
      const WorkflowToDrive = dbUser.WorkflowToDrive;

      const workflow = await Workflow.findById<
        Pick<
          WorkflowType,
          "_id" | "parentId" | "parentTrigger" | "googleDriveWatchTrigger"
        >
      >(workflowId, {
        parentTrigger: 1,
        parentId: 1,
        googleDriveWatchTrigger: 1,
      });

      if (workflow?.parentTrigger && publish) {
        if (
          workflow.parentTrigger === "Google Drive" &&
          workflow.googleDriveWatchTrigger?.connections
        ) {
          const { discordId, notionId, slackId } =
            workflow.googleDriveWatchTrigger.connections;
          await Promise.all(
            discordId.map(async ({ _id }) => {
              await dfs(
                _id.toString(),
                "Discord",
                workflow.parentTrigger,
                true
              );
            })
          );

          await Promise.all(
            slackId.map(async ({ _id }) => {
              await dfs(_id.toString(), "Slack", workflow.parentTrigger, true);
            })
          );

          await Promise.all(
            notionId.map(async ({ _id }) => {
              await dfs(_id.toString(), "Notion", workflow.parentTrigger, true);
            })
          );

          WorkflowToDrive.set(workflowId, {
            result: result["Google Drive"]["result"],
          });
          await dbUser.save();

          await axios.get(
            `${absolutePathUrl()}/api/drive/watch?workflowId=${workflowId}&userId=${clerkUserId}`
          );
        } else if (
          workflow.parentId &&
          (workflow.parentTrigger === "Discord" ||
            workflow.parentTrigger === "Slack")
        ) {
          const Model = workflow.parentTrigger === "Discord" ? Discord : Slack;
          const collection = await Model.findById(workflow.parentId);

          if (
            workflow.parentTrigger === "Discord" &&
            collection.channelId &&
            collection.guildId &&
            collection.trigger
          ) {
            await dfs(
              collection._id,
              workflow.parentTrigger,
              workflow.parentTrigger,
              false
            );
            result["Discord"]["metaData"] = {
              channelId: collection.channelId,
              guildId: collection.guildId,
              trigger: collection.trigger,
            };
            WorkflowToDiscord.set(workflowId, {
              publish,
              metaData: result["Discord"]["metaData"],
              result: result["Discord"]["result"],
            });
            await dbUser.save();
          }

          if (
            workflow.parentTrigger === "Slack" &&
            collection.channelId &&
            collection.teamId &&
            collection.trigger
          ) {
            await dfs(
              collection._id,
              workflow.parentTrigger,
              workflow.parentTrigger,
              false
            );
            result["Slack"]["metaData"] = {
              channelId: collection.channelId,
              teamId: collection.teamId,
              trigger: collection.trigger,
            };
            WorkflowToSlack.set(workflowId, {
              publish,
              metaData: result["Slack"]["metaData"],
              result: result["Slack"]["result"],
            });
            await dbUser.save();
          }
        }
      }

      if (workflow?.parentTrigger && !publish) {
        if (
          workflow.parentTrigger === "Discord" &&
          WorkflowToDiscord.has(workflowId)
        ) {
          WorkflowToDiscord.delete(workflowId);
          await dbUser.save();
        } else if (
          workflow.parentTrigger === "Slack" &&
          WorkflowToSlack.has(workflowId)
        ) {
          WorkflowToSlack.delete(workflowId);
          await dbUser.save();
        } else if (workflow?.parentTrigger === "Google Drive") {
          WorkflowToDrive.delete(workflowId);
          await dbUser.save();
          await Workflow.findByIdAndUpdate(workflowId, {
            $set: {
              "googleDriveWatchTrigger.isListening": false,
            },
          });
          await axios.get(
            `${absolutePathUrl()}/api/drive/watch?workflowId=${workflowId}&userId=${clerkUserId}`
          );
        }
      }

      if (workflow?.parentTrigger === "Discord") {
        if (publish) {
          console.log("published");
          const { trigger } = result["Discord"]["metaData"];
          if (trigger === "0" || trigger === "1")
            DiscordClient.on("messageCreate", onMessageCreate);
          else if (trigger === "2")
            DiscordClient.on("messageReactionAdd", onMessageReactionAdd);
          else if (trigger === "3")
            DiscordClient.on("guildMemberAdd", onGuildMemberAdd);
        } else {
          console.log("Unpublished");
          DiscordClient.removeListener("messageCreate", onMessageCreate);
          DiscordClient.removeListener(
            "messageReactionAdd",
            onMessageReactionAdd
          );
          DiscordClient.removeListener("guildMemberAdd", onGuildMemberAdd);
        }

        DiscordClient.on("error", (error) =>
          console.log("discord socket error:", error.message)
        );
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
