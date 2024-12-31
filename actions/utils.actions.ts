"use server";

import axios from "axios";

import { oauthRedirectUri, stripe } from "@/lib/utils";
import ConnectToDB from "@/lib/connectToDB";
import { ConnectionTypes, ResultDataType, TActionResponse } from "@/lib/types";

import { auth } from "@clerk/nextjs/server";
import { User, UserType } from "@/models/user.model";
import { SCOPES, USER_SCOPES } from "@/lib/constants";
import { createPage } from "./notion.actions";

export const oauth2Url = (platform: ConnectionTypes) => {
  switch (platform) {
    case "Discord":
      return `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&permissions=2080&response_type=code&redirect_uri=${oauthRedirectUri}/discord&scope=${SCOPES[platform].join("+")}`;
    case "Notion":
      return `https://api.notion.com/v1/oauth/authorize?client_id=${process.env.NOTION_CLIENT_ID}&response_type=code&owner=user&redirect_uri=${oauthRedirectUri}/notion`;
    case "Slack":
      return `http://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&scope=${SCOPES[platform].join(",")}&user_scope=${USER_SCOPES[platform].join(",")}&redirect_uri=${oauthRedirectUri}/slack`;
    default:
      return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_DRIVE_CLIENT_ID}&redirect_uri=${oauthRedirectUri}/google_drive&response_type=code&scope=openid ${SCOPES[platform].join(" ")}&access_type=offline&prompt=consent select_account`;
  }
};

export async function getUserSubscriptionPlan() {
  const { userId } = await auth();

  await ConnectToDB();
  const dbUser = await User.findOne<
    Pick<
      UserType,
      | "stripePriceId"
      | "stripeCurrentPeriodEnd"
      | "stripeCustomerId"
      | "stripeSubscriptionId"
      | "tier"
      | "_id"
    >
  >(
    { userId },
    {
      stripePriceId: 1,
      stripeCurrentPeriodEnd: 1,
      stripeSubscriptionId: 1,
      stripeCustomerId: 1,
      tier: 1,
    }
  );

  const isSubscribed = Boolean(
    dbUser?.stripeCurrentPeriodEnd && // 86400000 = 1 day
      dbUser.stripeCurrentPeriodEnd.getTime() + 86_400_000 > Date.now()
  );

  if (!dbUser || !isSubscribed) {
    return {
      tier: dbUser ? dbUser.tier : "Free",
      isSubscribed: false,
      isCanceled: false,
      stripeCurrentPeriodEnd: dbUser ? dbUser.stripeCurrentPeriodEnd : null,
      stripeSubscriptionId: dbUser ? dbUser.stripeSubscriptionId : null,
      stripeCustomerId: dbUser ? dbUser.stripeCustomerId : null,
    };
  }

  let isCanceled = false;
  if (isSubscribed && dbUser.stripeSubscriptionId) {
    const stripePlan = await stripe.subscriptions.retrieve(
      dbUser.stripeSubscriptionId
    );
    isCanceled = stripePlan.cancel_at_period_end;
  }

  return {
    tier: dbUser.tier,
    stripeSubscriptionId: dbUser.stripeSubscriptionId,
    stripeCurrentPeriodEnd: dbUser.stripeCurrentPeriodEnd,
    stripeCustomerId: dbUser.stripeCustomerId,
    isSubscribed,
    isCanceled,
  };
}

export const postContentToWebhook = async (
  content: string,
  webhookUrl: string,
  nodeType: "Discord" | "Slack"
): Promise<TActionResponse> => {
  const format = nodeType === "Discord" ? { content } : { text: content };

  const isPosted = await axios.post(webhookUrl, format);

  if (isPosted) return { success: true, data: "success" };
  return { success: false, error: "failed request" };
};

export const sendMessage = async ({
  nodeType,
  action,
  webhookUrl,
  nodeId,
  workflowId,
  accessToken,
  properties,
  databaseId,
  pageId,
}: ResultDataType & { workflowId: string }) => {
  if (nodeType === "Google Drive") throw new Error("Invalid nodeType while sending message");

  if (nodeType === "Notion") {
    await createPage({
      workflowId,
      isTesting: false,
      nodeId,
      properties,
      databaseId,
      pageId,
    });
  } 
  else if (nodeType === "Discord") {
    if (action?.trigger === "1") {
      // Send a message to the DM channel
      await axios.post(
        "https://discord.com/api/v10/users/@me/channels",
        {
          recipient_id: action!.user!,
        },
        {
          headers: {
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN!}`,
            "Content-Type": "application/json",
          },
        }
      );
    } else await postContentToWebhook(action!.message!, webhookUrl!, nodeType);
  } 
  else {
    if (action?.trigger === "1") {
      await axios.post(
        "https://slack.com/api/chat.postMessage",
        { channel: action!.user!, text: action!.message! },
        {
          headers: {
            Authorization: `Bearer ${accessToken!}`,
          },
        }
      );
    } else await postContentToWebhook(action!.message!, webhookUrl!, nodeType);
  }
};