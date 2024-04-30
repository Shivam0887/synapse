import { User, UserType } from "@/models/user-model";
import ConnectToDB from "@/lib/connectToDB";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { Workflow } from "@/models/workflow-model";
import { Slack } from "@/models/slack-model";

export async function GET(req: NextRequest) {
  const user = await currentUser();
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return new NextResponse("Code not provided", { status: 400 });
  }
  if (!user) {
    return new NextResponse("user not authenticated", { status: 401 });
  }

  try {
    const dbUser = await User.findOne<UserType>({ userId: user.id });

    const response = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        redirect_uri: process.env.SLACK_REDIRECT_URI!,
      }),
    });

    const data = await response.json();

    // Check if the response indicates a failure
    if (data && !data.ok) {
      throw new Error(data.error || "Slack OAuth failed");
    }

    ConnectToDB();
    const accessToken = data.access_token;
    const nodeId = await Workflow.findById(dbUser?.currentWorkflowId, {
      selectedNodeId: 1,
    });

    const slack = await Slack.create({
      appId: data.app_id,
      authenticated_userId: data.authed_user.id,
      authenticated_userToken: data.authed_user.access_token,
      botUserId: data.bot_user_id,
      teamId: data.team.id,
      teamName: data.team.name,
      userId: dbUser?._id,
      accessToken,
      nodeId: nodeId.selectedNodeId,
      trigger: "",
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

    // Handle the successful OAuth flow and redirect the user
    return NextResponse.redirect(
      `http://localhost:3000/workflows/editor/${dbUser?.currentWorkflowId}`
    );
  } catch (error: any) {
    console.error(error?.message);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
