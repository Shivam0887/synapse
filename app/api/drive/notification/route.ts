import axios from "axios";
import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

import { mapper } from "@/lib/constants";
import ConnectToDB from "@/lib/connectToDB";
import { absolutePathUrl, oauthRedirectUri } from "@/lib/utils";

import { User, UserType } from "@/models/user.model";
import { Workflow, WorkflowType } from "@/models/workflow.model";
import { getGoogleDriveInstance } from "../watch/route";
import { GoogleDrive } from "@/models/google-drive.model";
import { sendMessage } from "@/actions/utils.actions";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_DRIVE_CLIENT_ID!,
  process.env.GOOGLE_DRIVE_CLIENT_SECRET!,
  `${oauthRedirectUri}/google_drive`
);

const checkAndRefreshToken = async (
  accessToken: string,
  refreshToken: string,
  expiresAt: number,
  nodeId: string
) => {
  try {
    // Check if the token has expired
    const currentTime = Date.now();
    if (expiresAt && currentTime < expiresAt - 60000) {
      oauth2Client.setCredentials({
        access_token: accessToken,
      });
    } else {
      oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials({
        access_token: credentials.access_token,
      });

      await ConnectToDB();
      await GoogleDrive.findOneAndUpdate(
        { nodeId },
        {
          $set: {
            accessToken: credentials.access_token,
            expiresAt: credentials.expiry_date
          },
        }
      );

      console.log("Access token refreshed.");
    }

    return true;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.error === "invalid_grant"
        ? "RE_AUTHENTICATE_GOOGLE_DRIVE"
        : error.message;

    console.log("Error while refreshing the Google Drive token", errorMessage);
    return false;
  }
};

export async function POST(req: NextRequest) {
  try {
    const workflowId = req.nextUrl.searchParams.get("workflowId");
    const userId = req.nextUrl.searchParams.get("userId");
    const nodeId = req.nextUrl.searchParams.get("nodeId");

    if (!workflowId || !userId || !nodeId) {
      return new NextResponse(
        "Bad request. Please provide the required params",
        { status: 400 }
      );
    }

    const channelId = req.headers.get("x-goog-channel-id");
    const resourceId = req.headers.get("x-goog-resource-id");
    console.log("🔴 Changed", { resourceId, channelId });

    await ConnectToDB();
    const dbUser = await User.findOne<Pick<UserType, "_id" | "credits" | "tier">>(
      { userId }, { credits: 1, tier: 1 }
    );

    if (!dbUser) {
      return new NextResponse("user is not authenticated", { status: 401 });
    }

    const googleDrive = await getGoogleDriveInstance(nodeId);
    if (!googleDrive) {
      throw new Error(`No such Google Drive instance found: ${nodeId}`);
    }

    const workflow = await Workflow.findById<WorkflowType>(workflowId);
    if (!workflow) {
      throw new Error(`No such workflow found: ${workflowId}`);
    }

    const {
      changes,
      includeRemoved,
      restrictToMyDrive,
      supportedAllDrives,
      accessToken,
      refreshToken,
      expiresAt,
    } = googleDrive;

    if (googleDrive.pageToken === null)
      return new NextResponse("PageToken not found", { status: 404 });

    const ok = await checkAndRefreshToken(
      accessToken,
      refreshToken,
      expiresAt,
      nodeId
    );

    if (!ok) throw new Error("Reconnect your Google Drive account");

    const drive = google.drive({
      version: "v3",
      auth: oauth2Client,
    });

    if (dbUser.tier === "Premium" || (!isNaN(parseInt(dbUser.credits)) && parseInt(dbUser.credits) > 0)) {

      if (changes === "true") {
        const response = await drive.changes.list({
          includeRemoved: mapper[includeRemoved],
          restrictToMyDrive: mapper[restrictToMyDrive],
          supportsAllDrives: mapper[supportedAllDrives],
          includeItemsFromAllDrives: mapper[supportedAllDrives],
          pageToken: googleDrive.pageToken,
          pageSize: 1,
        });

        if (response.data?.changes?.length) {
          const changeType = response.data.changes[0].changeType;
          const isRemoved = response.data.changes[0].removed;
          const fileName = response.data.changes[0].file?.name;
          const driveName = response.data.changes[0].drive?.name;
          const fileId = response.data.changes[0].fileId;
          const driveId = response.data.changes[0].driveId;

          await Promise.all(
            workflow.flowMetadata.map(async (data) => {
              const { webhookUrl, accessToken, nodeType, nodeId, action, properties } = data;

              if (action && (nodeType === "Discord" || nodeType === "Slack")) {
                action.message +=
                  (changeType === "file"
                    ? isRemoved ? `file removed with id ${fileId}` : `${fileName} file`
                    : isRemoved ? `drive removed with id ${driveId}` : `${driveName} drive.`
                  );
              }

              await sendMessage({
                webhookUrl,
                accessToken,
                nodeType,
                nodeId,
                action,
                workflowId,
                properties
              });
            })
          );
        }
      } else {
        const response = await drive.files.list({
          supportsAllDrives: mapper[supportedAllDrives],
          pageToken: googleDrive.pageToken,
          pageSize: 1,
        });

        if (response.data?.files && response.data.files.length > 0) {
          const fileName = response.data.files[0].name;
          await Promise.all(
            workflow.flowMetadata.map(async (data) => {
              const { webhookUrl, accessToken, nodeType, nodeId, action, properties } = data;

              if (action && (nodeType === "Discord" || nodeType === "Slack"))
                action.message += `${fileName} file.`;

              await sendMessage({
                webhookUrl,
                accessToken,
                nodeType,
                nodeId,
                action,
                workflowId,
                properties
              });
            })
          );
        }
      }

      if (dbUser.tier !== "Premium") {
        await User.findByIdAndUpdate(dbUser._id, {
          $set: {
            credits: `${parseInt(dbUser.credits) - 1}`,
          },
        });
      }
    } 
    else {
      await drive.channels.stop({
        requestBody: {
          id: googleDrive.channelId,
          resourceId: googleDrive.resourceId
        },
      });

      await axios.patch(`${absolutePathUrl}/api/logs?userId=${userId}`, {
        status: false,
        action: "Limit Exceeds",
        message: `Workflow Id: ${workflowId}, Workflow unpublished due to low credits!`,
      });
    }

    await GoogleDrive.findOneAndUpdate({ nodeId }, {
      $set: {
        pageToken: (await drive.changes.getStartPageToken({}))?.data?.startPageToken
      }
    });

    return Response.json({ message: "flow completed" }, { status: 200 });
  } catch (error: any) {
    console.log("Google drive notification error:", error?.message);
    return Response.json(
      { message: "notification to changes failed" },
      { status: 500 }
    );
  }
}
