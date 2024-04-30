"use server";

import ConnectToDB from "@/lib/connectToDB";
import { Connection, ConnectionType } from "@/models/connection-model";
import { Notion } from "@/models/notion-model";
import { User } from "@/models/user-model";
import { currentUser } from "@clerk/nextjs/server";
import { Types } from "mongoose";
import { Client } from "@notionhq/client";
import { Workflow } from "@/models/workflow-model";

type Props = {
  accessToken: string;
  workspaceId: string;
  workspaceIcon: string;
  workspaceName: string;
  databaseId: string;
  userId: string;
  workflowId: string;
};

export const onNotionConnect = async ({
  accessToken,
  databaseId,
  userId,
  workspaceIcon,
  workspaceId,
  workspaceName,
  workflowId,
}: Props) => {
  if (accessToken) {
    ConnectToDB();
    const user = await User.findOne({ userId });

    const notion = await Notion.findOne<{ _id: Types.ObjectId } | null>({
      accessToken,
      userId: user?._id,
    });

    if (!notion) {
      const workflow = await Workflow.findById(workflowId);
      const notionInstance = await Notion.create({
        userId: user?._id,
        accessToken,
        workspaceId: workspaceId,
        workspaceIcon: workspaceIcon,
        workspaceName: workspaceName,
        databaseId,
        Wokflow: [workflow],
      });

      await Workflow.findByIdAndUpdate(workflowId, {
        $push: {
          Notion: notionInstance,
        },
      });

      const newConnection: ConnectionType | undefined = await Connection.create(
        {
          userId: user?._id,
          type: "Notion",
          notionId: notionInstance?._id,
        }
      );

      await Notion.findByIdAndUpdate(notionInstance?._id, {
        $push: {
          connections: newConnection,
        },
      });

      await User.findByIdAndUpdate(user?._id, {
        $push: {
          connections: newConnection,
          Notion: notionInstance,
        },
      });
    }
  }
};

export const getNotionMetaData = async (workflowId: string, nodeId: string) => {
  ConnectToDB();
  const user = await currentUser();
  const dbUser = await User.findOne<{ _id: Types.ObjectId }>({
    userId: user?.id,
  });

  if (dbUser) {
    const notionInstance = await Notion.findOne(
      { userId: dbUser._id, workflowId, nodeId },
      {
        _id: 0,
        connections: 0,
      }
    );

    if (notionInstance) return JSON.stringify(notionInstance);
  }
};

export const getNotionDatabase = async (
  databaseId: string,
  accessToken: string
) => {
  const notion = new Client({
    auth: accessToken,
  });

  const response = await notion.databases.retrieve({ database_id: databaseId });
  return response;
};

export const onCreateNewPageInDatabase = async (
  databaseId: string,
  accessToken: string,
  content: string
) => {
  const notion = new Client({
    auth: accessToken,
  });

  const response = await notion.pages.create({
    parent: {
      type: "database_id",
      database_id: databaseId,
    },
    properties: {
      name: [
        {
          text: {
            content: content,
          },
        },
      ],
    },
  });
  if (response) {
    return response;
  }
};
