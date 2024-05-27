import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { google } from "googleapis";
import ConnectToDB from "@/lib/connectToDB";

import { NextRequest, NextResponse } from "next/server";

import { User, UserType } from "@/models/user-model";
import { Workflow, WorkflowType } from "@/models/workflow-model";
import { mapper } from "@/lib/constant";
import { connections } from "mongoose";
import { revalidatePath } from "next/cache";

export async function GET(req: NextRequest) {
  try {
    const workflowId = req.nextUrl.searchParams.get("workflowId")!;
    const userId = req.nextUrl.searchParams.get("userId");

    ConnectToDB();

    const dbUser = await User.findOne<
      Pick<UserType, "_id" | "WorkflowToDrive">
    >({ userId }, { WorkflowToDrive: 1 });

    if (!dbUser)
      return NextResponse.json(
        { message: "user is not authenticated" },
        { status: 401 }
      );

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      process.env.OAUTH2_REDIRECT_URI!
    );

    const clerkResponse = await axios.get(
      `https://api.clerk.com/v1/users/${userId}/oauth_access_tokens/oauth_google`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY!}`,
          "Content-Type": "application/json",
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

    const result = await Workflow.findOne<
      Pick<WorkflowType, "_id" | "googleDriveWatchTrigger">
    >({ _id: workflowId, userId: dbUser._id }, { googleDriveWatchTrigger: 1 });

    let expiresAt = -1;
    let watchedResourceUri = "";
    let _channelId = "";
    let _resourceId = "";
    const pageToken = (await drive.changes.getStartPageToken({})).data
      .startPageToken;

    if (result && result.googleDriveWatchTrigger?.isListening) {
      _channelId = uuidv4();
      const {
        changes,
        fileId,
        files,
        folderId,
        includeRemoved,
        restrictToMyDrive,
        supportedAllDrives,
      } = result.googleDriveWatchTrigger!;

      if (
        changes === "true" &&
        includeRemoved &&
        restrictToMyDrive &&
        supportedAllDrives &&
        pageToken
      ) {
        const channel = await drive.changes.watch({
          pageToken,
          supportsAllDrives: mapper[supportedAllDrives],
          includeRemoved: mapper[includeRemoved],
          pageSize: 1,
          restrictToMyDrive: mapper[restrictToMyDrive],
          requestBody: {
            id: _channelId,
            type: "web_hook",
            resourceId: folderId,
            address: `https://synapse.vercel.app/api/drive/notification?workflowId=${workflowId}&userId=${userId}`,
            kind: "api#channel",
          },
        });

        if (channel?.data?.expiration && channel.data.resourceUri) {
          watchedResourceUri = channel.data.resourceUri;
          expiresAt = parseInt(channel.data.expiration);
        }
        if (channel?.data?.resourceId) {
          _resourceId = channel.data.resourceId;
        }
      } else if (files === "false" && supportedAllDrives && fileId) {
        const channel = await drive.files.watch({
          supportsAllDrives: mapper[supportedAllDrives!],
          fileId,
        });

        if (channel?.data?.expiration && channel.data.resourceUri) {
          watchedResourceUri = channel.data.resourceUri;
          expiresAt = parseInt(channel.data.expiration);
        }
        if (channel?.data?.resourceId) {
          _resourceId = channel.data.resourceId;
        }
      }
    } else if (
      result?.googleDriveWatchTrigger &&
      !result.googleDriveWatchTrigger.isListening
    ) {
      const { channelId, resourceUri, resourceId } =
        result.googleDriveWatchTrigger;
      _channelId = "";
      watchedResourceUri = "";
      _resourceId = "";

      if (channelId && resourceId && resourceUri) {
        await drive.channels.stop({
          requestBody: {
            id: channelId,
            resourceId,
            kind: "api#channel",
            type: "web_hook",
            address: `https://synapse.vercel.app/api/drive/notification?workflowId=${workflowId}&userId=${userId}`,
            resourceUri,
          },
        });
      }
    }

    await Workflow.findByIdAndUpdate(workflowId, {
      $set: {
        "googleDriveWatchTrigger.expiresAt": expiresAt,
        "googleDriveWatchTrigger.channelId": _channelId,
        "googleDriveWatchTrigger.resourceId": _resourceId,
        "googleDriveWatchTrigger.resourceUri": watchedResourceUri,
        "googleDriveWatchTrigger.pageToken": pageToken,
      },
    });

    revalidatePath(`/workflows/editor/${workflowId}`);

    const message = result?.googleDriveWatchTrigger?.isListening
      ? "Listening to changes..."
      : "Listening stopped!";
    return new NextResponse(message, { status: 200 });
  } catch (error: any) {
    console.log(error?.message);
    return new NextResponse("Oops! something went wrong, try again", {
      status: 500,
    });
  }
}
