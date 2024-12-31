"use client";

import CreditTracker from "./credits-tracker";
import { SubscriptionCard } from "./subscription-card";
import { useBilling } from "@/providers/billing-provider";

type BillingDashboardProps = {
  productId: string;
  stripeCurrentPeriodEnd: Date | null | undefined;
  isSubscribed: boolean;
  isCanceled: boolean;
  productName: "Free" | "Pro" | "Premium";
};

const BillingDashboard = ({
  isCanceled,
  isSubscribed,
  productId,
  stripeCurrentPeriodEnd,
  productName,
}: BillingDashboardProps) => {
  const { credits, tier } = useBilling();
  
  return (
    <div className="flex flex-col gap-4 p-6">
      <CreditTracker
        tier={tier}
        credits={credits}
        isCanceled={isCanceled}
        isSubscribed={isSubscribed}
        stripeCurrentPeriodEnd={stripeCurrentPeriodEnd}
      />
      <SubscriptionCard
        tier={tier}
        productName={productName}
        productId={productId}
        isSubscribed={isSubscribed}
      />
    </div>
  );
};

export default BillingDashboard;
