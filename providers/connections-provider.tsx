"use client";
import { createContext, useContext, useState } from "react";

export type SlackNodeType = {
  appId: string;
  authedUserId: string;
  authedUserToken: string;
  botUserId: string;
  teamId: string;
  teamName: string;
  content: string;
  webhookURL: string;
};

export type NotionNodeType = {
  accessToken: string;
  databaseId: string;
  workspaceName: string;
  content: any;
};

export type DiscordNodeType = {
  webhookURL: string;
  content: string;
  webhookName: string;
  guildName: string;
  channelName: string;
};

export type WorkflowTemplateType = {
  discord?: string;
  notion?: string;
  slack?: string;
};

export type ConnectionProviderProps = {
  googleNode: {};
  slackNode: SlackNodeType;
  notionNode: NotionNodeType;
  discordNode: DiscordNodeType;

  setGoogleNode: React.Dispatch<React.SetStateAction<any>>;
  setSlackNode: React.Dispatch<React.SetStateAction<SlackNodeType>>;
  setNotionNode: React.Dispatch<React.SetStateAction<NotionNodeType>>;
  setDiscordNode: React.Dispatch<React.SetStateAction<DiscordNodeType>>;
};

type ConnectionWithChildProps = {
  children: React.ReactNode;
};

const InitialValues: ConnectionProviderProps = {
  discordNode: {
    webhookURL: "",
    content: "",
    webhookName: "",
    guildName: "",
    channelName: "",
  },
  googleNode: {},
  notionNode: {
    accessToken: "",
    databaseId: "",
    workspaceName: "",
    content: {},
  },
  slackNode: {
    appId: "",
    authedUserId: "",
    authedUserToken: "",
    botUserId: "",
    teamId: "",
    teamName: "",
    content: "",
    webhookURL: "",
  },
  setGoogleNode: () => undefined,
  setDiscordNode: () => undefined,
  setNotionNode: () => undefined,
  setSlackNode: () => undefined,
};

const ConnectionsContext = createContext(InitialValues);
const { Provider } = ConnectionsContext;

export const ConnectionsProvider = ({ children }: ConnectionWithChildProps) => {
  const [discordNode, setDiscordNode] = useState(InitialValues.discordNode);
  const [googleNode, setGoogleNode] = useState(InitialValues.googleNode);
  const [notionNode, setNotionNode] = useState(InitialValues.notionNode);
  const [slackNode, setSlackNode] = useState(InitialValues.slackNode);

  const values = {
    discordNode,
    setDiscordNode,
    googleNode,
    setGoogleNode,
    notionNode,
    setNotionNode,
    slackNode,
    setSlackNode,
  };

  return <Provider value={values}>{children}</Provider>;
};

export const useNodeConnections = () => {
  const nodeConnection = useContext(ConnectionsContext);
  if (!nodeConnection) {
    throw new Error(
      "connection context can only be used within connection provider"
    );
  }
  return { nodeConnection };
};
