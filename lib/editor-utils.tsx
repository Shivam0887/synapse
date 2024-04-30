import React from "react";
import { ConnectionTypes, CustomNodeTypes, NodeType, Option } from "./types";
import { ConnectionProviderProps } from "@/providers/connections-provider";
import { EditorState } from "@/providers/editor-provider";
import { getDiscordMetaData } from "@/app/(main)/(routes)/connections/_actions/discord-action";
import { getNotionMetaData } from "@/app/(main)/(routes)/connections/_actions/notion-action";
import {
  getSlackMetaData,
  listBotChannels,
} from "@/app/(main)/(routes)/connections/_actions/slack-action";

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

export const onAddTemplate = (
  nodeConnection: ConnectionProviderProps,
  nodeType: NodeType,
  template: string
) => {
  const { setDiscordNode, setSlackNode, setNotionNode } = nodeConnection;
  if (nodeType === "slackNode") {
    setSlackNode((prev) => ({
      ...prev,
      content: `${prev.content} ${template}`,
    }));
  } else if (nodeType === "discordNode") {
    setDiscordNode((prev) => ({
      ...prev,
      content: `${prev.content} ${template}`,
    }));
  } else if (nodeType === "notionNode") {
    setNotionNode((prev) => ({
      ...prev,
      content: `${prev.content} ${template}`,
    }));
  }
};

export const onConnections = async (
  nodeConnection: ConnectionProviderProps,
  editorState: EditorState,
  workflowId: string
) => {
  if (editorState.editor.selectedNode.data.title == "Discord") {
    const res = await getDiscordMetaData(
      workflowId,
      editorState.editor.selectedNode.id
    );
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
  } else if (editorState.editor.selectedNode.data.title == "Notion") {
    const res = await getNotionMetaData(
      workflowId,
      editorState.editor.selectedNode.id
    );
    if (res) {
      const connection = JSON.parse(res);
      nodeConnection.setNotionNode({
        ...nodeConnection.notionNode,
        accessToken: connection.accessToken,
        databaseId: connection.databaseId,
        workspaceName: connection.workspaceName,
      });
    }
  } else if (editorState.editor.selectedNode.data.title == "Slack") {
    const res = await getSlackMetaData(
      workflowId,
      editorState.editor.selectedNode.id
    );
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

export const fetchBotSlackChannels = async (
  token: string,
  setSlackChannels: React.Dispatch<React.SetStateAction<Option[]>>
) => {
  const channels = await listBotChannels(token);
  if (channels) {
    setSlackChannels(channels);
  }
};
