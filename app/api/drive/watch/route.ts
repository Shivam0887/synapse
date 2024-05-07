import { google } from "googleapis";
import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import ConnectToDB from "@/lib/connectToDB";
import { Workflow, WorkflowType } from "@/models/workflow-model";
import { User } from "@/models/user-model";
import axios from "axios";

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ message: "User not authenticated" });

    const workflowId = new URL(req.nextUrl).searchParams.get("workflowId")!;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.OAUTH2_REDIRECT_URI
    );

    const clerkResponse = await axios.get(
      `https://api.clerk.com/v1/users/${user.id}/oauth_access_tokens/oauth_google`,
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

    const dbUser = await User.findOne({ userId: user?.id }, { _id: 1 });
    const result = await Workflow.findOne<WorkflowType>(
      { _id: workflowId, userId: dbUser?._id },
      { googleDriveWatchTrigger: 1 }
    );

    let expiresAt = -1;
    let watchedResourceUri = "";
    let _channelId = "";
    let _resourceId = "";

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
      const mapper = {
        true: true,
        false: false,
      };

      if (changes === "true") {
        const channel = await drive.changes.watch({
          pageToken: (
            await drive.changes.getStartPageToken({})
          ).data.startPageToken!,
          supportsAllDrives: mapper[supportedAllDrives!],
          includeRemoved: mapper[includeRemoved!],
          pageSize: 1,
          restrictToMyDrive: mapper[restrictToMyDrive!],
          requestBody: {
            id: _channelId,
            type: "web_hook",
            resourceId: folderId,
            address: `https://hvxdtx9t-3000.inc1.devtunnels.ms/api/drive/notification?workflowId=${workflowId}`,
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
      } else if (files === "false") {
        const channel = await drive.files.watch({
          supportsAllDrives: mapper[supportedAllDrives!],
          fileId: fileId!,
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
      result &&
      !result.googleDriveWatchTrigger?.isListening &&
      !!result.googleDriveWatchTrigger?.channelId?.length &&
      result.googleDriveWatchTrigger.resourceId
    ) {
      const { channelId, resourceUri, resourceId } =
        result.googleDriveWatchTrigger!;
      _channelId = "";
      watchedResourceUri = "";
      _resourceId = "";

      await drive.channels.stop({
        requestBody: {
          id: channelId,
          resourceId,
          kind: "api#channel",
          type: "web_hook",
          address: `https://hvxdtx9t-3000.inc1.devtunnels.ms/api/drive/notification?workflowId=${workflowId}`,
          resourceUri: resourceUri!,
        },
      });
    }

    ConnectToDB();
    //if listener created store its channel id in db
    await Workflow.findByIdAndUpdate(workflowId, {
      $set: {
        googleDriveWatchTrigger: {
          channelId: _channelId,
          resourceUri: watchedResourceUri,
          resourceId: _resourceId,
          expiresAt,
          changes: result?.googleDriveWatchTrigger?.changes,
          fileId: result?.googleDriveWatchTrigger?.fileId,
          files: result?.googleDriveWatchTrigger?.files,
          folderId: result?.googleDriveWatchTrigger?.folderId,
          includeRemoved: result?.googleDriveWatchTrigger?.includeRemoved,
          restrictToMyDrive: result?.googleDriveWatchTrigger?.restrictToMyDrive,
          supportedAllDrives:
            result?.googleDriveWatchTrigger?.supportedAllDrives,
          isListening: result?.googleDriveWatchTrigger?.isListening,
        },
      },
    });

    const message = result?.googleDriveWatchTrigger?.isListening
      ? "Listening to changes..."
      : "Listening stopped!";
    return new NextResponse(message, { status: 200 });
  } catch (error: any) {
    console.log(error);
    return new NextResponse("Oops! something went wrong, try again", {
      status: 500,
    });
  }
}
