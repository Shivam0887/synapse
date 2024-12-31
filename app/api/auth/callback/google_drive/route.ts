import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

import { Credentials } from "@/lib/types";
import ConnectToDB from "@/lib/connectToDB";
import { absolutePathUrl, oauthRedirectUri } from "@/lib/utils";

import { Workflow } from "@/models/workflow.model";
import { User, UserType } from "@/models/user.model";
import { GoogleDrive } from "@/models/google-drive.model";

const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID!;
const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET!;
const redirectUri = `${oauthRedirectUri}/google_drive`;

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const userId = req.nextUrl.searchParams.get("state");

  let workflowId = "";
  try {
    if (error) {
      throw new Error(error);
    }

    if (!code) {
      return new NextResponse("Code not provided", { status: 400 });
    }
    if (!userId) {
      return new NextResponse("Bad request", { status: 400 });
    }

    const tokenUrl = "https://oauth2.googleapis.com/token";

    const response = await axios.post(
      tokenUrl,
      {},
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        params: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }),
      }
    );

    if (response.data) {
      await ConnectToDB();

      const dbUser = await User.findOne<UserType>({ userId });
      const nodeMetaData = await Workflow.findById(dbUser?.currentWorkflowId, {
        selectedNodeId: 1,
        selectedNodeType: 1,
      });

      const tokens = response.data as Credentials;
      if (tokens.access_token && tokens.expires_in && tokens.refresh_token && nodeMetaData) {
        const googleDrive = await GoogleDrive.create({
          nodeId: nodeMetaData.selectedNodeId,
          nodeType: nodeMetaData.selectedNodeType,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: Date.now() + tokens.expires_in * 1000
        });

        await Workflow.findByIdAndUpdate(dbUser?.currentWorkflowId, {
          $push: {
            googleDriveId: googleDrive?._id,
          },
        });

        await GoogleDrive.findByIdAndUpdate(googleDrive?._id, {
          $set: {
            workflowId: dbUser?.currentWorkflowId
          }
        });

        workflowId = dbUser?.currentWorkflowId ?? "";
      }
    }

    return NextResponse.redirect(`${absolutePathUrl}/workflows/editor/${workflowId}`);
  } catch (error: any) {
    console.log("Google drive connection error:", error?.message);
    return new NextResponse(
      "Internal server error when connecting to Google Drive",
      { status: 500 }
    );
  }
}
