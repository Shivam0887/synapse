"use server";

import ConnectToDB from "@/lib/connectToDB";
import { User, UserType } from "@/models/user-model";
import { Workflows, WorkflowsType } from "@/models/workflows-model";
import { currentUser } from "@clerk/nextjs";
import { revalidatePath } from "next/cache";

export const createWorkflow = async ({
  name,
  description,
}: {
  name: string;
  description: string;
}) => {
  const user = await currentUser();

  try {
    ConnectToDB();
    const dbUser = await User.findOne<UserType>({ userId: user?.id });

    const workflow: WorkflowsType = await Workflows.create({
      userId: dbUser?._id,
      name,
      description,
    });

    await User.findByIdAndUpdate(dbUser?._id, {
      $push: {
        workflows: workflow._id,
      },
    });

    revalidatePath("/workflows");

    return { success: true, workflowId: workflow?._id.toString() };
  } catch (error: any) {
    console.log(error?.message);
    return { success: false, message: "Failed to create workflow." };
  }
};
