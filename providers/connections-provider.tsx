"use client";

import { createContext, useContext, useMemo, useState } from "react";

export type SlackNodeType = {
  channelName: string;
  teamName: string;
  content: string;
  webhookURL: string;
};

export type DiscordNodeType = {
  webhookURL: string;
  content: string;
  guildName: string;
  channelName: string;
};

export type ConnectionProviderProps = {
  slackNode: SlackNodeType;
  discordNode: DiscordNodeType;
  setSlackNode: React.Dispatch<React.SetStateAction<SlackNodeType>>;
  setDiscordNode: React.Dispatch<React.SetStateAction<DiscordNodeType>>;
};

type ConnectionWithChildProps = {
  children: React.ReactNode;
};

const InitialValues: ConnectionProviderProps = {
  discordNode: {
    webhookURL: "",
    content: "",
    guildName: "",
    channelName: "",
  },
  slackNode: {
    channelName: "",
    teamName: "",
    content: "",
    webhookURL: "",
  },
  setDiscordNode: () => undefined,
  setSlackNode: () => undefined,
};

const ConnectionsContext = createContext(InitialValues);
const { Provider } = ConnectionsContext;

export const ConnectionsProvider = ({ children }: ConnectionWithChildProps) => {
  const [discordNode, setDiscordNode] = useState(InitialValues.discordNode);
  const [slackNode, setSlackNode] = useState(InitialValues.slackNode);

  const values = useMemo(
    () => ({
      discordNode,
      setDiscordNode,
      slackNode,
      setSlackNode,
    }),
    [discordNode, slackNode]
  );

  return <Provider value={values}>{children}</Provider>;
};

export const useNodeConnections = () => {
  const nodeConnection = useContext(ConnectionsContext);
  if (!nodeConnection) {
    throw new Error(
      "connection context can only be used within connection provider"
    );
  }
  return nodeConnection;
};
