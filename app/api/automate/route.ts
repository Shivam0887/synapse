import axios from "axios";
import { ZodError, z } from "zod";
import { absolutePathUrl } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

import ConnectToDB from "@/lib/connectToDB";
import {
  ConnectionTypes,
  EventData,
  ResultDataType,
  ResultType,
} from "@/lib/types";

import { User, UserType } from "@/models/user-model";
import { Slack, SlackType } from "@/models/slack-model";
import { Notion, NotionType } from "@/models/notion-model";
import { Discord, DiscordType } from "@/models/discord-model";
import { Workflow, WorkflowType } from "@/models/workflow-model";

import { onCreatePage } from "@/app/(main)/(routes)/connections/_actions/notion-action";
import { postContentToWebhook } from "@/app/(main)/(routes)/connections/_actions/discord-action";

import {
  ChannelCreatedEvent,
  KnownEventFromType,
  MemberJoinedChannelEvent,
  ReactionAddedEvent,
} from "@slack/bolt";

import { SocketModeClient } from "@slack/socket-mode";
import DiscordClient from "@/lib/discord-bot";

const SlackClient = new SocketModeClient({
  appToken: process.env.SLACK_APP_TOKEN!,
});

const discordClient = new DiscordClient(process.env.DISCORD_BOT_TOKEN!);

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
  _id,
}: ResultDataType & { _id: string }) => {
  ConnectToDB();

  const dbUser = await User.findById(_id, {
    credits: 1,
    tier: 1,
  });

  if (dbUser && dbUser.tier !== "Premium Plan") {
    await User.findByIdAndUpdate(dbUser._id, {
      $set: {
        credits: `${parseInt(dbUser.credits) - 1}`,
      },
    });
  }

  if (nodeType === "Notion") {
    await onCreatePage({
      workflowId: workflowId!,
      isTesting: false,
      nodeId: nodeId!,
    });
  } else if (action?.trigger) {
    if (nodeType === "Discord") {
      if (action.trigger === "1") {
        const channelResponse = await axios.post(
          "https://discord.com/api/v10/users/@me/channels",
          {
            recipient_id: action.user!,
          },
          {
            headers: {
              Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN!}`,
              "Content-Type": "application/json",
            },
          }
        );

        const channelId = channelResponse.data?.id;

        if (channelId) {
          // Step 2: Send a message to the DM channel
          await axios.post(
            `https://discord.com/api/v10/channels/${channelId}/messages`,
            {
              content: action.message!,
            },
            {
              headers: {
                Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN!}`,
                "Content-Type": "application/json",
              },
            }
          );
        }
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

const hasCredits = async (workflowId: string, _id: string, userId: string) => {
  ConnectToDB();
  const workflow = await Workflow.findById<Pick<WorkflowType, "publish">>(
    workflowId,
    { _id: 0, publish: 1 }
  );
  const dbUser = await User.findById<Pick<UserType, "credits" | "tier">>(_id, {
    credits: 1,
    tier: 1,
  });

  const isLimit =
    (workflow && !workflow.publish) ||
    (dbUser &&
      dbUser.tier !== "Premium Plan" &&
      parseInt(dbUser.credits) === 0);

  if (isLimit) {
    await Workflow.findByIdAndUpdate(workflowId, {
      $set: {
        publish: false,
      },
    });

    await axios.patch(`https://synapse-zxh8.onrender.com/api/logs?userId=${userId}`, {
      status: false,
      action: "Limit Exceeds",
      message: `Workflow Id: ${workflowId}, Workflow unpublished due to low credits!`,
    });
  }

  return isLimit;
};

export async function POST(req: NextRequest) {
  try {
    const { publish, workflowId, _id, clerkUserId } = reqSchema.parse(
      await req.json()
    );

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
                true,
                result
              );
            })
          );

          await Promise.all(
            slackId.map(async ({ _id }) => {
              await dfs(
                _id.toString(),
                "Slack",
                workflow.parentTrigger,
                true,
                result
              );
            })
          );

          await Promise.all(
            notionId.map(async ({ _id }) => {
              await dfs(
                _id.toString(),
                "Notion",
                workflow.parentTrigger,
                true,
                result
              );
            })
          );

          WorkflowToDrive.set(workflowId, result["Google Drive"]);
          await dbUser.save();

          await axios.get(
            `https://synapse-zxh8.onrender.com/api/drive/watch?workflowId=${workflowId}&userId=${clerkUserId}`
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
              false,
              result
            );

            discordClient.connect();

            if (collection.trigger === "0" || collection.trigger === "1") {
              async function onDiscordMessageCreate(
                message: EventData["MESSAGE_CREATE"]
              ) {
                const isLimit = await hasCredits(workflowId, _id, clerkUserId);

                if (isLimit) {
                  discordClient.off("messageCreate", onDiscordMessageCreate);
                  discordClient.disconnect();
                } else if (!message.webhook_id) {
                  if (
                    !message.author.bot &&
                    collection.channelId === message.channel_id
                  ) {
                    result["Discord"].forEach((data) => {
                      if (
                        !(
                          !!message.mentions.length ||
                          !!message.mention_roles.length
                        )
                      )
                        onMessageSend({ ...data, _id });
                    });

                    result["Discord"].forEach((data) => {
                      if (
                        !!message.mentions.length ||
                        !!message.mention_roles.length
                      )
                        onMessageSend({ ...data, _id });
                    });
                  }
                }
              }

              discordClient.on("messageCreate", onDiscordMessageCreate);
            } else if (collection.trigger === "2") {
              async function onDiscordReactionAdd(
                reaction: EventData["MESSAGE_REACTION_ADD"]
              ) {
                const isLimit = await hasCredits(workflowId, _id, clerkUserId);

                if (isLimit) {
                  discordClient.off("messageReactionAdd", onDiscordReactionAdd);
                  discordClient.disconnect();
                } else if (collection.channelId === reaction.channel_id) {
                  result["Discord"].forEach((data) =>
                    onMessageSend({ ...data, _id })
                  );
                }
              }

              discordClient.on("messageReactionAdd", onDiscordReactionAdd);
            } else if (collection.trigger === "3") {
              async function onDiscordMemberJoin(
                member: EventData["GUILD_MEMBER_ADD"]
              ) {
                const isLimit = await hasCredits(workflowId, _id, clerkUserId);

                if (isLimit) {
                  discordClient.off("guildMemberAdd", onDiscordMemberJoin);
                  discordClient.disconnect();
                } else if (collection.guildId === member.guild_id) {
                  result["Discord"].forEach((data) =>
                    onMessageSend({ ...data, _id })
                  );
                }
              }

              discordClient.on("guildMemberAdd", onDiscordMemberJoin);
            }
          } else if (
            workflow.parentTrigger === "Slack" &&
            collection.channelId &&
            collection.teamId &&
            collection.trigger
          ) {
            await dfs(
              collection._id,
              workflow.parentTrigger,
              workflow.parentTrigger,
              false,
              result
            );

            await SlackClient.start();

            if (collection.trigger === "0" || collection.trigger === "1") {
              async function onSlackMessageCreate({
                event,
                ack,
              }: {
                event: KnownEventFromType<"message">;
                ack: any;
              }) {
                if (ack) await ack();

                const isLimit = await hasCredits(workflowId, _id, clerkUserId);

                if (isLimit) {
                  SlackClient.off("message", onSlackMessageCreate);
                } else if (
                  event &&
                  collection.channelId === event?.channel &&
                  event?.channel_type === "channel"
                ) {
                  if (event.subtype === "file_share") {
                    result["Slack"].forEach((data) => {
                      let updatedAction = data.action;
                      if (
                        (data.nodeType === "Discord" ||
                          data.nodeType === "Slack") &&
                        event.files &&
                        event.files.length > 0
                      ) {
                        updatedAction = {
                          ...data.action,
                          message: `${data.action!.message} having name ${
                            event.files[0].name
                          }`,
                        };
                      }

                      onMessageSend({ ...data, action: updatedAction, _id });
                    });
                  } else if (!event.subtype) {
                    result["Slack"].forEach((data) => {
                      onMessageSend({ ...data, _id });
                    });
                  }
                }
              }

              SlackClient.on("message", onSlackMessageCreate);
            } else if (collection.trigger === "2") {
              async function onSlackReactionAdd({
                event,
                ack,
              }: {
                event: ReactionAddedEvent;
                ack: any;
              }) {
                if (ack) await ack();

                const isLimit = await hasCredits(workflowId, _id, clerkUserId);

                if (isLimit) {
                  SlackClient.off("reaction_added", onSlackReactionAdd);
                } else if (
                  event &&
                  collection.channelId === event?.item.channel
                ) {
                  result["Slack"].forEach((data) => {
                    onMessageSend({ ...data, _id });
                  });
                }
              }

              SlackClient.on("reaction_added", onSlackReactionAdd);
            } else if (collection.trigger === "3") {
              async function onSlackChannelCreate({
                event,
                ack,
              }: {
                event: ChannelCreatedEvent;
                ack: any;
              }) {
                if (ack) await ack();

                const isLimit = await hasCredits(workflowId, _id, clerkUserId);

                if (isLimit) {
                  SlackClient.off("channel_created", onSlackChannelCreate);
                } else if (
                  event &&
                  collection.channelId === event?.channel.id &&
                  event?.channel.is_channel
                ) {
                  result["Slack"].forEach((data) => {
                    onMessageSend({ ...data, _id });
                  });
                }
              }

              SlackClient.on("channel_created", onSlackChannelCreate);
            } else if (collection.trigger === "4") {
              async function onSlackMemberJoin({
                event,
                ack,
              }: {
                event: MemberJoinedChannelEvent;
                ack: any;
              }) {
                if (ack) await ack();

                const isLimit = await hasCredits(workflowId, _id, clerkUserId);

                if (isLimit) {
                  SlackClient.off("member_joined_channel", onSlackMemberJoin);
                } else if (
                  event &&
                  collection.channelId === event?.channel &&
                  event?.channel_type === "channel" &&
                  event.team === collection.teamId
                ) {
                  result["Slack"].forEach((data) => {
                    onMessageSend({ ...data, _id });
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
