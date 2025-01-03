import { User, UserType } from "@/models/user.model";
import { auth } from "@clerk/nextjs/server";
import { NextResponse, NextRequest } from "next/server";
import { absolutePathUrl, stripe } from "@/lib/utils";
import { z } from "zod";
import { getUserSubscriptionPlan } from "@/actions/utils.actions";

const reqSchema = z.object({
  productId: z.string(),
});

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("productId");
  try {
    if (productId) {
      const product = await stripe.products.retrieve(productId);
      return NextResponse.json(
        {
          name: product.name,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  } catch (error) {
    if (error instanceof Error)
      console.log("Stripe product access error:", error.message);
    return NextResponse.json({ error: "Stripe product access error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { productId } = reqSchema.parse(await req.json());

    const { userId } = await auth();

    const dbUser = await User.findOne<UserType>({ userId });
    if (!dbUser) throw new Error("user is not authenticated");

    const subscriptionPlan = await getUserSubscriptionPlan();

    if (subscriptionPlan.isSubscribed && dbUser.stripeCustomerId) {
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: dbUser.stripeCustomerId,
        return_url: `${absolutePathUrl}/billing`,
      });

      return NextResponse.json({ url: stripeSession.url }, { status: 200 });
    }

    const product = await stripe.products.retrieve(productId);
    console.log({ product });

    const customer = await stripe.customers.create({
      name: dbUser.name ?? "",
      email: dbUser.email,
      metadata: {
        _id: dbUser._id!.toString(),
        tier: product.name,
      },
    });

    if (product.default_price) {
      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        line_items: [
          {
            price: product.default_price as string,
            quantity: 1,
          },
        ],
        mode: "subscription",
        payment_method_types: ["card", "link"],
        currency: "usd",
        success_url: `${absolutePathUrl}/billing`,
        cancel_url: `${absolutePathUrl}/billing`,
      });
      return NextResponse.json({ url: session.url }, { status: 200 });
    }

    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  } catch (error) {
    if (error instanceof Error)
      console.log("Stripe checkout session error:", error.message);
    return NextResponse.json({ error: "Stripe checkout session error" }, { status: 500 });
  }
}
