import { stripe } from "@/lib/utils";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { User } from "@/models/user-model";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get("stripe-signature") ?? "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.log(
      "Webhook error - ",
      err instanceof Error ? err.message : "Unknown Error"
    );
    return new Response(
      `Webhook Error: ${err instanceof Error ? err.message : "Unknown Error"}`,
      { status: 400 }
    );
  }

  const session = event.data.object as Stripe.Checkout.Session;

  const customer = await stripe.customers.retrieve(session.customer as string);

  if (!customer.deleted) {
    switch (event.type) {
      case "checkout.session.completed":
        await User.findByIdAndUpdate(customer.metadata._id, {
          $set: {
            stripeSubscriptionId: session.subscription as string,
            stripeCustomerId: customer.id,
          },
        });
        break;
      case "checkout.session.expired":
        console.log("Checkout session is expired");
        break;
      case "invoice.payment_succeeded":
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        await User.findByIdAndUpdate(customer.metadata._id, {
          $set: {
            tier: customer.metadata.tier,
            credits:
              customer.metadata.tier === "Premium Plan" ? "Unlimited" : "100",
            stripePriceId: event.data.object.lines.data[0].price,
            stripeCurrentPeriodEnd: new Date(
              subscription.current_period_end * 1000
            ),
          },
        });
        break;
      default:
        console.log("payment_failed");
        break;
    }
  }

  return new Response(null, { status: 200 });
}
