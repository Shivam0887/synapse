"use server";

import ConnectToDB from "@/lib/connectToDB";
import { Notion, NotionType } from "@/models/notion.model";
import { User } from "@/models/user.model";
import { auth } from "@clerk/nextjs/server";
import { Types } from "mongoose";
import { Client } from "@notionhq/client";
import { NotionDatabaseType, TActionResponse } from "@/lib/types";
import { DatabaseObjectResponse } from "@notionhq/client/build/src/api-endpoints";

type CreatePage = {
  workflowId: string;
  nodeId: string;
  databaseId?: string | null;
  pageId?: string | null;
  properties?: Record<string, unknown>;
  isTesting: boolean;
};

export const getNotionMetaData = async (
  workflowId: string,
  nodeId: string
): Promise<TActionResponse<Omit<NotionType, "_id" | "connections">>> => {
  try {
    await ConnectToDB();
    const { userId } = await auth();
    const user = await User.findOne<{ _id: Types.ObjectId }>({
      userId,
    });

    if (!user)
      return {
        success: false,
        error: "user not found",
      };

    const notionInstance = await Notion.findOne<
      Omit<NotionType, "_id" | "connections">
    >(
      { workflowId, nodeId },
      {
        _id: 0,
        connections: 0,
      }
    );

    if (notionInstance) return { success: true, data: notionInstance };
    else return { success: false, error: "no such notion node found" };
  } catch (error: any) {
    console.log(error?.message);
    return { success: false, error: "no such notion node found" };
  }
};

export const getNotionDatabases = async (
  workflowId: string,
  nodeId: string
): Promise<TActionResponse<NotionDatabaseType[]>> => {
  const databases: NotionDatabaseType[] = [];

  try {
    await ConnectToDB();
    const { userId } = await auth();
    const user = await User.findOne<{ _id: Types.ObjectId }>({
      userId,
    });

    if (!user) {
      throw new Error("user is not authenticated");
    }

    const notionInstance = await Notion.findOne<NotionType>(
      { workflowId, nodeId },
      {
        _id: 0,
        accessToken: 1,
      }
    );

    if (!notionInstance)
      return { success: false, error: "no such notion node found" };

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

    return { success: true, data: databases };
  } catch (error: any) {
    console.log(error?.message);
    return { success: false, error: error?.message };
  }
};

const createPageOrDatabaseItem = async (
  accessToken: string,
  properties: any,
  databaseId?: string | null,
  pageId?: string | null
): Promise<TActionResponse> => {
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

    return { success: true, data: "created successfully" };
  } catch (error: any) {
    console.log(error?.message);
    return { success: false, error: "Error in createPageOrDatabaseItem" };
  }
};

export const createPage = async ({
  workflowId,
  nodeId,
  databaseId,
  pageId,
  properties,
  isTesting,
}: CreatePage): Promise<TActionResponse> => {
  try {
    await ConnectToDB();
    const notionInstance = await Notion.findOne<
      Pick<NotionType, "accessToken" | "databaseId" | "pageId" | "properties">
    >(
      { workflowId, nodeId },
      { _id: 0, accessToken: 1, databaseId: 1, pageId: 1, properties: 1 }
    );

    if (!notionInstance)
      return {
        success: false,
        error: `No Notion instance found with Id ${nodeId}`,
      };

    if (isTesting) {
      await createPageOrDatabaseItem(
        notionInstance.accessToken,
        properties,
        databaseId,
        pageId
      );
    } else {
      await createPageOrDatabaseItem(
        notionInstance.accessToken,
        notionInstance.properties,
        notionInstance.databaseId,
        notionInstance.pageId
      );
    }

    return { success: true, data: "message sent successfully!" };
  } catch (error: any) {
    console.log(error?.message);
    return { success: false, error: "not able sent message" };
  }
};
