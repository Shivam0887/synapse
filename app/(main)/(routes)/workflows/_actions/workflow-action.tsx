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
    const listener = await Workflow.findOne<{
      googleDriveWatchTrigger: { isListening: boolean };
    } | null>(
      { _id: workflowId, userId: dbUser?._id },
      {
        _id: 0,
        "googleDriveWatchTrigger.isListening": 1,
      }
    );

    return JSON.stringify(!!listener?.googleDriveWatchTrigger.isListening);
  } catch (error: any) {
    console.log(error?.message);
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

export const updateNodeId = async (
  workflowId: string,
  nodeId: string,
  nodeType: CustomNodeTypes
) => {
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
            selectedNodeType: nodeType,
          },
        }
      );

      return JSON.stringify({
        success: true,
        message: `${nodeType === "None" ? "No node" : nodeType} is selected`,
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

export const deleteNode = async (
  workflowId: string,
  nodeId: string,
  nodeType: CustomNodeTypes
) => {
  try {
    if (workflowId && nodeId && nodeType) {
      ConnectToDB();
      const user = await currentUser();
      const dbUser = await User.findOne({ userId: user?.id });

      if (nodeType === "Google Drive") {
        await Workflow.findByIdAndUpdate(workflowId, {
          $set: {
            changes: "true",
            files: "false",
            fileId: "",
            folderId: "",
            channelId: "",
            isListening: false,
            supportedAllDrives: "true",
            includeRemoved: "false",
            restrictToMyDrive: "false",
          },
        });
      } else {
        const Model =
          nodeType === "Discord"
            ? Discord
            : nodeType === "Notion"
            ? Notion
            : Slack;

        const key =
          nodeType === "Discord"
            ? "discordId"
            : nodeType === "Slack"
            ? "slackId"
            : "notionId";

        const deletedNode = await Model.findOneAndDelete(
          {
            userId: dbUser?._id,
            workflowId,
            nodeId,
          },
          { new: true, projection: { _id: 1 } }
        );

        if (deletedNode) {
          await Workflow.findByIdAndUpdate(workflowId, {
            $pull: {
              [key]: deletedNode?._id,
            },
          });
        }

        return JSON.stringify({
          success: true,
          data: `${nodeType} node deleted successfully!`,
        });
      }
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
