import { User } from "@/models/user-model";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const reqSchema = z.object({
  status: z.boolean(),
  action: z.string(),
  message: z.string(),
});

export async function PATCH(req: NextRequest) {
  try {
    const { action, message, status } = reqSchema.parse(await req.json());

    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) throw new Error("user is not authenticated");

    await User.findOneAndUpdate(
      { userId },
      {
        $push: {
          logs: { action, message, status, createdAt: new Date() },
        },
      }
    );

    return new NextResponse(null, { status: 200 });
  } catch (error: any) {
    console.log(error?.message);
    return new NextResponse(error?.message, { status: 500 });
  }
}
