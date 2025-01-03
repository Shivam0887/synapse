import { User, UserType } from "@/models/user.model";
import ConnectToDB from "@/lib/connectToDB";
import { NextRequest, NextResponse } from "next/server";
import { Workflow } from "@/models/workflow.model";
import { Slack } from "@/models/slack.model";
import { absolutePathUrl, oauthRedirectUri } from "@/lib/utils";

const clientId = process.env.SLACK_CLIENT_ID!;
const clientSecret = process.env.SLACK_CLIENT_SECRET!;
const redirectUri = oauthRedirectUri + "/slack";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const userId = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${absolutePathUrl}}/workflows`);
  }

  if (!code) {
    return new NextResponse("Code not provided", { status: 400 });
  }

  if (!userId) {
    return new NextResponse("user not authenticated", { status: 401 });
  }

  try {
    await ConnectToDB();
    const dbUser = await User.findOne<UserType>({ userId });

    const response = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    const data = await response.json();

    // Check if the response indicates a failure
    if (data && !data.ok) {
      throw new Error(data.error || "Slack OAuth failed");
    }

    const accessToken = data.access_token;
    const nodeMetaData = await Workflow.findById(dbUser?.currentWorkflowId, {
      selectedNodeId: 1,
      selectedNodeType: 1,
    });

    if (
      nodeMetaData?.selectedNodeId &&
      nodeMetaData?.selectedNodeType === "Slack"
    ) {
      const slack = await Slack.create({
        appId: data.app_id,
        authenticated_userId: data.authed_user.id,
        authenticated_userToken: data.authed_user.access_token,
        botUserId: data.bot_user_id,
        teamId: data.team.id,
        teamName: data.team.name,
        userId: dbUser?._id,
        accessToken,
        nodeId: nodeMetaData.selectedNodeId,
        nodeType: nodeMetaData.selectedNodeType,
        template: "",
        channelId: data.incoming_webhook.channel_id,
        channelName: data.incoming_webhook.channel,
        webhookUrl: data.incoming_webhook.url,
        workflowId: dbUser?.currentWorkflowId,
      });

      await Workflow.findByIdAndUpdate(dbUser?.currentWorkflowId, {
        $push: {
          slackId: slack?._id,
        },
      });
    }

    // Handle the successful OAuth flow and redirect the user
    return NextResponse.redirect(
      `${absolutePathUrl}/workflows/editor/${dbUser?.currentWorkflowId}`
    );
  } catch (error) {
    if (error instanceof Error)
      console.log("Failed to connect with Slack:", error.message);

    return new NextResponse(
      "Internal Server Error. Failed to connect with Slack",
      { status: 500 }
    );
  }
}
