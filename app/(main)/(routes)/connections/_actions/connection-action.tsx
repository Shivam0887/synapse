"use server";

import ConnectToDB from "@/lib/connectToDB";
import { ConnectionTypes, CustomNodeTypes } from "@/lib/types";
import { absolutePathUrl } from "@/lib/utils";
import { Discord } from "@/models/discord-model";
import { Notion } from "@/models/notion-model";
import { Slack } from "@/models/slack-model";
import { User, UserType } from "@/models/user-model";
import { Workflow } from "@/models/workflow-model";
import { currentUser, clerkClient } from "@clerk/nextjs/server";
import axios from "axios";

type SaveActionProps = {
  user: string | undefined;
  message: string;
  type: "custom" | "default";
  trigger: "0" | "1";
  nodeId: string;
  workflowId: string;
  nodeType: ConnectionTypes;
};

const getDriveInfo = async () => {
  const user = await currentUser();

  if (user) {
    const clerkResponse = await axios.get(
      `https://api.clerk.com/v1/users/${user.id}/oauth_access_tokens/oauth_google`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY!}`,
          "Content-Type": "application/json",
        },
      }
    );
    const accessToken = clerkResponse.data[0].token;

    return !!accessToken;
  }

  return false;
};

export const getTrigger = async (
  workflowId: string,
  nodeId: string,
  nodeType: ConnectionTypes
) => {
  try {
    ConnectToDB();
    const user = await currentUser();
    const dbUser = await User.findOne<UserType>({
      userId: user?.id,
    });

    if (workflowId && nodeId) {
      const Model =
        nodeType === "Discord"
          ? Discord
          : nodeType === "Notion"
          ? Notion
          : Slack;

      const response = await Model.findOne(
        { userId: dbUser?._id, workflowId, nodeId },
        {
          _id: 0,
          trigger: 1,
          action: 1,
          channelName: 1,
          nodeType: 1,
          workspaceName: 1,
          databaseId: 1,
        }
      );

      if (response)
        return JSON.stringify({
          success: true,
          data: {
            trigger: response.trigger as string,
            channelName:
              nodeType === "Notion"
                ? response.workspaceName
                : response.channelName,
            channelId: nodeType === "Notion" ? "" : response.channelId,
            action: response.action,
            nodeType: response.nodeType,
          },
        });
    } else {
      return JSON.stringify({
        success: false,
        message: "parameters are missing",
      });
    }
  } catch (error: any) {
    console.log(error?.message);
    return JSON.stringify({ success: false, error: error?.message });
  }
};

export const onSaveTrigger = async (
  workflowId: string,
  nodeId: string,
  trigger: string,
  nodeType: ConnectionTypes
) => {
  const user = await currentUser();

  try {
    ConnectToDB();
    const dbUser = await User.findOne<UserType>({
      userId: user?.id,
    });

    if (dbUser && workflowId && nodeId) {
      const Model = nodeType === "Discord" ? Discord : Slack;

      if (nodeType === "Discord" || nodeType === "Slack") {
        await Model.findOneAndUpdate(
          { userId: dbUser?._id, workflowId, nodeId },
          {
            $set: {
              trigger,
            },
          }
        );
      }

      await axios.patch(
        `https://synapse-zxh8.onrender.com/api/logs?userId=${user?.id}`,
        {
          status: true,
          action: "Trigger Save",
          message: `${nodeType} Trigger saved successfully!`,
        }
      );

      return JSON.stringify({
        success: true,
        data: "trigger saved successfully!",
      });
    }

    await axios.patch(
      `https://synapse-zxh8.onrender.com/api/logs?userId=${user?.id}`,
      {
        status: false,
        action: "Trigger Save",
        message: "Trigger not saved due to internal errors",
      }
    );

    return JSON.stringify({
      success: false,
      message: "parameters are missing",
    });
  } catch (error: any) {
    console.log(error?.message);
    await axios.patch(
      `https://synapse-zxh8.onrender.com/api/logs?userId=${user?.id}`,
      {
        status: false,
        action: "Trigger Save",
        message: "Trigger not saved due to internal errors",
      }
    );
    return JSON.stringify({ success: false, error: error?.message });
  }
};

export const onSaveAction = async ({
  message,
  nodeId,
  nodeType,
  trigger,
  type: mode,
  user,
  workflowId,
}: SaveActionProps) => {
  const _user = await currentUser();

  try {
    ConnectToDB();
    const dbUser = await User.findOne<UserType>({
      userId: _user?.id,
    });

    if (dbUser && workflowId && nodeId) {
      const Model =
        nodeType === "Discord"
          ? Discord
          : nodeType === "Notion"
          ? Notion
          : Slack;

      await Model.findOneAndUpdate(
        { userId: dbUser?._id, workflowId, nodeId },
        {
          $set: {
            action: {
              message,
              mode,
              user,
              trigger,
            },
          },
        }
      );

      await axios.patch(
        `https://synapse-zxh8.onrender.com/api/logs?userId=${_user?.id}`,
        {
          status: true,
          action: "Action Save",
          message: `${nodeType} Action saved successfully!`,
        }
      );

      return JSON.stringify({
        success: true,
        message: "action saved successfully!",
      });
    }

    await axios.patch(
      `https://synapse-zxh8.onrender.com/api/logs?userId=${_user?.id}`,
      {
        status: false,
        action: "Action Save",
        message: "Action not saved due to internal errors",
      }
    );

    return JSON.stringify({
      success: false,
      message: "parameters are missing",
    });
  } catch (error: any) {
    console.log(error?.message);
    return JSON.stringify({ success: false, error: error?.message });
  }
};

export const onSaveNotionAction = async ({
  nodeId,
  trigger,
  databaseId,
  pageId,
  properties,
  workflowId,
}: {
  nodeId: string;
  trigger: string;
  databaseId?: string;
  pageId?: string;
  properties: any;
  workflowId: string;
}) => {
  const user = await currentUser();

  try {
    ConnectToDB();
    const dbUser = await User.findOne<UserType>({
      userId: user?.id,
    });

    if (nodeId && workflowId && trigger) {
      await Notion.findOneAndUpdate(
        { userId: dbUser?._id, nodeId, workflowId },
        {
          $set: {
            databaseId,
            pageId,
            trigger,
            properties,
          },
        }
      );

      await axios.patch(
        `https://synapse-zxh8.onrender.com/api/logs?userId=${user?.id}`,
        {
          status: true,
          action: "Action Save",
          message: `Notion Action saved successfully!`,
        }
      );

      return JSON.stringify({
        success: true,
        data: "action saved successfully!",
      });
    } else {
      await axios.patch(
        `https://synapse-zxh8.onrender.com/api/logs?userId=${user?.id}`,
        {
          status: false,
          action: "Action Save",
          message: "Action not saved due to internal errors",
        }
      );

      return JSON.stringify({
        success: false,
        message: "parameters are missing",
      });
    }
  } catch (error: any) {
    console.log(error?.message);
    return JSON.stringify({ success: false, error: error?.message });
  }
};

export const addConnection = async ({
  sourceId,
  targetId,
  sourceNodeType,
  targetNodeType,
  workflowId,
  type,
}: {
  sourceId: string;
  targetId: string;
  sourceNodeType: CustomNodeTypes;
  targetNodeType: CustomNodeTypes;
  workflowId: string;
  type: "add" | "remove";
}) => {
  const user = await currentUser();

  try {
    if (sourceId && targetId && sourceNodeType && targetNodeType) {
      if (sourceNodeType !== "AI" && sourceNodeType !== "None") {
        ConnectToDB();
        const SourceModel =
          sourceNodeType === "Discord"
            ? Discord
            : sourceNodeType === "Notion"
            ? Notion
            : sourceNodeType === "Slack"
            ? Slack
            : Workflow;

        const Target =
          targetNodeType === "Discord"
            ? { Model: Discord, type: "connections.discordId" }
            : targetNodeType === "Notion"
            ? { Model: Notion, type: "connections.notionId" }
            : { Model: Slack, type: "connections.slackId" };

        const target = await Target.Model.findOne(
          { workflowId, nodeId: targetId },
          { _id: 1 }
        );

        if (!target) {
          await axios.patch(
            `https://synapse-zxh8.onrender.com/api/logs?userId=${user?.id}`,
            {
              status: false,
              action: "Edge Connection",
              message: `Node Id: ${targetId}, ${targetNodeType} account is not connected`,
            }
          );
          throw new Error(
            `please connect to your ${targetNodeType} account to continue...`
          );
        }

        //What is the type of source node?
        if (sourceNodeType === "Google Drive") {
          const isGoogleDriveConnected = await getDriveInfo();
          if (!isGoogleDriveConnected) {
            await axios.patch(
              `https://synapse-zxh8.onrender.com/api/logs?userId=${user?.id}`,
              {
                status: false,
                action: "Edge Connection",
                message: `Node Id: ${sourceId}, Google Drive account is not connected`,
              }
            );

            throw new Error(
              `please connect to your Google Drive account. Give access to Google Drive while login.`
            );
          }

          const field = `googleDriveWatchTrigger.${Target.type}`;

          //Does the edge added or removed?
          if (type === "add") {
            await Workflow.findByIdAndUpdate(workflowId, {
              $push: {
                [field]: target?._id,
              },
            });
          } else {
            await Workflow.findByIdAndUpdate(workflowId, {
              $pull: {
                [field]: target?._id,
              },
            });
          }
        } else {
          const source = await SourceModel.findOne(
            { workflowId, nodeId: sourceId },
            { _id: 1 }
          );

          if (!source) {
            await axios.patch(
              `https://synapse-zxh8.onrender.com/api/logs?userId=${user?.id}`,
              {
                status: false,
                action: "Edge Connection",
                message: `Node Id: ${sourceId}, ${sourceNodeType} account is not connected`,
              }
            );
            throw new Error(
              `please connect to your ${sourceNodeType} account to continue...`
            );
          }

          //Does the edge added or removed?
          if (type === "add") {
            await SourceModel.findOneAndUpdate({
              $push: {
                [Target.type]: target?._id,
              },
            });
          } else {
            await SourceModel.findOneAndUpdate({
              $pull: {
                [Target.type]: target?._id,
              },
            });
          }
        }
      }
    } else {
      return JSON.stringify({
        success: false,
        message: "failed to add a connection edge",
      });
    }
  } catch (error: any) {
    console.log(error?.message);
    return JSON.stringify({ success: false, error: error?.message });
  }
};
