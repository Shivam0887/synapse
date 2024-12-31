import { v4 as uuidv4 } from "uuid";
import { google } from "googleapis";
import ConnectToDB from "@/lib/connectToDB";

import { NextRequest, NextResponse } from "next/server";

import { User, UserType } from "@/models/user.model";
import { Workflow, WorkflowType } from "@/models/workflow.model";
import { mapper } from "@/lib/constants";

import z from "zod";
import { GoogleDrive, GoogleDriveType } from "@/models/google-drive.model";
import { absolutePathUrl, oauthRedirectUri } from "@/lib/utils";

type GoogleDriveInstance = Pick<
  GoogleDriveType,
  | "changes"
  | "fileId"
  | "driveId"
  | "includeRemoved"
  | "restrictToMyDrive"
  | "supportedAllDrives"
  | "accessToken"
  | "refreshToken"
  | "expiresAt"
  | "nodeId"
  | "channelId"
  | "resourceId"
  | "pageToken"
>;

const reqSchema = z.object({
  nodeId: z.string({ message: "No nodeId provided" }),
  userId: z.string({ message: "No userId provided" }),
  workflowId: z.string({ message: "No workflowId provided" }),
});

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

export const getGoogleDriveInstance = async (nodeId: string) => {
  await ConnectToDB();
  return await GoogleDrive.findOne<GoogleDriveInstance>(
    { nodeId },
    {
      changes: 1,
      fileId: 1,
      files: 1,
      driveId: 1,
      includeRemoved: 1,
      restrictToMyDrive: 1,
      supportedAllDrives: 1,
      expiresAt: 1,
      accessToken: 1,
      refreshToken: 1,
      nodeId: 1,
      channelId: 1,
      resourceId: 1,
      pageToken: 1,
      _id: 0,
    }
  );
};

export async function PATCH(req: NextRequest) {
  try {
    const { nodeId, userId, workflowId } = reqSchema.parse(await req.json());

    await ConnectToDB();
    const dbUser = await User.findOne<Pick<UserType, "_id">>(
      { userId },
      { _id: 1 }
    );

    if (!dbUser)
      return NextResponse.json(
        { message: "user is not authenticated" },
        { status: 401 }
      );

    const googleDrive = await getGoogleDriveInstance(nodeId);
    if (!googleDrive) {
      return new NextResponse("No Google Drive trigger found", { status: 404 });
    }

    const startWatch = async (googleDrive: GoogleDriveInstance) => {
      let resourceId: string | null | undefined;
      let expiresIn: number | null = null;
      
      const channelId = uuidv4();
      const {
        changes,
        fileId,
        driveId,
        includeRemoved,
        restrictToMyDrive,
        supportedAllDrives,
        nodeId,
        accessToken,
        refreshToken,
        expiresAt,
      } = googleDrive;

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

      const pageToken = (await drive.changes.getStartPageToken({}))?.data?.startPageToken;

      if (changes === "true") {

        if (pageToken === null)
          return new NextResponse("PageToken not found", { status: 404 });

        const channel = await drive.changes.watch({
          pageToken,
          supportsAllDrives: mapper[supportedAllDrives],
          includeRemoved: mapper[includeRemoved],
          pageSize: 1,
          restrictToMyDrive: mapper[restrictToMyDrive],
          driveId,
          requestBody: {
            id: channelId,
            address: `${absolutePathUrl}/api/drive/notification?nodeId=${nodeId}&userId=${userId}&workflowId=${workflowId}`,
            type: "web_hook",
          },
        });

        if(channel.data) {
          if (channel.data?.expiration && !isNaN(parseInt(channel.data.expiration)))
            expiresIn = parseInt(channel.data.expiration) - Date.now();

          resourceId = channel.data.resourceId;
        }
      } else {
        const channel = await drive.files.watch({
          supportsAllDrives: mapper[supportedAllDrives],
          fileId,
          requestBody: {
            id: channelId,
            address: `${absolutePathUrl}/api/drive/notification?nodeId=${nodeId}&userId=${userId}&workflowId=${workflowId}`,
            type: "web_hook",
          },
        });

        if(channel.data) {
          if (channel.data?.expiration && !isNaN(parseInt(channel.data.expiration)))
            expiresIn = parseInt(channel.data.expiration) - Date.now();

          resourceId = channel.data.resourceId;
        }
      }

      await GoogleDrive.findOneAndUpdate(
        { nodeId },
        {
          $set: {
            channelId,
            resourceId,
            pageToken
          },
        }
      );

      if (expiresIn !== null && expiresIn > 0) {
        setTimeout(async () => {
          const googleDrive = await getGoogleDriveInstance(nodeId);
          const workflow = await Workflow.findById<Pick<WorkflowType, "parentId" | "publish">>(
            workflowId, 
            { parentId: 1, publish: 1, _id: 0 }
          );

          if (googleDrive && workflow && workflow.publish && workflow.parentId === nodeId) {
            await startWatch(googleDrive);
          } else {
            await drive.channels.stop({
              requestBody: {
                id: channelId,
                resourceId
              },
            });
          }
        }, expiresIn);
      }
    };

    await startWatch(googleDrive);

    return new NextResponse("Listening to changes...", { status: 200 });
  } catch (error: any) {
    console.log("Error while watching for Google Drive changes:", error?.message);
    return new NextResponse("Oops! something went wrong, try again", {
      status: 500,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { nodeId, userId } = reqSchema.parse(await req.json());

    await ConnectToDB();
    const dbUser = await User.findOne<Pick<UserType, "_id" | "currentWorkflowId">>(
      { userId }, { _id: 1, currentWorkflowId: 1 }
    );

    if (!dbUser)
      return NextResponse.json(
        { message: "user is not authenticated" },
        { status: 401 }
      );

    const googleDrive = await getGoogleDriveInstance(nodeId);
    if (!googleDrive) {
      return new NextResponse("No Google Drive trigger found", { status: 404 });
    }

    const ok = await checkAndRefreshToken(
      googleDrive.accessToken,
      googleDrive.refreshToken,
      googleDrive.expiresAt,
      googleDrive.nodeId
    );

    if (!ok) throw new Error("Reconnect your Google Drive account");

    const drive = google.drive({
      version: "v3",
      auth: oauth2Client,
    });

    await drive.channels.stop({
      requestBody: {
        id: googleDrive.channelId,
        resourceId: googleDrive.resourceId
      },
    });

    return new NextResponse("Listening stopped!", { status: 200 });
  } catch (error: any) {
    console.log("Error while stopping the Google Drive changes:", error?.message);
    return new NextResponse("Oops! something went wrong, try again", {
      status: 500,
    });
  }
}
