import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import ConnectToDB from "@/lib/connectToDB";
import { Workflow } from "@/models/workflow-model";
import { z } from "zod";

const reqSchema = z.object({
  folderId: z.string(),
  supportedAllDrives: z.enum(["true", "false"]),
  restrictToMyDrive: z.enum(["true", "false"]),
  includeRemoved: z.enum(["true", "false"]),
  pageSize: z.number().default(1),
  fileId: z.string(),
  changes: z.enum(["true", "false"]),
  files: z.enum(["true", "false"]),
  isListening: z.boolean(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ message: "User not authenticated" });

    const workflowId = new URL(req.nextUrl).searchParams.get("workflowId")!;

    const {
      changes,
      fileId,
      files,
      folderId,
      includeRemoved,
      pageSize,
      restrictToMyDrive,
      supportedAllDrives,
      isListening,
    } = reqSchema.parse(await req.json());

    ConnectToDB();

    await Workflow.findByIdAndUpdate(workflowId, {
      $set: {
        googleDriveWatchTrigger: {
          changes,
          files,
          fileId,
          folderId,
          isListening,
          supportedAllDrives,
          pageSize,
          includeRemoved,
          restrictToMyDrive,
        },
      },
    });

    const message = !isListening
      ? "trigger settings reset successfully!"
      : "trigger settings save successfully!";
    return new NextResponse(message, {
      status: 201,
    });
  } catch (error: any) {
    console.log(error?.message);
    return new NextResponse("Oops! something went wrong, try again", {
      status: 500,
    });
  }
}
