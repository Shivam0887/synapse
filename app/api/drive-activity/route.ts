import { google } from "googleapis";
import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import ConnectToDB from "@/lib/connectToDB";
import { Workflow, WorkflowType } from "@/models/workflow-model";
import { z } from "zod";
import { User } from "@/models/user-model";
import axios from "axios";

const reqSchema = z.object({
  folderId: z.string().optional(),
  supportedAllDrives: z.enum(["true", "false"]).optional(),
  restrictToMyDrive: z.enum(["true", "false"]).optional(),
  includeRemoved: z.enum(["true", "false"]).optional(),
  pageSize: z.number().default(1).optional(),
  fileId: z.string().optional(),
  changes: z.enum(["true", "false"]).optional(),
  files: z.enum(["true", "false"]).optional(),
  resourceUri: z.string().optional(),
  isListening: z.boolean(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ message: "User not authenticated" });

    const workflowId = new URL(req.nextUrl).searchParams.get("workflowId")!;

    const data = reqSchema.parse(await req.json());

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.OAUTH2_REDIRECT_URI
    );

    const clerkResponse = await clerkClient.users.getUserOauthAccessToken(
      user.id,
      "oauth_google"
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
    const googleDriveInfo = await Workflow.findOne<WorkflowType>(
      { _id: workflowId, userId: dbUser?._id },
      { googleDriveWatchTrigger: 1 }
    );

    let channelId = uuidv4();
    let expiresAt = Date.now();
    let resourceUri = "";
    let triggerData: z.infer<typeof reqSchema> = {
      isListening: data.isListening,
      supportedAllDrives: data.supportedAllDrives,
    };

    if (googleDriveInfo) {
      const googleDriveWatchTrigger = googleDriveInfo.googleDriveWatchTrigger!;

      if (googleDriveWatchTrigger.channelId)
        channelId = googleDriveWatchTrigger.channelId;

      triggerData = {
        isListening: data.isListening,
        changes: data.changes ?? googleDriveWatchTrigger.changes!,
        files: data.files ?? googleDriveWatchTrigger.files!,
        folderId: data.folderId ?? googleDriveWatchTrigger.folderId!,
        fileId: data.fileId ?? googleDriveWatchTrigger.fileId!,
        includeRemoved:
          data.includeRemoved ?? googleDriveWatchTrigger.includeRemoved!,
        restrictToMyDrive:
          data.restrictToMyDrive ?? googleDriveWatchTrigger.restrictToMyDrive!,
        supportedAllDrives:
          data.supportedAllDrives ??
          googleDriveWatchTrigger.supportedAllDrives!,
      };
    }

    if (data?.isListening) {
      const mapper = {
        true: true,
        false: false,
      };

      if (triggerData.changes === "true") {
        const channel = await drive.changes.watch({
          pageToken: (
            await drive.changes.getStartPageToken({})
          ).data.startPageToken!,
          supportsAllDrives: mapper[triggerData.supportedAllDrives!],
          includeRemoved: mapper[triggerData.includeRemoved!],
          pageSize: data.pageSize,
          restrictToMyDrive: mapper[triggerData.restrictToMyDrive!],
          requestBody: {
            id: channelId,
            type: "web_hook",
            resourceId: triggerData.folderId,
            address: `https://hvxdtx9t-3000.inc1.devtunnels.ms/api/drive-activity/notification?workflowId=${workflowId}`,
            kind: "api#channel",
          },
        });

        if (channel?.data?.expiration && channel.data.resourceUri) {
          expiresAt = parseInt(channel?.data?.expiration);
          resourceUri = channel.data.resourceUri;
        }
      } else {
        const channel = await drive.files.watch({
          supportsAllDrives: mapper[triggerData.supportedAllDrives!],
          fileId: triggerData.fileId!,
        });
        if (channel?.data?.expiration && channel.data.resourceUri) {
          expiresAt = parseInt(channel?.data?.expiration);
          resourceUri = channel.data.resourceUri;
        }
      }
    } else {
      await drive.channels.stop({
        requestBody: {
          id: channelId,
          resourceId: triggerData.folderId,
          kind: "api#channel",
          type: "web_hook",
          address: `https://hvxdtx9t-3000.inc1.devtunnels.ms/api/drive-activity/notification?workflowId=${workflowId}`,
          resourceUri: data.resourceUri!,
        },
      });
      channelId = "";
    }

    ConnectToDB();
    //if listener created store its channel id in db
    await Workflow.findByIdAndUpdate(googleDriveInfo?._id, {
      $set: {
        googleDriveWatchTrigger: {
          changes: triggerData.changes,
          files: triggerData.files,
          fileId: triggerData.fileId,
          folderId: triggerData.folderId,
          channelId,
          resourceUri: data.resourceUri,
          expiresAt,
          isListening: triggerData.isListening,
          supportedAllDrives: triggerData.supportedAllDrives,
          includeRemoved: triggerData.includeRemoved,
          restrictToMyDrive: triggerData.restrictToMyDrive,
        },
      },
    });

    const message = triggerData.isListening
      ? "Listening to changes..."
      : "trigger settings reset successfully!";

    return new NextResponse(message, { status: 200 });
  } catch (error: any) {
    console.log(error?.message);
    return new NextResponse("Oops! something went wrong, try again", {
      status: 500,
    });
  }
}
