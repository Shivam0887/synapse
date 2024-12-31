"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/constants";
import { TPlan } from "@/lib/types";
import axios from "axios";

type SubscriptionCardProps = {
  productName: TPlan;
  productId: string;
  tier: TPlan;
  isSubscribed: boolean;
};

export const SubscriptionCard = ({
  productName,
  productId,
  tier,
  isSubscribed,
}: SubscriptionCardProps) => {
  const onPayment = async (id: string) => {
    try {
      const { data } = await axios.post(
        "/api/payment",
        {
          productId: id,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      window.location.assign(data.url ?? "/billing");
    } catch (error: any) {
      console.log("onPayment error:", error?.message);
    }
  };

  return (
    <>
      {((tier === "Free" && productName !== "Free") ||
        (tier === "Pro" && productName === "Premium")) && (
        <section className="md:w-[80%] w-full mx-auto my-5">
          <h2 className="text-3xl font-semibold mb-5 mx-auto max-w-max text-[#7540A9]">
            Upgrade Now
          </h2>

          <div className="space-y-3">
            <Card className="p-3">
              <CardHeader>
                <CardTitle className="flex gap-2 items-center">
                  <span>{productName}</span>
                  {!isSubscribed ? (
                    <span className="font-semibold">
                      {productName === "Premium" ? "$49" : "$19"}
                      /month
                    </span>
                  ) : (
                    <span className="h-1 w-1 rounded-full bg-green-500" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="text-base">
                  {productName === "Premium"
                    ? "Upgrade to the Premium Plan & unlock the full potential of automation with advanced features."
                    : "Experience a monthly surge of credits to supercharge your automation efforts. Ideal for small to medium-sized projects seeking consistent support."}
                </div>
                <div className="space-y-3">
                  <ul className="my-4 flex flex-col gap-2">
                    {PLANS[productName].map(
                      ({ available, desc, icon: Icon }, i) => (
                        <li
                          key={`${productName}:${i}`}
                          className={`flex items-center gap-2 ${
                            available ? "" : "text-neutral-500"
                          }`}
                        >
                          <Icon />
                          {desc}
                        </li>
                      )
                    )}
                  </ul>
                </div>

                <Button
                  onClick={async () => await onPayment(productId)}
                  variant="outline"
                >
                  Purchase
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      )}
    </>
  );
};
