"use server";

import axios from "axios";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import {
  ConnectionTypes,
  CustomNodeType,
  TActionResponse,
} from "@/lib/types";
import ConnectToDB from "@/lib/connectToDB";
import { absolutePathUrl, typedEntries } from "@/lib/utils";

import { User, UserType } from "@/models/user.model";
import { Slack, SlackType } from "@/models/slack.model";
import { GoogleDrive } from "@/models/google-drive.model";
import { Notion, NotionType } from "@/models/notion.model";
import { Discord, DiscordType } from "@/models/discord.model";
import { Workflow, WorkflowType } from "@/models/workflow.model";

type TriggerConnectionNodes = {
  connections: {
    slackId: Pick<SlackType, "action" | "nodeType" | "nodeId">[];
    notionId: Pick<NotionType, "action" | "nodeType" | "nodeId">[];
    discordId: Pick<DiscordType, "action" | "nodeType" | "nodeId">[];
  }
};

const FREE_CREDITS = {
  create: 5,
  publish: 3,
};

const PRO_CREDITS = {
  create: 50,
  publish: 25,
};

export const createWorkflow = async ({
  name,
  description,
}: {
  name: string;
  description: string;
}): Promise<TActionResponse> => {
  const { userId } = await auth();

  try {
    await ConnectToDB();
    const user = await User.findOne<
      Pick<UserType, "_id" | "tier" | "workflowId">
    >({ userId }, { tier: 1, workflowId: 1 });

    if (!user) {
      throw new Error("user is not authenticated");
    }

    const plan = user.tier;
    const workflowLimit = {
      Free: FREE_CREDITS.create,
      Pro: PRO_CREDITS.create,
    };

    const isLimit =
      plan === "Premium"
        ? false
        : workflowLimit[plan] === user.workflowId.length;

    if (isLimit) {
      await axios.patch(`${absolutePathUrl}/api/logs?userId=${userId}`, {
        status: false,
        action: "Workflow create",
        message:
          plan === "Free"
            ? "Limit reached! Please upgrade to Pro/Premium Plan"
            : "Limit reached! Please upgrade to Premium Plan",
      });

      return {
        success: false,
        error:
          plan === "Free"
            ? "Limit reached! Please upgrade to Pro/Premium Plan"
            : "Limit reached! Please upgrade to Premium Plan",
      };
    }

    const workflow = await Workflow.create({
      userId: user?._id,
      name,
      description,
    });

    await User.findOneAndUpdate(
      { userId },
      {
        $push: {
          workflowId: workflow?._id,
        },
      }
    );

    await axios.patch(`${absolutePathUrl}/api/logs?userId=${userId}`, {
      status: true,
      action: "Workflow create",
      message: `Workflow Id: ${workflow?._id}, Workflow created successfully!`,
    });

    revalidatePath("/workflows");

    return {
      success: true,
      data: workflow?._id.toString(),
    };
  } catch (error: any) {
    console.log("Workflow create error:", error?.message);
    await axios.patch(`${absolutePathUrl}/api/logs?userId=${userId}`, {
      status: false,
      action: "Workflow create",
      message: `Failed to create the ${name} workflow.`,
    });

    return { success: false, error: "Failed to create workflow." };
  }
};

export const saveWorkflow = async ({
  edges,
  workflowId,
  nodes,
}: {
  workflowId: string;
  nodes?: string;
  edges?: string;
}): Promise<TActionResponse> => {
  const { userId } = await auth();
  try {
    await ConnectToDB();
    const dbUser = await User.findOne<Pick<UserType, "tier" | "_id">>(
      { userId },
      { tier: 1 }
    );

    if (dbUser && dbUser.tier === "Premium") {
      const workflow = await Workflow.findById<
        Pick<WorkflowType, "nodes" | "edges" | "_id">
      >(workflowId, { nodes: 1, edges: 1 });

      if (workflow) {
        await Workflow.findByIdAndUpdate(workflow._id, {
          $set: {
            nodes: nodes ? nodes : workflow.nodes,
            edges: edges ? edges : workflow.edges,
          },
        });
      }
    } else {
      await Workflow.findOneAndUpdate(
        { _id: workflowId, userId: dbUser?._id },
        {
          $set: {
            edges,
            nodes,
          },
        }
      );
    }

    await axios.patch(`${absolutePathUrl}/api/logs?userId=${userId}`, {
      status: true,
      action: "Workflow save",
      message: `Workflow Id: ${workflowId}, Workflow updated successfully!`,
    });

    return {
      success: true,
      data: "Workflow updated successfully!",
    };
  } catch (error: any) {
    console.log("Error on workflow save:", error?.message);
    await axios.patch(`${absolutePathUrl}/api/logs?userId=${userId}`, {
      status: false,
      action: "Workflow save",
      message: `"Failed to update the workflow with Id: ${workflowId}`,
    });

    return {
      success: false,
      error: "Failed to update the workflow.",
    };
  }
};

export const getNodesEdges = async ({
  workflowId,
}: {
  workflowId: string;
}): Promise<TActionResponse<{ nodes: string; edges: string }>> => {
  try {
    await ConnectToDB();
    const workflow = await Workflow.findOne<WorkflowType>({
      _id: workflowId,
    });

    if (workflow) {
      return {
        success: true,
        data: {
          nodes: workflow.nodes,
          edges: workflow.edges,
        },
      };
    }

    return { success: false, error: "workflow not found." };
  } catch (error: any) {
    console.log("Error while getting workflow nodes/edges", error?.message);
    return {
      success: false,
      error: "Failed to access the workflow.",
    };
  }
};

export const publishWorkflow = async ({
  workflowId,
}: {
  workflowId: string;
}): Promise<TActionResponse> => {
  const { userId } = await auth();
  try {
    await ConnectToDB();
    const dbUser = await User.findOne<Pick<UserType, "_id" | "tier" | "workflowPublishCount">>(
      { userId },
      { _id: 1, tier: 1, workflowPublishCount: 1 }
    );

    if (!dbUser)
      return {
        success: false,
        error: "user is not authenticated",
      };

    const plan = dbUser.tier;
    const publishLimit = {
      Free: FREE_CREDITS.publish,
      Pro: PRO_CREDITS.publish,
    };

    const isLimit =
      plan === "Premium" || dbUser.workflowPublishCount
        ? false
        : publishLimit[plan] === dbUser.workflowPublishCount;

    if (isLimit) {
      await axios.patch(`${absolutePathUrl}/api/logs?userId=${userId}`, {
        status: false,
        action: "Workflow publish",
        message:
          plan === "Free"
            ? "Limit reached! Please upgrade to Pro/Premium Plan"
            : "Limit reached! Please upgrade to Premium Plan",
      });

      return {
        success: false,
        error:
          plan === "Free"
            ? "Limit reached! Please upgrade to Pro/Premium Plan"
            : "Limit reached! Please upgrade to Premium Plan",
      };
    }

    const workflow = await Workflow.findById<
      Pick<WorkflowType, "parentTrigger" | "parentId">
    >(workflowId, {
      parentTrigger: 1,
      parentId: 1,
    });

    if (!workflow)
      return {
        success: false,
        error: "Workflow not found",
      };

    if (workflow.parentTrigger === "None") {
      return {
        success: false,
        error: "Current trigger is not set to a valid trigger.",
      };
    }

    const triggerModel =
      workflow.parentTrigger === "Discord"
        ? Discord
        : workflow.parentTrigger === "Slack"
        ? Slack
        : GoogleDrive;

    const triggerNode = await triggerModel
      .findOne<TriggerConnectionNodes>({ nodeId: workflow.parentId }, { connections: 1 })
      .populate({
        path: "connections.discordId",
        model: Discord,
        select: "action nodeType nodeId",
      })
      .populate({
        path: "connections.slackId",
        model: Slack,
        select: "action nodeType nodeId",
      })
      .populate({
        path: "connections.notionId",
        model: Notion,
        select: "action nodeType nodeId",
      });

    if (!triggerNode) {
      return {
        success: false,
        error: `No trigger node found with id ${workflow.parentId}`,
      };
    }

    typedEntries(triggerNode.connections).forEach(([_, item]) => {
      const node = item.find(({ action }) => !action?.isSaved);
      if (node) {
        return {
          success: false,
          error: `please set the action for ${node.nodeType} node with id ${node.nodeId}`,
        };
      }
    });

    await Workflow.findByIdAndUpdate(workflowId, {
      $set: {
        publish: true,
      },
    });

    await axios.post(`${absolutePathUrl}/api/automate`, {
      workflowId,
      nodeId: workflow.parentId,
      userId,
    });

    await axios.patch(`${absolutePathUrl}/api/logs?userId=${userId}`, {
      status: true,
      action: "Workflow publish",
      message: `Workflow Id: ${workflowId}, Workflow published successfully!`,
    });

    await User.findOneAndUpdate({ userId } , {
      $inc: {
        workflowPublishCount: 1
      }
    });

    return {
      success: true,
      data: "Workflow published successfully",
    };
  } catch (error: any) {
    console.log("Workflow publish error:", error?.message);

    await Workflow.findByIdAndUpdate(workflowId, {
      $set: {
        publish: false,
      },
    });

    await axios.patch(`${absolutePathUrl}/api/logs?userId=${userId}`, {
      status: false,
      action: "Workflow publish",
      message: `Failed to publish the workflow with Id: ${workflowId}`,
    });

    return {
      success: false,
      error: "Failed to publish the workflow.",
    };
  }
};

export const unpublishWorkflow = async ({
  workflowId,
}: {
  workflowId: string;
}): Promise<TActionResponse> => {
  const { userId } = await auth();
  try {
    await ConnectToDB();
    const dbUser = await User.findOne<Pick<UserType, "_id">>(
      { userId },
      { _id: 1 }
    );

    if (!dbUser)
      return {
        success: false,
        error: "user is not authenticated",
      };

    const workflow = await Workflow.findById<Pick<WorkflowType, "parentId" | "parentTrigger" >>(workflowId, { parentId: 1, parentTrigger: 1, _id: 0  });
    if(workflow && workflow.parentTrigger === "Google Drive") {
      await axios.post(`${absolutePathUrl}/api/drive/watch`, {
        workflowId,
        userId,
        nodeId: workflow.parentId,
      });
    }

    await Workflow.findByIdAndUpdate(workflowId, {
      $set: {
        publish: false,
      },
    });

    await User.findOneAndUpdate({ userId } , {
      $inc: {
        workflowPublishCount: -1
      }
    });

    await axios.patch(`${absolutePathUrl}/api/logs?userId=${userId}`, {
      status: true,
      action: "Workflow publish",
      message: `Workflow Id: ${workflowId}, Workflow unpublished successfully!`,
    });

    return {
      success: true,
      data: "Workflow unpublished successfully",
    };
  } catch (error: any) {
    console.log("Workflow publish error:", error?.message);
    await axios.patch(`${absolutePathUrl}/api/logs?userId=${userId}`, {
      status: false,
      action: "Workflow publish",
      message: `Failed to unpublish the workflow with Id: ${workflowId}`,
    });

    return {
      success: false,
      error: "Failed to unpublish the workflow.",
    };
  }
};

export const getWorkflowById = async (flowId: string) => {
  const { userId } = await auth();
  if (flowId) {
    try {
      await ConnectToDB();

      const dbUser = await User.findOne({ userId });

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
      console.log("Error while getting workflow by Id", error?.message);
    }
  }

  return false;
};

export const getConnectionStatus = async (
  workflowId: string,
  nodeId: string,
  nodeType: CustomNodeType
): Promise<TActionResponse<boolean>> => {
  try {
    await ConnectToDB();

    const Model =
      nodeType === "Discord"
        ? Discord
        : nodeType === "Notion"
        ? Notion
        : nodeType === "Slack"
        ? Slack
        : GoogleDrive;

    const response = await Model.findOne(
      { workflowId, nodeId },
      { _id: 0, accessToken: 1 }
    );

    const isConnected = !!response?.accessToken;

    return { success: true, data: isConnected };
  } catch (error: any) {
    console.log("Error while getting node data", error?.message);
    return { success: false, error: error?.message };
  }
};

export const updateNodeId = async (
  workflowId: string,
  nodeId: string,
  nodeType: CustomNodeType
): Promise<TActionResponse> => {
  try {
    if (workflowId && nodeId) {
      await ConnectToDB();
      await Workflow.findByIdAndUpdate(workflowId, {
        $set: {
          selectedNodeId: nodeId,
          selectedNodeType: nodeType,
        },
      });

      return {
        success: true,
        data: `${nodeType === "None" ? "No node" : nodeType} is selected`,
      };
    }

    return {
      success: false,
      error: "please provide required parameters",
    };
  } catch (error: any) {
    console.log("Error while updating node id", error?.message);
    return { success: false, error: error?.message };
  }
};

export const deleteNode = async (
  workflowId: string,
  nodeId: string,
  nodeType: CustomNodeType
): Promise<TActionResponse<{ message: string; nodeId: string }>> => {
  const { userId } = await auth();

  try {
    await ConnectToDB();

    const { Model, idType } =
      nodeType === "Discord"
        ? { Model: Discord, idType: "discordId" }
        : nodeType === "Notion"
        ? { Model: Notion, idType: "notionId" }
        : nodeType === "Slack"
        ? { Model: Slack, idType: "slackId" }
        : { Model: GoogleDrive, idType: "googleDriveId" };

    const deletedNode = await Model.findOneAndDelete(
      {
        nodeId,
      },
      { new: true, projection: { _id: 1 } }
    );

    if (deletedNode) {
      await Workflow.findByIdAndUpdate(workflowId, {
        $pull: {
          [idType]: deletedNode._id,
        },
      });
    }

    await axios.patch(`${absolutePathUrl}/api/logs?userId=${userId}`, {
      status: true,
      action: "Workflow node delete",
      message: `Workflow Id: ${workflowId}, ${nodeType} node deleted successfully!`,
    });

    return {
      success: true,
      data: { message: `${nodeType} node deleted successfully!`, nodeId },
    };
  } catch (error: any) {
    console.log("Node deletion error:", error?.message);

    await axios.patch(`${absolutePathUrl}/api/logs?userId=${userId}`, {
      status: false,
      action: "Workflow node delete",
      message: `Workflow Id: ${workflowId}, ${nodeType} node not able to delete due to internal errors`,
    });

    return { success: false, error: error?.message };
  }
};

export const getCurrentTrigger = async (
  workflowId: string
): Promise<
  TActionResponse<{
    type: Exclude<ConnectionTypes, "Notion"> | "None";
    id: string;
    publish: boolean;
  }>
> => {
  try {
    await ConnectToDB();
    const workflow = await Workflow.findById<WorkflowType>(workflowId, {
      parentTrigger: 1,
      parentId: 1,
      publish: 1,
    });

    if (!workflow) {
      return {
        success: false,
        error: "workflow not found",
      };
    }

    return {
      success: true,
      data: {
        type: workflow.parentTrigger,
        id: workflow.parentId,
        publish: workflow.publish,
      },
    };
  } catch (error: any) {
    console.log(error?.message);
    return {
      success: false,
      error: "Trigger access error",
    };
  }
};

export const changeTrigger = async (
  workflowId: string,
  nodeId: string,
  nodeType: Exclude<ConnectionTypes, "Notion"> | "None",
  id?: string
): Promise<
  TActionResponse<{
    type: Exclude<ConnectionTypes, "Notion"> | "None";
    id: string;
  }>
> => {
  const { userId } = await auth();
  try {
    await ConnectToDB();

    // If the deleted node itself is the trigger node
    if (id) {
      const workflow = await Workflow.findByIdAndUpdate<WorkflowType>(
        workflowId,
        {
          parentTrigger: 1,
          parentId: 1,
        }
      );

      if (workflow?.parentId === id && workflow?.parentTrigger === nodeType) {
        await Workflow.findByIdAndUpdate<WorkflowType>(workflowId, {
          $set: {
            parentTrigger: nodeType,
            parentId: "",
          },
        });
      }

      return { success: true, data: { type: "None", id: "" } };
    }

    await Workflow.findByIdAndUpdate<WorkflowType>(workflowId, {
      $set: {
        parentTrigger: nodeType,
        parentId: nodeType === "None" ? "" : nodeId,
      },
    });

    await axios.patch(`${absolutePathUrl}/api/logs?userId=${userId}`, {
      status: true,
      action: "Workflow Trigger change",
      message: `Workflow Id: ${workflowId}, trigger changed to ${nodeType} successfully!`,
    });

    return {
      success: true,
      data: {
        type: nodeType,
        id: nodeType === "None" ? "" : nodeId,
      },
    };
  } catch (error: any) {
    console.log("change trigger error:", error?.message);
    return { success: false, error: "change trigger error" };
  }
};

export const getWorkflows = async (): Promise<
  TActionResponse<Pick<WorkflowType, "name" | "description" | "_id">[]>
> => {
  try {
    await ConnectToDB();
    const { userId } = await auth();
    const user = await User.findOne({ userId }, { _id: 1 });

    const workflows = await Workflow.find({ userId: user?._id }, { name: 1, description: 1 });

    if (!workflows) {
      return {
        success: false,
        error: "Workflows not found",
      };
    }

    const result = workflows.map(({ _doc }) => ({ ..._doc, _id: _doc.toString(), }));

    return { success: true, data: result as (Pick<WorkflowType, "name" | "description" | "_id">)[] };
  } catch (error: any) {
    console.log("Error while getting workflows:", error?.message);
    return { success: false, error: error?.message };
  }
};

export const deleteWorkflow = async (
  workflowId: string
): Promise<TActionResponse> => {
  const { userId } = await auth();
  try {
    await ConnectToDB();
    const workflow = await Workflow.findById(workflowId, { _id: 1 });

    if (!workflow) {
      await axios.patch(`${absolutePathUrl}/api/logs?userId=${userId}`, {
        status: false,
        action: "Workflow delete",
        message: `Workflow Id: ${workflowId}, Workflow not found.`,
      });
      return { success: false, error: "Workflow not found." };
    }

    await axios.patch(`${absolutePathUrl}/api/logs?userId=${userId}`, {
      status: true,
      action: "Workflow delete",
      message: `Workflow Id: ${workflowId}, Workflow deleted successfully!`,
    });

    await User.findOneAndUpdate(
      { userId },
      {
        $pull: {
          workflowId: workflow?._id,
        },
      }
    );

    await Discord.deleteMany({ workflowId });
    await Slack.deleteMany({ workflowId });
    await Notion.deleteMany({ workflowId });
    await GoogleDrive.deleteMany({ workflowId });

    await Workflow.findByIdAndDelete(workflowId);

    revalidatePath("/workflows");
    return {
      success: true,
      data: "Workflow deleted successfully!",
    };
  } catch (error: any) {
    console.log("Workflow deletion error:", error?.message);
    await axios.patch(`${absolutePathUrl}/api/logs?userId=${userId}`, {
      status: false,
      action: "Workflow delete",
      message: `Workflow Id: ${workflowId}, not able to delete due to some internal errors.`,
    });
    return { success: false, error: "Interval server error" };
  }
};
