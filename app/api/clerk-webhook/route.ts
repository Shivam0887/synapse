import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { EmailAddress } from "@clerk/nextjs/server";
import ConnectToDB from "@/lib/connectToDB";
import { User, UserType } from "@/models/user-model";

const userSchema = z.object({
  id: z.string(),
  first_name: z.string().nullable(),
  image_url: z.string(),
  email_addresses: z.array(
    z.object({ email_address: z.string(), id: z.string() })
  ),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email_addresses, first_name, id, image_url } = userSchema.parse(
      body?.data
    );

    ConnectToDB();
    const isUserExists = await User.findOne<UserType>({ userId: id });
    if (!isUserExists) {
      await User.create({
        userId: id,
        name: first_name ?? "",
        imageUrl: image_url ?? "",
        email: email_addresses[0].email_address,
      });
    }

    return new NextResponse("User created successfully!");
  } catch (error: any) {
    console.log("Error in creating user:", error?.message);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
