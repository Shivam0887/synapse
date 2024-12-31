import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

import { WebClient } from "@slack/web-api";
import { Slack, SlackType } from "@/models/slack.model";

const slackClient = new WebClient();

const reqBodySchema = z.object({
  workflowId: z.string(),
  nodeId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const reqBody = await req.json();
    const { nodeId, workflowId } = reqBodySchema.parse(reqBody);

    const slackInstance = await Slack.findOne<SlackType>(
      { nodeId, workflowId },
      { _id: 0, channelId: 1, accessToken: 1 }
    );

    if (slackInstance) {
      const response = await slackClient.conversations.members({
        token: slackInstance.accessToken,
        channel: slackInstance.channelId,
      });

      if (response.error) throw new Error(response.error);
      if (!response.members)
        return NextResponse.json(
          { success: false, message: "No member found" },
          { status: 404 }
        );

      const memberIds = response.members;

      const users: { id: string; username: string }[] = [];

      await Promise.all(
        memberIds.map(async (memberId) => {
          const userInfo = await slackClient.users.info({
            token: slackInstance.accessToken,
            user: memberId,
          });

          if (userInfo.user?.id && userInfo.user?.name) {
            users.push({
              id: userInfo.user.id,
              username: userInfo.user.name,
            });
          }
        })
      );

      return NextResponse.json({ success: true, users }, { status: 200 });
    }

    return NextResponse.json(
      { success: false, message: "Slack channel not found" },
      { status: 404 }
    );
  } catch (error: any) {
    console.log(error?.message);
    return NextResponse.json(
      { success: false, error: error?.message },
      { status: 500 }
    );
  }
}
