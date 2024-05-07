"use server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import axios from "axios";
import { google } from "googleapis";

export const getFileMetaData = async () => {
  "use server";
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.OAUTH2_REDIRECT_URI
  );

  const { userId } = auth();

  if (!userId) {
    return { message: "User not found" };
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

  if (response) {
    return response.data;
  }
};
