import { postContentToWebhook } from "@/app/(main)/(routes)/connections/_actions/discord-action";
import { onCreateNewPageInDatabase } from "@/app/(main)/(routes)/connections/_actions/notion-action";
import { postMessageToSlack } from "@/app/(main)/(routes)/connections/_actions/slack-action";
import ConnectToDB from "@/lib/connectToDB";
import { ConnectionTypes } from "@/lib/types";
import { Discord, DiscordType } from "@/models/discord-model";
import { Notion, NotionType } from "@/models/notion-model";
import { Slack, SlackType } from "@/models/slack-model";
import { User, UserType } from "@/models/user-model";
import { Workflow, WorkflowType } from "@/models/workflow-model";
import { currentUser } from "@clerk/nextjs/server";
import axios from "axios";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    console.log("🔴 Changed");
    const user = await currentUser();
    const headersList = headers();
    const workflowId = new URL(req.nextUrl).searchParams.get("workflowId")!;

    const resourceId = headersList.get("x-goog-resource-id")!;
    const expiration = headersList.get("x-goog-channel-expiration")!;
    const channelId = headersList.get("x-goog-channel-id")!;
    const state = headersList.get("x-goog-resource-state")!;

    if (resourceId && user) {
      ConnectToDB();
      const dbUser = await User.findOne<UserType>({
        userId: user.id,
        workflowId,
      });

      // if (
      //   (dbUser && parseInt(dbUser.credits!) > 0) ||
      //   dbUser?.credits === "Unlimited"
      // ) {
      //   const workflow = await Workflow.findOne<WorkflowType>({
      //     _id: workflowId,
      //     userId: dbUser._id,
      //   });

      //   if (workflow && workflow.nodeMetadata) {
      //     const nodeMetadata = JSON.parse(workflow.nodeMetadata) as {
      //       type: ConnectionTypes | "Wait";
      //       id: string;
      //     }[];

      //     nodeMetadata.forEach(async ({ id, type }) => {
      //       if (type == "Discord") {
      //         const discordMessage = await Discord.findOne<DiscordType>(
      //           { userId: dbUser._id, workflowId: workflow._id },
      //           { url: 1, template: 1 }
      //         );

      //         if (discordMessage) {
      //           await postContentToWebhook(
      //             discordMessage.template!,
      //             discordMessage.url!
      //           );
      //         }
      //       } else if (type == "Slack") {
      //         const slack = await Slack.findOne<SlackType>({
      //           userId: dbUser?._id,
      //           workflowId,
      //         });
      //         const channels = slack?.slackChannels.map((channel: string) => {
      //           return {
      //             label: "",
      //             value: channel,
      //           };
      //         });

      //         if (dbUser?.slack && slack) {
      //           await postMessageToSlack(
      //             dbUser.slack.accessToken!,
      //             channels!,
      //             slack.template!
      //           );
      //         }
      //       } else if (type == "Notion") {
      //         const notion = await Notion.findOne<NotionType>({
      //           userId: dbUser?._id,
      //           workflowId,
      //         });
      //         if (dbUser?.notion && notion) {
      //           await onCreateNewPageInDatabase(
      //             notion.databaseId!,
      //             dbUser.notion.accessToken!,
      //             notion.template!
      //           );
      //         }
      //       } else if (type == "Wait") {
      //         const res = await axios.put(
      //           "https://api.cron-job.org/jobs",
      //           {
      //             job: {
      //               url: `https://hvxdtx9t-3000.inc1.devtunnels.ms/?flow_id=${workflow._id}`,
      //               enabled: "true",
      //               schedule: {
      //                 timezone: "Asia/Kolkata",
      //                 expiresAt: 0,
      //                 hours: [-1],
      //                 mdays: [-1],
      //                 minutes: ["*****"],
      //                 months: [-1],
      //                 wdays: [-1],
      //               },
      //             },
      //           },
      //           {
      //             headers: {
      //               Authorization: `Bearer ${process.env.CRON_JOB_KEY!}`,
      //               "Content-Type": "application/json",
      //             },
      //           }
      //         );
      //       }
      //     });
      //   }
      // }

      // await User.findByIdAndUpdate(dbUser?._id, {
      //   $set: {
      //     credits: `${parseInt(dbUser?.credits!) - 1}`,
      //   },
      // });
    }

    return Response.json({ message: "flow completed" }, { status: 200 });
  } catch (error) {
    return Response.json(
      { message: "notification to changes failed" },
      { status: 500 }
    );
  }
}
