import { google } from "googleapis";
import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.OAUTH2_REDIRECT_URI
  );

  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ message: "User not found" });
  }

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

  try {
    const response = await drive.files.list({
      q: "trashed = false",
      pageSize: 1,
      orderBy: "modifiedTime",
    });

    if (response) {
      return Response.json({ message: response.data.files, status: 200 });
    } else {
      return Response.json({ message: "No files found", status: 200 });
    }
  } catch (error) {
    return Response.json({ message: "Something went wrong", status: 200 });
  }
}
