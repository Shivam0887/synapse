import React from "react";
import { ConnectionTypes, CustomNodeTypes, NodeType, Option } from "./types";
import { ConnectionProviderProps } from "@/providers/connections-provider";
import { getDiscordMetaData } from "@/app/(main)/(routes)/connections/_actions/discord-action";
import { getNotionMetaData } from "@/app/(main)/(routes)/connections/_actions/notion-action";
import { getSlackMetaData } from "@/app/(main)/(routes)/connections/_actions/slack-action";

export const onDrapStart = (
  e: React.DragEvent<HTMLDivElement>,
  nodeType: CustomNodeTypes
) => {
  e.dataTransfer.setData("application/reactflow", nodeType);
  e.dataTransfer.effectAllowed = "move";
};

export const onContentChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  nodeConnection: ConnectionProviderProps,
  nodeType: ConnectionTypes
) => {
  const { setDiscordNode, setNotionNode, setSlackNode } = nodeConnection;
  if (nodeType === "Slack") {
    setSlackNode((prev) => ({
      ...prev,
      content: e.target.value,
    }));
  } else if (nodeType === "Discord") {
    setDiscordNode((prev) => ({
      ...prev,
      content: e.target.value,
    }));
  } else if (nodeType === "Notion") {
    setNotionNode((prev) => ({
      ...prev,
      content: e.target.value,
    }));
  }
};

export const onConnections = async (
  nodeConnection: ConnectionProviderProps,
  nodeId: string,
  workflowId: string,
  nodeType: ConnectionTypes
) => {
  if (nodeType === "Discord") {
    const res = await getDiscordMetaData(workflowId, nodeId);
    if (res) {
      const connection = JSON.parse(res);
      nodeConnection.setDiscordNode({
        webhookURL: connection.webhookUrl,
        content: "",
        webhookName: connection.webhookName,
        guildName: connection.guildName,
        channelName: connection.channelName,
      });
    }
  } else if (nodeType === "Notion") {
    const res = await getNotionMetaData(workflowId, nodeId);
    if (res) {
      const connection = JSON.parse(res);
      nodeConnection.setNotionNode({
        ...nodeConnection.notionNode,
        accessToken: connection.accessToken,
        databaseId: connection.databaseId,
        workspaceName: connection.workspaceName,
      });
    }
  } else if (nodeType === "Slack") {
    const res = await getSlackMetaData(workflowId, nodeId);
    if (res) {
      const connection = JSON.parse(res);
      nodeConnection.setSlackNode({
        appId: connection.appId,
        authedUserId: connection.authenticated_userId,
        authedUserToken: connection.authenticated_userToken,
        botUserId: connection.botUserId,
        teamId: connection.teamId,
        teamName: connection.teamName,
        content: "",
        webhookURL: connection.webhookUrl,
      });
    }
  }
};

// export const fetchBotSlackChannels = async (
//   token: string,
//   setSlackChannels: React.Dispatch<React.SetStateAction<Option[]>>
// ) => {
//   const channels = await listBotChannels(token);
//   if (channels) {
//     setSlackChannels(channels);
//   }
// };

export const getPropertyItem = (type: { [x: string]: string }) => {
  if (type["title"]) {
    return {
      title: [
        {
          text: {
            content: type["title"],
          },
        },
      ],
    };
  } else if (type["multi_select"]) {
    return {
      multi_select: [{ name: type["multi_select"] }],
    };
  } else if (type["number"]) {
    return {
      number: parseInt(type["number"]),
    };
  } else if (type["status"]) {
    return {
      name: parseInt(type["number"]),
    };
  } else if (type["date"]) {
    return {
      date: {
        start: type["date"],
        end: null,
      },
    };
  } else if (type["checkbox"]) {
    return {
      checkbox: JSON.parse(type["checkbox"]),
    };
  } else if (type["email"]) {
    return {
      email: type["email"],
    };
  } else if (type["rich_text"]) {
    return {
      rich_text: [
        {
          text: {
            content: type["rich_text"],
          },
        },
      ],
    };
  } else if (type["people"]) {
    return {
      people: [
        {
          object: "user",
          id: type["people"],
        },
      ],
    };
  } else if (type["phone_number"]) {
    return {
      phone_number: parseInt(type["phone_number"]),
    };
  } else if (type["select"]) {
    return {
      name: parseInt(type["number"]),
    };
  } else {
    return {
      url: type["url"],
    };
  }
};
