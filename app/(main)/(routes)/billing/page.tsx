import Stripe from "stripe";
import BillingDashboard from "./_components/billing-dashboard";
import { PLANS } from "@/lib/constant";
import { getUser } from "../connections/_actions/get-user";
import { getUserSubscriptionPlan } from "@/lib/utils";

const stripe = new Stripe(process.env.STRIPE_SECRET!, {
  typescript: true,
  apiVersion: "2024-04-10",
});

type Props = {
  searchParams: { [key: string]: "Pro" | "Premium" | undefined };
};

const Billing = async (props: Props) => {
  const plan = props.searchParams.plan ?? "";
  let productId = plan === "Premium" || plan === "Pro" ? PLANS[plan] : "";

  const { isCanceled, isSubscribed, stripeCurrentPeriodEnd } =
    await getUserSubscriptionPlan();

  const user = await getUser();
  if (user && !productId) {
    const priceId = JSON.parse(user).stripePriceId;
    if (priceId) {
      const product_id = (await stripe.prices.retrieve(priceId))
        .product as string;
      productId = product_id;
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="sticky top-0 z-[10] pl-10 flex items-center justify-between border-b bg-background/50 p-6 text-4xl backdrop-blur-lg">
        Billing
      </h1>
      <BillingDashboard
        productId={productId}
        isCanceled={isCanceled}
        isSubscribed={isSubscribed}
        stripeCurrentPeriodEnd={stripeCurrentPeriodEnd}
      />
    </div>
  );
};

export default Billing;
