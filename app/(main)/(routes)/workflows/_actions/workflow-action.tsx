"use server";

import ConnectToDB from "@/lib/connectToDB";
import { ConnectionTypes, CustomNodeTypes, Option } from "@/lib/types";
import { Discord } from "@/models/discord-model";
import { Notion } from "@/models/notion-model";
import { Slack } from "@/models/slack-model";
import { User, UserType } from "@/models/user-model";
import { Workflow, WorkflowType } from "@/models/workflow-model";
import { currentUser } from "@clerk/nextjs/server";
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

    const workflow: WorkflowType = await Workflow.create({
      userId: dbUser?._id,
      name,
      description,
    });

    await User.findByIdAndUpdate(dbUser?._id, {
      $push: {
        workflowId: workflow?._id,
      },
    });

    revalidatePath("/workflows");

    return {
      success: true,
      workflowId: workflow?._id.toString(),
      message: "Workflow created successfully",
    };
  } catch (error: any) {
    console.log(error?.message);
    return { success: false, message: "Failed to create workflow." };
  }
};

export const onWorkflowSave = async ({
  edges,
  workflowId,
  nodeMetadata,
  nodes,
}: {
  workflowId: string;
  nodes: string;
  edges: string;
  nodeMetadata: string;
}) => {
  const user = await currentUser();
  try {
    ConnectToDB();
    const dbUser = await User.findOne({ userId: user?.id });

    await Workflow.findOneAndUpdate(
      { _id: workflowId, userId: dbUser?._id },
      {
        $set: {
          edges,
          nodes,
          nodeMetadata,
        },
      }
    );

    return "Workflow updated successfully!";
  } catch (error: any) {
    console.log(error?.message);
    return "Failed to updated the workflow.";
  }
};

export const onGetNodesEdges = async ({ flowId }: { flowId: string }) => {
  const user = await currentUser();
  try {
    ConnectToDB();
    const dbUser = await User.findOne({ userId: user?.id });

    const workflow = await Workflow.findOne({
      _id: flowId,
      userId: dbUser?._id,
    });

    return { status: true, data: JSON.stringify(workflow) };
  } catch (error: any) {
    console.log(error?.message);
    return { status: false, error: "Failed to access the workflow." };
  }
};

export const onPublishWorkflow = async ({
  workflowId,
  publish,
}: {
  workflowId: string;
  publish: boolean;
}) => {
  const user = await currentUser();
  try {
    ConnectToDB();
    const dbUser = await User.findOne({ userId: user?.id });

    await Workflow.findOneAndUpdate(
      { _id: workflowId, userId: dbUser?._id },
      {
        $set: {
          publish,
        },
      }
    );

    revalidatePath("/workflows");

    return publish
      ? "Workflow published successfully!"
      : "Workflow unpublished successfully!";
  } catch (error: any) {
    console.log(error?.message);
    return "Failed to publish the workflow.";
  }
};

export const getGoogleListener = async (workflowId: string) => {
  const user = await currentUser();

  try {
    ConnectToDB();
    const dbUser = await User.findOne({ userId: user?.id });
    const listener = await Workflow.findOne<{ isListening: boolean } | null>(
      { _id: workflowId, userId: dbUser?._id },
      {
        _id: 0,
        googleDriveWatchTrigger: 1,
      }
    );

    return JSON.stringify(listener);
  } catch (error: any) {
    console.log(error?.message);
  }
};

//  WIP
export const onCreateNodeTemplate = async ({
  content,
  type,
  workflowId,
  accessToken,
  channels,
  notionDbId,
  nodeId,
}: {
  content: string;
  type: ConnectionTypes;
  workflowId: string;
  channels?: Option[];
  accessToken?: string;
  notionDbId?: string;
  nodeId: string;
}) => {
  try {
    ConnectToDB();
    const user = await currentUser();
    const dbUser = await User.findOne<UserType>({ userId: user?.id });

    if (type === "Discord") {
      const response = await Discord.findOneAndUpdate(
        { userId: dbUser?._id, nodeId, workflowId },
        {
          $set: {
            template: content,
          },
        }
      );

      if (response) return "Discord template saved";
    } else if (type === "Slack") {
      const response = await Slack.findOneAndUpdate(
        { userId: dbUser?._id, nodeId, workflowId },
        {
          $set: {
            template: content,
          },
        }
      );

      // if (response) {
      //   const channelList = response.slackChannels as string[];

      //   if (channelList.length) {
      //     //remove duplicates before insert
      //     const NonDuplicated = channelList.filter(
      //       (channel) => channel !== channels![0].value
      //     );

      //     NonDuplicated.forEach(async (channel) => {
      //       await Workflow.findByIdAndUpdate(workflowId, {
      //         $push: {
      //           slackChannels: channel,
      //         },
      //       });
      //     });

      //     return "Slack template saved";
      //   }

      //   // channels?.forEach(async ({ value }) => {
      //   //   await Workflow.findByIdAndUpdate(workflowId, {
      //   //     $push: {
      //   //       slackChannels: value,
      //   //     },
      //   //   });
      //   // });
      // }

      if (response) return "Slack template saved";
    } else if (type === "Notion") {
      const response = await Notion.findByIdAndUpdate(
        { userId: dbUser?._id, nodeId, workflowId },
        {
          $set: {
            template: content,
          },
        }
      );

      if (response) return "Notion template saved";
    }
  } catch (error: any) {
    console.log(error?.message);
    return `Error while saving template, ${error?.message}`;
  }
};

export const getWorkflowById = async (flowId: string) => {
  if (flowId) {
    ConnectToDB();
    const user = await currentUser();

    const dbUser = await User.findOne({ userId: user?.id });

    if (dbUser) {
      const workflow = await Workflow.findOne(
        { _id: flowId, userId: dbUser?._id },
        { _id: 0, publish: 1 }
      );

      if (workflow) {
        return workflow.publish as boolean;
      }
    }
  }

  return false;
};

export const getWorkflowNodes = async (workflowId: string) => {
  try {
    if (workflowId) {
      ConnectToDB();
      const user = await currentUser();

      const dbUser = await User.findOne({ userId: user?.id });

      const workflow = await Workflow.findOne(
        { _id: workflowId, userId: dbUser?._id },
        {
          _id: 0,
          discordId: 1,
          notionId: 1,
          slackId: 1,
          googleDriveWatchTrigger: 1,
        }
      )
        .populate({
          path: "discordId",
          model: Discord,
        })
        .populate({
          path: "notionId",
          model: Notion,
        })
        .populate({
          path: "slackId",
          model: Slack,
        });

      return JSON.stringify({ success: true, workflow });
    }

    return JSON.stringify({ success: false, error: "workflowId is missing" });
  } catch (error: any) {
    console.log(error?.message);
    return JSON.stringify({ success: false, error: error?.message });
  }
};

export const getNodeData = async (
  workflowId: string,
  nodeId: string,
  nodeType: CustomNodeTypes
) => {
  try {
    if (workflowId && nodeId && nodeType) {
      ConnectToDB();
      const user = await currentUser();
      const dbUser = await User.findOne({ userId: user?.id });

      if (nodeType === "Google Drive")
        return JSON.stringify({ success: true, isConnected: true });

      const Model =
        nodeType === "Discord"
          ? Discord
          : nodeType === "Notion"
          ? Notion
          : Slack;

      const response = await Model.findOne(
        { userId: dbUser?._id, workflowId, nodeId },
        { _id: 0, accessToken: 1 }
      );
      const isConnected = !!response?.accessToken;

      return JSON.stringify({ success: true, isConnected });
    }

    return JSON.stringify({
      success: false,
      message: "please provide required parameters",
    });
  } catch (error: any) {
    console.log(error?.message);
    return JSON.stringify({ success: false, error: error?.message });
  }
};

export const updateNodeId = async (workflowId: string, nodeId: string) => {
  try {
    if (workflowId && nodeId) {
      ConnectToDB();
      const user = await currentUser();
      const dbUser = await User.findOne({ userId: user?.id });

      await Workflow.findOneAndUpdate(
        { userId: dbUser?._id, workflowId },
        {
          $set: {
            selectedNodeId: nodeId,
          },
        }
      );

      return JSON.stringify({
        success: true,
        message: "updated nodeId successfully!",
      });
    }

    return JSON.stringify({
      success: false,
      message: "please provide required parameters",
    });
  } catch (error: any) {
    console.log(error?.message);
    return JSON.stringify({ success: false, error: error?.message });
  }
};
