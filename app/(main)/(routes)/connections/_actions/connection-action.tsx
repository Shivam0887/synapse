"use server";

import ConnectToDB from "@/lib/connectToDB";
import { ConnectionTypes } from "@/lib/types";
import { Discord } from "@/models/discord-model";
import { Notion } from "@/models/notion-model";
import { Slack } from "@/models/slack-model";
import { User, UserType } from "@/models/user-model";
import { currentUser } from "@clerk/nextjs/server";

type SaveActionProps = {
  user: string | undefined;
  message: string;
  type: "custom" | "default";
  trigger: "0" | "1";
  nodeId: string;
  workflowId: string;
  nodeType: ConnectionTypes;
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
            trigger: response.trigger,
            channelName:
              nodeType === "Notion"
                ? response.workspaceName
                : response.channelName,
            action: response.action,
            nodeType: response.nodeType,
            databaseId: response.databaseId,
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
  try {
    ConnectToDB();
    const user = await currentUser();
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

      return JSON.stringify({
        success: true,
        data: "trigger saved successfully!",
      });
    }

    return JSON.stringify({
      success: false,
      message: "parameters are missing",
    });
  } catch (error: any) {
    console.log(error?.message);
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
  try {
    ConnectToDB();
    const loggedUser = await currentUser();
    const dbUser = await User.findOne<UserType>({
      userId: loggedUser?.id,
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

      return JSON.stringify({
        success: true,
        message: "action saved successfully!",
      });
    }

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
  try {
    ConnectToDB();
    const loggedUser = await currentUser();
    const dbUser = await User.findOne<UserType>({
      userId: loggedUser?.id,
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

      return JSON.stringify({
        success: true,
        data: "action saved successfully!",
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
