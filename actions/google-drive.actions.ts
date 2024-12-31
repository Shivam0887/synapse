"use server";

import axios from "axios";
import { drive_v3, google } from "googleapis";

import ConnectToDB from "@/lib/connectToDB";
import { TActionResponse } from "@/lib/types";

import { auth } from "@clerk/nextjs/server";
import { GoogleDrive } from "@/models/google-drive.model";

type GoogleDriveSettings = {
  nodeId: string;
  driveId: string;
  supportedAllDrives: "true" | "false";
  restrictToMyDrive: "true" | "false";
  includeRemoved: "true" | "false";
  fileId: string;
  changes: "true" | "false";
};

export const getFileMetaData = async (): Promise<
  TActionResponse<drive_v3.Schema$FileList>
> => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_DRIVE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.CLERK_REDIRECT_URI
  );

  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "user is not authenticated" };
  }

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

  const drive = google.drive({ version: "v3", auth: oauth2Client });
  const response = await drive.files.list();

  return {
    success: true,
    data: response.data,
  };
};

export const getGoogleListener = async (
  id: string
): Promise<TActionResponse<Omit<GoogleDriveSettings, "nodeId">>> => {
  try {
    await ConnectToDB();
    const googleDriveNode = await GoogleDrive.findOne({
      nodeId: id,
    });

    if (!googleDriveNode) {
      return {
        success: false,
        error: "No Google Drive node with this node Id",
      };
    }

    const {
      driveId,
      fileId,
      changes,
      supportedAllDrives,
      includeRemoved,
      restrictToMyDrive,
    } = googleDriveNode._doc;

    return {
      success: true,
      data: {
        driveId,
        fileId,
        changes,
        supportedAllDrives,
        includeRemoved,
        restrictToMyDrive,
      },
    };
  } catch (error: any) {
    console.log("Error while getting google listener", error?.message);
    return {
      success: false,
      error: "Failed to get google drive listener",
    };
  }
};

export const updateGoogleDriveSettings = async (
  options: GoogleDriveSettings
): Promise<TActionResponse> => {
  try {
    const user = await auth();
    if (!user) return { success: false, error: "User not authenticated" };

    const { nodeId, ...rest } = options;

    await ConnectToDB();
    await GoogleDrive.findOneAndUpdate({ nodeId }, { $set: rest });

    return {
      success: true,
      data: "Google Drive trigger settings saved successfully!",
    };
  } catch (error: any) {
    console.log("Google Drive Settings updation error:", error?.message);
    return {
      success: false,
      error: "Oops! something went wrong, while updating Google Drive setting",
    };
  }
};
