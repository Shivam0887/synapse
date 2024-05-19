"use server";

import ConnectToDB from "@/lib/connectToDB";
import { ConnectionTypes, CustomNodeTypes, Option } from "@/lib/types";
import { Discord, DiscordType } from "@/models/discord-model";
import { Notion, NotionType } from "@/models/notion-model";
import { Slack, SlackType } from "@/models/slack-model";
import { User, UserType } from "@/models/user-model";
import { Workflow, WorkflowType } from "@/models/workflow-model";
import { currentUser } from "@clerk/nextjs/server";
import axios from "axios";
import { Types } from "mongoose";
import { revalidatePath } from "next/cache";

type WorkflowWithNodes = Omit<
  WorkflowType,
  "discordId" | "slackId" | "notionId"
> & {
  discordId: DiscordType[];
  notionId: NotionType[];
  slackId: SlackType[];
};

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
  try {
    const user = await currentUser();
    ConnectToDB();
    const dbUser = await User.findOne({ userId: user?.id });

    const workflow = await Workflow.findOne<WorkflowType>({
      _id: flowId,
      userId: dbUser?._id,
    });

    if (workflow) {
      return JSON.stringify({
        status: true,
        data: {
          nodes: JSON.parse(workflow.nodes),
          edges: JSON.parse(workflow.edges),
        },
      });
    }

    return JSON.stringify({ status: false, error: "workflow not found." });
  } catch (error: any) {
    console.log(error?.message);
    return JSON.stringify({
      status: false,
      error: "Failed to access the workflow.",
    });
  }
};

export const onPublishWorkflow = async ({
  workflowId,
  publish,
}: {
  workflowId: string;
  publish: boolean;
}) => {
  try {
    const user = await currentUser();
    ConnectToDB();
    const dbUser = await User.findOne({ userId: user?.id });

    const workflow = await Workflow.findById<WorkflowWithNodes>(workflowId, {
      discordId: 1,
      slackId: 1,
      notionId: 1,
      googleDriveWatchTrigger: 1,
      nodeMetadata: 1,
      parentTrigger: 1,
    })
      .populate({
        path: "discordId",
        model: Discord,
        select: "_id trigger action nodeId",
      })
      .populate({
        path: "slackId",
        model: Slack,
        select: "_id trigger action nodeId",
      })
      .populate({
        path: "notionId",
        model: Notion,
        select: "_id trigger nodeId",
      });

    if (workflow) {
      const nodeMetadata = JSON.parse(workflow.nodeMetadata!) as {
        nodeId: string;
        nodeType: ConnectionTypes;
      }[];

      if (workflow.parentTrigger === "None") {
        return JSON.stringify({
          success: false,
          message: "Current trigger is not set to a valid trigger.",
        });
      }

      if (
        workflow.parentTrigger === "Google Drive" &&
        !workflow.googleDriveWatchTrigger?.isListening &&
        nodeMetadata.some(({ nodeType }) => nodeType === "Google Drive")
      ) {
        return JSON.stringify({
          success: false,
          message: "please set the trigger for Google Drive node",
        });
      }

      const discordInstance = workflow.discordId.find(
        ({ action }) => !action?.trigger || !action.trigger.length
      );

      if (discordInstance)
        return JSON.stringify({
          success: false,
          message: `please set the action for Discord node with id ${discordInstance.nodeId}`,
        });

      const slackInstance = workflow.slackId.find(
        ({ action }) => !action?.trigger || !action.trigger.length
      );
      if (slackInstance)
        return JSON.stringify({
          success: false,
          message: `please set the action for Slack node with id ${slackInstance.nodeId}`,
        });

      const notionInstance = workflow.notionId.find(
        ({ trigger }) => !trigger || !trigger.length
      );
      if (notionInstance)
        return JSON.stringify({
          sucees: false,
          message: `please set the action for Notion node with id ${notionInstance.nodeId}`,
        });

      await axios.post("http://localhost:3000/api/automate", {
        publish,
        workflowId,
        _id: dbUser?._id.toString(),
        clerkUserId: user?.id,
      });

      await Workflow.findOneAndUpdate(
        { _id: workflowId, userId: dbUser?._id },
        {
          $set: {
            publish,
          },
        }
      );

      revalidatePath(`/workflows/editor/${workflowId}`);
    }

    return JSON.stringify({
      success: publish,
      message: publish
        ? "Workflow published successfully!"
        : "Workflow unpublished successfully!",
    });
  } catch (error: any) {
    console.log(error?.message);
    return JSON.stringify({
      success: false,
      message: "Failed to publish the workflow.",
    });
  }
};

export const getGoogleListener = async (workflowId: string) => {
  const user = await currentUser();

  try {
    ConnectToDB();
    const dbUser = await User.findOne({ userId: user?.id });
    const listener = await Workflow.findOne<
      Pick<WorkflowType, "googleDriveWatchTrigger">
    >(
      { _id: workflowId, userId: dbUser?._id },
      {
        _id: 0,
        googleDriveWatchTrigger: 1,
      }
    );

    if (listener && listener.googleDriveWatchTrigger) {
      const {
        channelId,
        connections,
        expiresAt,
        resourceId,
        resourceUri,
        files,
        ...rest
      } = listener.googleDriveWatchTrigger;
      return JSON.stringify(rest);
    }
  } catch (error: any) {
    console.log(error?.message);
  }
};

export const getWorkflowById = async (flowId: string) => {
  if (flowId) {
    try {
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
    } catch (error: any) {
      console.log(error?.message);
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
            googleDriveWatchTrigger: {
              isListening: false,
              changes: "true",
              files: "false",
              folderId: "",
              supportedAllDrives: "true",
              includeRemoved: "false",
              restrictToMyDrive: "false",
              fileId: "",
              channelId: "",
            },
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

export const getCurrentTrigger = async (workflowId: string) => {
  try {
    ConnectToDB();
    const workflow = await Workflow.findById<WorkflowType>(workflowId, {
      parentTrigger: 1,
      parentId: 1,
      publish: 1,
    });
    if (workflow) {
      return JSON.stringify({
        type: workflow.parentTrigger,
        id: workflow.parentId,
        publish: workflow.publish,
      });
    }
    return JSON.stringify({ type: "Google Drive", id: "" });
  } catch (error: any) {
    console.log(error?.message);
  }
};

export const changeTrigger = async (
  workflowId: string,
  nodeId: string,
  nodeType: ConnectionTypes | "None"
) => {
  try {
    ConnectToDB();
    if (nodeType === "Google Drive" || nodeType === "None") {
      const googleDriveTrigger = await Workflow.findById(workflowId, {
        googleDriveWatchTrigger: 1,
      });
      if (
        googleDriveTrigger?.googleDriveWatchTrigger?.isListening ||
        nodeType === "None"
      ) {
        await Workflow.findByIdAndUpdate<WorkflowType>(workflowId, {
          $set: {
            parentTrigger: nodeType,
            parentId: "",
          },
        });
        return JSON.stringify({ type: nodeType, id: "" });
      }
    } else if (nodeType === "Discord" || nodeType === "Slack") {
      const Model = nodeType === "Discord" ? Discord : Slack;
      const collection = await Model.findOne<{ _id: Types.ObjectId }>(
        { workflowId, nodeId },
        { _id: 1 }
      );

      if (collection) {
        await Workflow.findByIdAndUpdate<WorkflowType>(workflowId, {
          $set: {
            parentTrigger: nodeType,
            parentId: collection?._id,
          },
        });

        return JSON.stringify({
          type: nodeType,
          id: nodeId,
        });
      }
    }

    return JSON.stringify({ type: "None", id: "" });
  } catch (error: any) {
    console.log(error?.message);
  }
};

export const getWorkflows = async () => {
  try {
    ConnectToDB();
    const user = await currentUser();
    const dbUser = await User.findOne({ userId: user?.id });

    const workflows = await Workflow.find<WorkflowType>(
      { userId: dbUser?._id },
      { name: 1, description: 1 }
    );

    return JSON.stringify(workflows);
  } catch (error: any) {
    console.log(error?.message);
    return JSON.stringify({ success: false, error: error?.message });
  }
};
