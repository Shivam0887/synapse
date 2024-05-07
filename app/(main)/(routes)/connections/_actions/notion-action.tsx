"use server";

import ConnectToDB from "@/lib/connectToDB";
import { Notion, NotionType } from "@/models/notion-model";
import { User } from "@/models/user-model";
import { currentUser } from "@clerk/nextjs/server";
import { Types } from "mongoose";
import { Client } from "@notionhq/client";
import { NotionDatabaseType } from "@/lib/types";
import { DatabaseObjectResponse } from "@notionhq/client/build/src/api-endpoints";

export const getNotionMetaData = async (workflowId: string, nodeId: string) => {
  try {
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
  } catch (error: any) {
    console.log(error?.message);
  }
};

export const getNotionDatabases = async (
  workflowId: string,
  nodeId: string
) => {
  ConnectToDB();
  const user = await currentUser();
  const dbUser = await User.findOne<{ _id: Types.ObjectId }>({
    userId: user?.id,
  });

  if (!dbUser) {
    throw new Error("user is not authenticated");
  }

  const databases: NotionDatabaseType = [];

  try {
    if (workflowId && nodeId) {
      const notionInstance = await Notion.findOne<NotionType>(
        { userId: dbUser._id, workflowId, nodeId },
        {
          _id: 0,
          accessToken: 1,
        }
      );

      if (notionInstance) {
        const notion = new Client({
          auth: notionInstance.accessToken!,
        });

        const response = await notion.search({
          filter: {
            property: "object",
            value: "database",
          },
          sort: {
            direction: "ascending",
            timestamp: "last_edited_time",
          },
        });

        response.results.forEach((result) => {
          if (result.object === "database") {
            const database = result as DatabaseObjectResponse;
            const properties = Object.entries(result.properties).map(
              ([_, { name, type }]) => ({ name, type })
            );

            databases.push({
              id: database.id,
              name: database.title[0].plain_text,
              properties,
            });
          }
        });
      }
      return JSON.stringify({ success: true, data: databases });
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

const createPageOrDatabaseItem = async (
  accessToken: string,
  properties: any,
  databaseId?: string | null,
  pageId?: string | null
) => {
  try {
    const notion = new Client({
      auth: accessToken,
    });

    if (databaseId) {
      await notion.pages.create({
        parent: {
          type: "database_id",
          database_id: databaseId,
        },
        properties,
      });
    } else if (pageId) {
      await notion.pages.create({
        parent: {
          type: "page_id",
          page_id: pageId,
        },
        properties,
      });
    }
  } catch (error: any) {
    console.log(error?.message);
    console.log("Error in createPageOrDatabaseItem");
  }
};

export const onCreatePage = async ({
  workflowId,
  nodeId,
  databaseId,
  pageId,
  properties,
  isTesting,
}: {
  workflowId: string;
  nodeId: string;
  databaseId?: string;
  pageId?: string;
  properties: any;
  isTesting: boolean;
}) => {
  try {
    ConnectToDB();
    const notionInstance = await Notion.findOne<NotionType>(
      { workflowId, nodeId },
      { _id: 0, accessToken: 1, databaseId: 1, pageId: 1, properties: 1 }
    );
    if (notionInstance) {
      if (isTesting) {
        await createPageOrDatabaseItem(
          notionInstance.accessToken!,
          properties,
          databaseId,
          pageId
        );

        return JSON.stringify("message sent successfully!");
      } else {
        await createPageOrDatabaseItem(
          notionInstance.accessToken!,
          notionInstance.properties,
          notionInstance.databaseId,
          notionInstance.pageId
        );
      }
    }
  } catch (error: any) {
    console.log(error?.message);
  }
};
