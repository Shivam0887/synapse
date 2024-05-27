"use client";

type Props = {
  onPayment(id: string): Promise<void>;
  productName: string;
  productId: string;
  tier: string;
  isSubscribed: boolean;
};

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckIcon, X } from "lucide-react";

export const SubscriptionCard = ({
  onPayment,
  productName,
  productId,
  tier,
  isSubscribed,
}: Props) => {
  return (
    <section className="md:w-[80%] w-full mx-auto my-5">
      {productName !== tier && (
        <h2 className="text-3xl font-semibold mb-5 mx-auto max-w-max text-[#7540A9]">
          Upgrade Now
        </h2>
      )}

      <div className="space-y-3">
        <Card className="p-3">
          <CardHeader>
            <CardTitle className="flex gap-2 items-center">
              <p>{productName}</p>
              {!isSubscribed ? (
                <p className="font-semibold">
                  {productName === "Premium Plan" ? "$49" : "$19"}
                  /month
                </p>
              ) : (
                <span className="h-1 w-1 rounded-full bg-green-500" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="text-base">
              {productName === "Premium Plan"
                ? "Upgrade to the Premium Plan & unlock the full potential of automation with advanced features."
                : "Experience a monthly surge of credits to supercharge your automation efforts. Ideal for small to medium-sized projects seeking consistent support."}
            </div>
            <div className="space-y-3">
              {productName === "Pro Plan" && (
                <ul className="my-4 flex flex-col gap-2">
                  <li className="flex items-center gap-2">
                    <CheckIcon />
                    100 credits- 1 credit per automation task
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon />
                    Perform 100 automation tasks.
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon />
                    Create 50 workflows.
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon />
                    Publish 25 workflows.
                  </li>
                  <li className="flex items-center gap-2 text-neutral-500">
                    <X />
                    Automatically save workflows to prevent data loss.
                  </li>
                  <li className="flex items-center gap-2 text-neutral-500">
                    <X />
                    Use AI to create and optimize workflows.
                  </li>
                </ul>
              )}
              {productName === "Premium Plan" && (
                <ul className="my-4 flex flex-col gap-2">
                  <li className="flex items-center gap-2">
                    <CheckIcon />
                    Unlimited credits
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon />
                    Perform unlimited automation tasks.
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon />
                    Create unlimited workflows.
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon />
                    Publish unlimited workflows.
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon />
                    Automatically save workflows to prevent data loss.
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon />
                    Use AI to create and optimize workflows.
                  </li>
                </ul>
              )}
            </div>
            {productName === tier ? (
              <Button
                onClick={async () => await onPayment(productId)}
                variant="outline"
              >
                Manage
              </Button>
            ) : (
              <Button
                onClick={async () => await onPayment(productId)}
                variant="outline"
              >
                Purchase
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
      {tier === "Free Plan" && (
        <Card className="p-3">
          <CardHeader>
            <CardTitle className="flex gap-2">
              <p>Free Plan</p>
              <p className="font-semibold">$0/month</p>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="space-y-3">
              <ul className="my-4 flex flex-col gap-2">
                <li className="flex items-center gap-2">
                  <CheckIcon />
                  10 credits- 1 credit per automation task
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon />
                  Perform 10 automation tasks.
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon />
                  Create 5 workflows.
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon />
                  Publish 3 workflows.
                </li>
                <li className="flex items-center gap-2 text-neutral-500">
                  <X />
                  Automatically save workflows to prevent data loss.
                </li>
                <li className="flex items-center gap-2 text-neutral-500">
                  <X />
                  Use AI to create and optimize workflows.
                </li>
              </ul>
            </div>

            <Button disabled variant="outline">
              Active
            </Button>
          </CardContent>
        </Card>
      )}
    </section>
  );
};
