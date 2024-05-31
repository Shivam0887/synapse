import ConnectToDB from "@/lib/connectToDB";
import { User, UserType } from "@/models/user-model";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { google } from "googleapis";
import axios from "axios";
import { Workflow, WorkflowType } from "@/models/workflow-model";
import { mapper } from "@/lib/constant";

import { onCreatePage } from "@/app/(main)/(routes)/connections/_actions/notion-action";
import { postContentToWebhook } from "@/app/(main)/(routes)/connections/_actions/discord-action";
import { ResultDataType } from "@/lib/types";
import { absolutePathUrl } from "@/lib/utils";

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

export async function POST(req: NextRequest) {
  try {
    console.log("🔴 Changed");
    const headersList = headers();
    const workflowId = req.nextUrl.searchParams.get("workflowId")!;
    const userId = req.nextUrl.searchParams.get("userId");

    const resourceId = headersList.get("x-goog-resource-id");

    if (resourceId && userId) {
      ConnectToDB();
      const dbUser = await User.findOne<
        Pick<UserType, "_id" | "WorkflowToDrive" | "credits" | "tier">
      >(
        {
          userId,
          workflowId,
        },
        { WorkflowToDrive: 1, credits: 1, tier: 1 }
      );

      if (!dbUser) {
        throw new Error("user is not authenticated");
      }

      const workflow = await Workflow.findById<
        Pick<WorkflowType, "_id" | "googleDriveWatchTrigger">
      >(workflowId, { googleDriveWatchTrigger: 1 });

      if (!workflow) {
        throw new Error("workflow not found");
      }

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.OAUTH2_REDIRECT_URI
      );

      const clerkResponse = await axios.get(
        `https://api.clerk.com/v1/users/${userId}/oauth_access_tokens/oauth_google`,
        {
          headers: {
            Authorization: `Bearer ${process.env.CLERK_SECRET_KEY!}`,
          },
        }
      );

      const accessToken = clerkResponse.data[0].token;
      oauth2Client.setCredentials({
        access_token: accessToken,
      });

      const drive = google.drive({
        version: "v3",
        auth: oauth2Client,
      });

      if (dbUser.credits === "Unlimited" || parseInt(dbUser.credits) > 0) {
        const { googleDriveWatchTrigger } = workflow;

        if (googleDriveWatchTrigger?.changes === "true") {
          const {
            includeRemoved,
            restrictToMyDrive,
            supportedAllDrives,
            pageToken,
          } = googleDriveWatchTrigger;
          let nextPageToken = pageToken;

          if (
            includeRemoved &&
            restrictToMyDrive &&
            supportedAllDrives &&
            nextPageToken
          ) {
            const response = await drive.changes.list({
              pageToken: nextPageToken,
              includeRemoved: mapper[includeRemoved],
              restrictToMyDrive: mapper[restrictToMyDrive],
              supportsAllDrives: mapper[supportedAllDrives],
              includeItemsFromAllDrives: mapper[supportedAllDrives],
              pageSize: 1,
            });

            if (
              dbUser.WorkflowToDrive.has(workflowId) &&
              response.data?.changes &&
              response.data.changes.length > 0
            ) {
              nextPageToken = response.data.nextPageToken;
              const changeType = response.data.changes[0].changeType;
              const isRemoved = response.data.changes[0].removed;
              const fileName = response.data.changes[0].file?.name;
              const driveName = response.data.changes[0].drive?.name;

              await Promise.all(
                dbUser.WorkflowToDrive.get(workflowId)!.map(async (data) => {
                  const {
                    webhookUrl,
                    accessToken,
                    nodeType,
                    nodeId,
                    action,
                    workflowId,
                  } = data;

                  let updatedAction = action;
                  if (nodeType === "Discord" || nodeType === "Slack") {
                    updatedAction = {
                      ...action,
                      message:
                        action!.message +
                        (changeType === "file" && !isRemoved
                          ? `${fileName!} file.`
                          : changeType === "drive" && !isRemoved
                          ? `${driveName!} drive.`
                          : ""),
                    };
                  }

                  await onMessageSend({
                    webhookUrl,
                    accessToken,
                    nodeType,
                    nodeId,
                    action: updatedAction,
                    workflowId,
                  });
                })
              );
            }
          }
        } else if (googleDriveWatchTrigger?.files === "true") {
          const { supportedAllDrives, pageToken } = googleDriveWatchTrigger;
          let nextPageToken = pageToken;

          if (supportedAllDrives && nextPageToken) {
            const response = await drive.files.list({
              corpora: "allDrives",
              pageToken: nextPageToken,
              q: "trashed = false",
              pageSize: 1,
              orderBy: "modifiedByMeTime,viewedByMeTime",
              supportsAllDrives: mapper[supportedAllDrives],
              includeItemsFromAllDrives: mapper[supportedAllDrives],
            });

            if (
              dbUser.WorkflowToDrive.has(workflowId) &&
              response.data?.files &&
              response.data.files.length > 0
            ) {
              const fileName = response.data.files[0].name;
              nextPageToken = response.data.nextPageToken;

              await Promise.all(
                dbUser.WorkflowToDrive.get(workflowId)!.map(async (data) => {
                  const {
                    webhookUrl,
                    accessToken,
                    nodeType,
                    nodeId,
                    action,
                    workflowId,
                  } = data;

                  let updatedAction = action;
                  if (nodeType === "Discord" || nodeType === "Slack") {
                    updatedAction = {
                      ...action,
                      message: action!.message + `${fileName} file.`,
                    };
                  }

                  await onMessageSend({
                    webhookUrl,
                    accessToken,
                    nodeType,
                    nodeId,
                    action: updatedAction,
                    workflowId,
                  });
                })
              );
            }
          }
        }

        if (dbUser.tier !== "Premium Plan") {
          await User.findByIdAndUpdate(dbUser._id, {
            $set: {
              credits: `${parseInt(dbUser.credits) - 1}`,
            },
          });
        }
      } else {
        await Workflow.findByIdAndUpdate(workflowId, {
          $set: {
            "googleDriveWatchTrigger.isListening": false,
            publish: false,
          },
        });

        await axios.get(
          `https://synapse-zxh8.onrender.com/api/drive/watch?workflowId=${workflowId}&userId=${userId}`
        );

        await axios.patch(
          `https://synapse-zxh8.onrender.com/api/logs?userId=${userId}`,
          {
            status: false,
            action: "Limit Exceeds",
            message: `Workflow Id: ${workflowId}, Workflow unpublished due to low credits!`,
          }
        );
      }
    }

    return Response.json({ message: "flow completed" }, { status: 200 });
  } catch (error: any) {
    console.log(error);
    return Response.json(
      { message: "notification to changes failed" },
      { status: 500 }
    );
  }
}
