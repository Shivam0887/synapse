import BillingDashboard from "./_components/billing-dashboard";
import { getUserSubscriptionPlan } from "@/actions/utils.actions";

type BillingProps = {
  searchParams: { [key: string]: "Pro" | "Premium" | undefined };
};

const Billing = async ({ searchParams }: BillingProps) => {
  const plan = searchParams.plan;
  let productId =
    plan === "Premium"
      ? process.env.STRIPE_PREMIUM_PRODUCT_ID!
      : plan === "Pro"
      ? process.env.STRIPE_PRO_PRODUCT_ID!
      : "";

  const { isCanceled, isSubscribed, stripeCurrentPeriodEnd, tier } =
    await getUserSubscriptionPlan();
  const productName = plan
    ? plan
    : tier === "Free"
    ? "Pro"
    : tier === "Pro"
    ? "Premium"
    : "Premium";

  if (productId.length === 0 && tier === "Free") {
    productId =
      productName === "Pro"
        ? process.env.STRIPE_PRO_PRODUCT_ID!
        : process.env.STRIPE_PREMIUM_PRODUCT_ID!;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="sticky top-0 z-[10] pl-10 flex items-center justify-between border-b bg-background/50 p-6 text-4xl backdrop-blur-lg">
        Billing
      </h1>
      <BillingDashboard
        productName={
          plan
            ? plan
            : tier === "Free"
            ? "Pro"
            : tier === "Pro"
            ? "Premium"
            : "Premium"
        }
        productId={productId}
        isCanceled={isCanceled}
        isSubscribed={isSubscribed}
        stripeCurrentPeriodEnd={stripeCurrentPeriodEnd}
      />
    </div>
  );
};

export default Billing;
