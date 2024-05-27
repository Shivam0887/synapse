import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { currentUser } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { User, UserType } from "./../models/user-model";
import ConnectToDB from "./connectToDB";

export const stripe = new Stripe(process.env.STRIPE_SECRET!, {
  apiVersion: "2024-04-10",
  typescript: true,
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const absolutePathUrl = () => {
  if (process.env.VERCEL_URL) return "https://synapse.vercel.app";
  return "http://localhost:3000";
};

export async function getUserSubscriptionPlan() {
  const user = await currentUser();

  ConnectToDB();
  const dbUser = await User.findOne<UserType>({ userId: user?.id });

  if (!dbUser) {
    return {
      tier: "Free Plan",
      isSubscribed: false,
      isCanceled: false,
      stripeCurrentPeriodEnd: null,
      stripeSubscriptionId: null,
      stripeCustomerId: null,
    };
  }

  const isSubscribed = Boolean(
    dbUser.stripePriceId &&
      dbUser.stripeCurrentPeriodEnd && // 86400000 = 1 day
      dbUser.stripeCurrentPeriodEnd.getTime() + 86_400_000 > Date.now()
  );

  if (!isSubscribed && dbUser.stripePriceId) {
    await User.findByIdAndUpdate(dbUser._id, {
      $set: {
        tier: "Free Plan",
        credits: "0",
        isAutoSave: false,
        stripeCurrentPeriodEnd: null,
        stripeSubscriptionId: null,
        stripeCustomerId: null,
        stripePriceId: null,
      },
    });

    return {
      tier: "Free Plan",
      isSubscribed,
      isCanceled: true,
      stripeCurrentPeriodEnd: null,
      stripeSubscriptionId: null,
      stripeCustomerId: null,
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
