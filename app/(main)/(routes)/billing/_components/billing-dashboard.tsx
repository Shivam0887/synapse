"use client";

import { useBilling } from "@/providers/billing-provider";
import axios from "axios";
import { useEffect, useState } from "react";
import { SubscriptionCard } from "./subscription-card";
import CreditTracker from "./credits-tracker";
import WorkflowLoading from "../../workflows/editor/_components/workflow-loading";
import { toast } from "sonner";
import { getUser } from "../../connections/_actions/get-user";
import { loadStripe } from "@stripe/stripe-js";
import { getUserSubscriptionPlan } from "@/lib/utils";

const stripePromise = loadStripe(process.env.STRIPE_PUBLISHABLE_KEY!);

type BillingDashboardProps = {
  productId: string;
  stripeCurrentPeriodEnd: Date | null | undefined;
  isSubscribed: boolean;
  isCanceled: boolean;
};

const BillingDashboard = ({
  isCanceled,
  isSubscribed,
  productId,
  stripeCurrentPeriodEnd,
}: BillingDashboardProps) => {
  const { credits, tier, setCredits, setTier } = useBilling();
  const [loading, setLoading] = useState<boolean>(false);
  const [stripeProductName, setStripeProductName] = useState<string>("");

  useEffect(() => {
    const onStripeProducts = async () => {
      const response = await axios.get(`/api/payment?productId=${productId}`);
      if (response.status === 200) {
        setStripeProductName(response.data.name);
      } else toast.error(response.data.error);
    };
    if (productId) onStripeProducts();
  }, [productId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const response = await getUser();
      if (response) {
        const data = JSON.parse(response);
        setCredits(data.credits);
        setTier(data.tier);
      }
      setLoading(false);
    })();
  }, [setCredits, setTier]);

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
      console.log(error?.message);
    }
  };

  return (
    <>
      {loading ? (
        <WorkflowLoading />
      ) : (
        <>
          <div className="flex flex-col gap-4 p-6">
            <CreditTracker
              tier={tier}
              credits={credits}
              isCanceled={isCanceled}
              isSubscribed={isSubscribed}
              stripeCurrentPeriodEnd={stripeCurrentPeriodEnd}
            />
            <SubscriptionCard
              onPayment={onPayment}
              tier={tier}
              productName={stripeProductName}
              productId={productId}
              isSubscribed={isSubscribed}
            />
          </div>
        </>
      )}
    </>
  );
};

export default BillingDashboard;
