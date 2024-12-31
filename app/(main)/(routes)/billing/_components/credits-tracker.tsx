import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TPlan } from "@/lib/types";
import { PLANS } from "@/lib/constants";

type CreditTrackerProps = {
  credits: string;
  tier: TPlan;
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
}: CreditTrackerProps) => {
  return (
    <Card className="md:w-[80%] w-full mx-auto">
      <CardHeader className="flex flex-col gap-4">
        <CardTitle className="flex gap-2 justify-between items-center">
          <span className="flex gap-2 items-center">
            <span className="text-green-500">Active Plan</span>
            {tier}
          </span>
          {isSubscribed && stripeCurrentPeriodEnd && (
            <span className="flex gap-2 items-center text-sm text-neutral-500">
              {isCanceled
                ? "Your plan will be canceled on "
                : "Your plan renews on "}
              {format(stripeCurrentPeriodEnd, "dd/MM/yyyy")}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-2 items-center">
          <span className="text-sm w-24">Credits Left</span>
          {(tier === "Free" || tier === "Pro") && (
            <Progress
              value={tier == "Free" ? Number(credits) * 10 : Number(credits)}
              className="flex-1 h-3"
            />
          )}
          <span className="w-10">
            {tier === "Premium"
              ? "Unlimited Credits"
              : tier === "Pro"
              ? `${credits}/100`
              : `${credits}/10`}
          </span>
        </div>

        <div className="space-y-3">
          <ul className="my-4 flex flex-col gap-2">
            {PLANS[tier].map(({ available, desc, icon: Icon }, i) => (
              <li
                key={`${tier}:${i}`}
                className={`flex items-center gap-2 ${
                  available ? "" : "text-neutral-500"
                }`}
              >
                <Icon />
                {desc}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreditTracker;
