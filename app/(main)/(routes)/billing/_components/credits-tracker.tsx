import React from "react";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";

type Props = {
  credits: string;
  tier: string;
  stripeCurrentPeriodEnd: Date | null | undefined;
  isSubscribed: boolean;
  isCanceled: boolean;
};

const CreditTracker = ({
  credits,
  tier,
  isCanceled,
  isSubscribed,
  stripeCurrentPeriodEnd,
}: Props) => {
  return (
    <section className="md:w-[80%] w-full mx-auto">
      <Card>
        <CardHeader className="flex flex-col gap-4">
          <CardTitle className="flex gap-2 justify-between items-center">
            <div className="flex gap-2 items-center">
              <p className="text-green-500">Active Plan</p>
              {tier.substring(0, tier.length - 4)}
            </div>
            {isSubscribed && stripeCurrentPeriodEnd && (
              <div className="flex gap-2 items-center text-sm text-neutral-500">
                {isCanceled
                  ? "Your plan will be canceled on "
                  : "Your plan renews on "}
                {format(stripeCurrentPeriodEnd, "dd/MM/yyyy")}
              </div>
            )}
          </CardTitle>
          <CardDescription className="flex gap-2 items-center">
            <p className="text-sm w-24">Credits Left</p>
            {(tier === "Free Plan" || tier === "Pro Plan") && (
              <Progress
                value={
                  tier == "Free Plan" ? Number(credits) * 10 : Number(credits)
                }
                className="flex-1 h-3"
              />
            )}
            <p className="w-10">
              {tier === "Premium Plan"
                ? "Unlimited Credits"
                : tier === "Pro Plan"
                ? `${credits}/100`
                : `${credits}/10`}
            </p>
          </CardDescription>
        </CardHeader>
      </Card>
    </section>
  );
};

export default CreditTracker;
