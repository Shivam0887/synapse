import { Slack, SlackType } from "@/models/slack-model";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const reqBodySchema = z.object({
  workflowId: z.string(),
  nodeId: z.string(),
});

const isMemberExists = new Map<string, { id: string; username: string }>();

export async function POST(req: NextRequest) {
  try {
    const reqBody = await req.json();
    const { nodeId, workflowId } = reqBodySchema.parse(reqBody);

    const slackInstance = await Slack.findOne<SlackType>(
      { nodeId, workflowId },
      { _id: 0, channelId: 1, accessToken: 1 }
    );

    if (slackInstance) {
      const response = await axios.get(
        "https://slack.com/api/conversations.members",
        {
          headers: {
            Authorization: `Bearer ${slackInstance.accessToken}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          params: {
            channel: slackInstance.channelId,
          },
        }
      );

      if (response?.data.ok) {
        const memberIds: string[] = response.data.members;

        const users: { id: string; username: string }[] = [];

        for (const memberId of memberIds) {
          if (!isMemberExists.has(memberId)) {
            const userInfo = await axios.get(
              "https://slack.com/api/users.info",
              {
                headers: {
                  Authorization: `Bearer ${slackInstance.accessToken}`,
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                params: {
                  user: memberId,
                },
              }
            );

            if (userInfo?.data?.ok && !userInfo.data.user.is_bot) {
              const { user } = userInfo.data;
              isMemberExists.set(memberId, {
                id: user.id,
                username: user.name,
              });

              users.push({
                id: user.id as string,
                username: user.name as string,
              });
            }
          } else {
            users.push({
              id: isMemberExists.get(memberId)!.id,
              username: isMemberExists.get(memberId)!.username,
            });
          }
        }

        return NextResponse.json({ success: true, users }, { status: 200 });
      } else {
        throw new Error(response.data.error.message);
      }
    }

    return NextResponse.json(
      { success: false, message: "not found" },
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
