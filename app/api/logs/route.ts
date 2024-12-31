import ConnectToDB from "@/lib/connectToDB";
import { Log } from "@/models/logs.model";
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

    await ConnectToDB();
    await Log.findOneAndUpdate(
      { userId },
      {
        $push: {
          logs: { action, message, status, createdAt: new Date() },
        },
      }
    );

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    if (error instanceof Error)
      console.log("Logging error:", error.message);
    return NextResponse.json({ error: "Logging error" }, { status: 500 });
  }
}
