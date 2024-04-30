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
  content: string;
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
  isLoading: boolean;
  slackNode: SlackNodeType;
  notionNode: NotionNodeType;
  discordNode: DiscordNodeType;
  workflowTemplate: WorkflowTemplateType;

  setGoogleNode: React.Dispatch<React.SetStateAction<any>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setSlackNode: React.Dispatch<React.SetStateAction<SlackNodeType>>;
  setNotionNode: React.Dispatch<React.SetStateAction<NotionNodeType>>;
  setDiscordNode: React.Dispatch<React.SetStateAction<DiscordNodeType>>;
  setWorkFlowTemplate: React.Dispatch<
    React.SetStateAction<WorkflowTemplateType>
  >;
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
    content: "",
  },
  workflowTemplate: {
    discord: "",
    notion: "",
    slack: "",
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
  isLoading: false,
  setGoogleNode: () => undefined,
  setDiscordNode: () => undefined,
  setNotionNode: () => undefined,
  setSlackNode: () => undefined,
  setIsLoading: () => undefined,
  setWorkFlowTemplate: () => undefined,
};

const ConnectionsContext = createContext(InitialValues);
const { Provider } = ConnectionsContext;

export const ConnectionsProvider = ({ children }: ConnectionWithChildProps) => {
  const [discordNode, setDiscordNode] = useState(InitialValues.discordNode);
  const [googleNode, setGoogleNode] = useState(InitialValues.googleNode);
  const [notionNode, setNotionNode] = useState(InitialValues.notionNode);
  const [slackNode, setSlackNode] = useState(InitialValues.slackNode);
  const [isLoading, setIsLoading] = useState(InitialValues.isLoading);
  const [workflowTemplate, setWorkFlowTemplate] = useState(
    InitialValues.workflowTemplate
  );

  const values = {
    discordNode,
    setDiscordNode,
    googleNode,
    setGoogleNode,
    notionNode,
    setNotionNode,
    slackNode,
    setSlackNode,
    isLoading,
    setIsLoading,
    workflowTemplate,
    setWorkFlowTemplate,
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
