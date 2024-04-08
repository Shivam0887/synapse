"use server";

import ConnectToDB from "@/lib/connectToDB";
import { User } from "@/models/user-model";
import { Workflows } from "@/models/workflows-model";
import { currentUser } from "@clerk/nextjs";

export const onCreateNodesEdges = async ({
  edges,
  flowId,
  flowPath,
  nodes,
}: {
  flowId: string;
  nodes: string;
  edges: string;
  flowPath: string;
}) => {
  const user = await currentUser();
  try {
    ConnectToDB();
    const dbUser = await User.findOne({ userId: user?.id });

    await Workflows.findOneAndUpdate(
      { _id: flowId, userId: dbUser?._id },
      {
        $set: {
          edges,
          nodes,
          flowPath,
        },
      }
    );

    return "Workflow updated successfully!";
  } catch (error: any) {
    console.log(error?.message);
    return "Failed to updated the workflow.";
  }
};

export const onFlowPublish = async ({
  flowId,
  publish,
}: {
  flowId: string;
  publish: boolean;
}) => {
  const user = await currentUser();
  try {
    ConnectToDB();
    const dbUser = await User.findOne({ userId: user?.id });

    await Workflows.findOneAndUpdate(
      { _id: flowId, userId: dbUser?._id },
      {
        $set: {
          publish,
        },
      }
    );

    return "Workflow published successfully!";
  } catch (error: any) {
    console.log(error?.message);
    return "Failed to publish the workflow.";
  }
};
