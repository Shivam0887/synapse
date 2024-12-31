"use server";

import ConnectToDB from "@/lib/connectToDB";
import {
  ActionValue,
  ConnectionTypes,
  CustomNodeType,
  TriggerValue,
  TActionResponse,
} from "@/lib/types";
import { absolutePathUrl } from "@/lib/utils";
import { Discord } from "@/models/discord.model";
import { GoogleDrive } from "@/models/google-drive.model";
import { Notion } from "@/models/notion.model";
import { Slack } from "@/models/slack.model";
import { User, UserType } from "@/models/user.model";
import { auth } from "@clerk/nextjs/server";
import axios from "axios";

type SaveActionProps = {
  user: string | undefined;
  message: string;
  mode: "custom" | "default";
  trigger: TriggerValue;
  nodeId: string;
  workflowId: string;
  nodeType: Exclude<ConnectionTypes, "Notion" | "Google Drive">;
};

type GetTriggerResponse = {
  trigger: TriggerValue;
  channelName: string;
  channelId: string;
  action?: {
    mode?: "default" | "custom" | null | undefined;
    user?: string | null | undefined;
    message?: string | null | undefined;
    trigger: ActionValue;
    isSaved: boolean;
  } | null | undefined;
  nodeType: Exclude<ConnectionTypes, "Google Drive">;
};

type NotionSaveActionProps = {
  nodeId: string;
  trigger: ActionValue;
  databaseId?: string;
  pageId?: string;
  properties: Record<string, unknown>;
  workflowId: string;
};

type AddConnectionProps = {
  sourceId: string;
  targetId: string;
  sourceNodeType: CustomNodeType;
  targetNodeType: CustomNodeType;
  type: "add" | "remove";
};

// Notion is not a valid trigger, however, we do need other things like that are common in all the triggers.
export const getTrigger = async (
  nodeId: string,
  nodeType: Exclude<ConnectionTypes, "Google Drive">
): Promise<TActionResponse<GetTriggerResponse>> => {
  try {
    const Model =
      nodeType === "Discord" ? Discord : nodeType === "Notion" ? Notion : Slack;

    await ConnectToDB();
    const response = (
      await Model.findOne(
        { nodeId },
        {
          _id: 0,
          trigger: 1,
          "action.trigger": 1,
          "action.message": 1,
          "action.mode": 1,
          "action.isSaved": 1,
          "action.user": 1,
          channelName: 1,
          workspaceName: 1,
          channelId: 1,
          databaseId: 1,
          pageId: 1,
          properties: 1,
        }
      )
    )?._doc;

    if (!response) {
      return {
        success: false,
        error: "No trigger found",
      };
    }

    const channelId =
      nodeType === "Notion"
        ? response.pageId
          ? response.pageId
          : response.databaseId
          ? response.databaseId
          : ""
        : response.channelId;


    const data = {
      trigger: nodeType === "Notion" ? "0" : response.trigger,
      channelName: nodeType === "Notion" ? response.workspaceName : response.channelName,
      action: {
        isSaved: response.isSaved,
        trigger: response.trigger,
        mode: response?.mode,
        message: response?.message,
        user: response?.user
      },
      channelId,
      nodeType,
    };

    return {
      success: true,
      data
    };
  } catch (error: any) {
    console.log("Get trigger error:", error?.message);
    return { success: false, error: "Get trigger error" };
  }
};

export const saveTrigger = async (
  workflowId: string,
  nodeId: string,
  trigger: TriggerValue,
  nodeType: Exclude<ConnectionTypes, "Notion" | "Google Drive">
): Promise<TActionResponse> => {
  const { userId } = await auth();

  try {
    await ConnectToDB();
    const user = await User.findOne<UserType>({
      userId,
    });

    if (!user) {
      return {
        success: false,
        error: "user not found",
      };
    }

    const Model = nodeType === "Discord" ? Discord : Slack;

    if (nodeType === "Discord" || nodeType === "Slack") {
      await Model.findOneAndUpdate(
        { workflowId, nodeId },
        {
          $set: {
            trigger,
          },
        }
      );
    }

    await axios.patch(`${absolutePathUrl}/api/logs?userId=${userId}`, {
      status: true,
      action: "Trigger Save",
      message: `${nodeType} Trigger saved successfully!`,
    });

    return {
      success: true,
      data: "trigger saved successfully!",
    };
  } catch (error: any) {
    console.log(error?.message);
    await axios.patch(`${absolutePathUrl}/api/logs?userId=${userId}`, {
      status: false,
      action: "Trigger Save",
      message: "Trigger not saved due to internal errors",
    });
    return { success: false, error: error?.message };
  }
};

export const saveAction = async ({
  message,
  nodeId,
  nodeType,
  trigger,
  mode,
  user,
  workflowId,
}: SaveActionProps): Promise<TActionResponse> => {
  const { userId } = await auth();

  try {
    await ConnectToDB();

    const Model = nodeType === "Discord" ? Discord : Slack;

    await Model.findOneAndUpdate(
      { workflowId, nodeId },
      {
        $set: {
          action: {
            message,
            mode,
            user,
            trigger,
            isSaved: true,
          },
        },
      }
    );

    await axios.patch(`${absolutePathUrl}/api/logs?userId=${userId}`, {
      status: true,
      action: "Action Save",
      message: `${nodeType} Action saved successfully!`,
    });

    return {
      success: true,
      data: "action saved successfully!",
    };
  } catch (error: any) {
    console.log(error?.message);
    return { success: false, error: error?.message };
  }
};

export const saveNotionAction = async ({
  nodeId,
  trigger,
  databaseId,
  pageId,
  properties,
  workflowId,
}: NotionSaveActionProps): Promise<TActionResponse> => {
  const { userId } = await auth();

  try {
    await ConnectToDB();

    if (nodeId && workflowId) {
      await Notion.findOneAndUpdate(
        { nodeId, workflowId },
        {
          $set: {
            databaseId,
            pageId,
            action: {
              trigger,
              isSaved: true,
            },
            properties,
          },
        }
      );

      await axios.patch(`${absolutePathUrl}/api/logs?userId=${userId}`, {
        status: true,
        action: "Action Save",
        message: `Notion Action saved successfully!`,
      });

      return {
        success: true,
        data: "action saved successfully!",
      };
    } else {
      await axios.patch(`${absolutePathUrl}/api/logs?userId=${userId}`, {
        status: false,
        action: "Action Save",
        message: "Action not saved due to internal errors",
      });

      return {
        success: false,
        error: "parameters are missing",
      };
    }
  } catch (error: any) {
    console.log(error?.message);
    return { success: false, error: error?.message };
  }
};

export const addConnection = async ({
  sourceId,
  targetId,
  sourceNodeType,
  targetNodeType,
  type,
}: AddConnectionProps): Promise<TActionResponse> => {
  const { userId } = await auth();

  if (sourceNodeType === "AI" || sourceNodeType === "None")
    return {
      success: false,
      error: "Invalid source node type",
    };

  try {
    await ConnectToDB();
    const SourceModel =
      sourceNodeType === "Discord"
        ? Discord
        : sourceNodeType === "Notion"
        ? Notion
        : sourceNodeType === "Slack"
        ? Slack
        : GoogleDrive;

    const { TargetModel, connectionId } =
      targetNodeType === "Discord"
        ? { TargetModel: Discord, connectionId: "connections.discordId" }
        : targetNodeType === "Notion"
        ? { TargetModel: Notion, connectionId: "connections.notionId" }
        : targetNodeType === "Slack"
        ? { TargetModel: Slack, connectionId: "connections.slackId" }
        : {
            TargetModel: GoogleDrive,
            connectionId: "connections.googleDriveId",
          };

    const target = await TargetModel.findOne({ nodeId: targetId }, { _id: 1 });

    if (!target) {
      await axios.patch(`${absolutePathUrl}/api/logs?userId=${userId}`, {
        status: false,
        action: "Edge Connection",
        message: `Node Id: ${targetId}, ${targetNodeType} account is not connected`,
      });

      throw new Error(
        `please connect to your ${targetNodeType} account to continue...`
      );
    }

    const source = await SourceModel.findOne({ nodeId: sourceId }, { _id: 1 });

    if (!source) {
      await axios.patch(`${absolutePathUrl}/api/logs?userId=${userId}`, {
        status: false,
        action: "Edge Connection",
        message: `Node Id: ${sourceId}, ${sourceNodeType} account is not connected`,
      });
      throw new Error(
        `please connect to your ${sourceNodeType} account to continue...`
      );
    }

    //Does the edge added or removed?
    if (type === "add") {
      await SourceModel.findOneAndUpdate({
        $push: {
          [connectionId]: target?._id,
        },
      });
    } else {
      await SourceModel.findOneAndUpdate({
        $pull: {
          [connectionId]: target?._id,
        },
      });
    }

    return {
      success: true,
      data: type === "add" ? "Edge added" : "Edge removed",
    };
  } catch (error: any) {
    console.log(error?.message);
    return { success: false, error: error?.message };
  }
};
