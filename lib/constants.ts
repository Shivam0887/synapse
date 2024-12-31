import Logs from "@/components/icons/clipboard";
import Home from "@/components/icons/home";
import Payment from "@/components/icons/payment";
import Settings from "@/components/icons/settings";
import Workflows from "@/components/icons/workflows";
import {
  Connection,
  ConnectionTypes,
  CustomNodeType,
  TPlanDetails,
} from "./types";
import { CheckIcon, X } from "lucide-react";

export const LIMIT = 9;

export const PLANS: TPlanDetails = {
  Free: [
    {
      icon: CheckIcon,
      available: true,
      desc: "10 credits - 1 credit per automation task",
    },
    {
      icon: CheckIcon,
      available: true,
      desc: "Perform 10 automation tasks.",
    },
    {
      icon: CheckIcon,
      available: true,
      desc: "Create 5 workflows.",
    },
    {
      icon: CheckIcon,
      available: true,
      desc: "Publish 3 workflows.",
    },
    {
      icon: X,
      available: false,
      desc: "Automatically save workflows to prevent data loss.",
    },
    {
      icon: X,
      available: false,
      desc: "Use AI to create and optimize workflows.",
    },
  ],
  Pro: [
    {
      icon: CheckIcon,
      available: true,
      desc: "100 credits - 1 credit per automation task",
    },
    {
      icon: CheckIcon,
      available: true,
      desc: "Perform 100 automation tasks.",
    },
    {
      icon: CheckIcon,
      available: true,
      desc: "Create 50 workflows.",
    },
    {
      icon: CheckIcon,
      available: true,
      desc: "Publish 25 workflows.",
    },
    {
      icon: X,
      available: false,
      desc: "Automatically save workflows to prevent data loss.",
    },
    {
      icon: X,
      available: false,
      desc: "Use AI to create and optimize workflows.",
    },
  ],
  Premium: [
    {
      icon: CheckIcon,
      available: true,
      desc: "Unlimited credits",
    },
    {
      icon: CheckIcon,
      available: true,
      desc: "Perform unlimited automation tasks.",
    },
    {
      icon: CheckIcon,
      available: true,
      desc: "Create unlimited workflows.",
    },
    {
      icon: CheckIcon,
      available: true,
      desc: "Publish unlimited workflows.",
    },
    {
      icon: CheckIcon,
      available: true,
      desc: "Automatically save workflows to prevent data loss.",
    },
    {
      icon: CheckIcon,
      available: true,
      desc: "Use AI to create and optimize workflows.",
    },
  ],
};

export const menuOptions = [
  { name: "Dashboard", Component: Home, href: "/dashboard" },
  { name: "Workflows", Component: Workflows, href: "/workflows" },
  { name: "Settings", Component: Settings, href: "/settings" },
  { name: "Billing", Component: Payment, href: "/billing" },
  { name: "Logs", Component: Logs, href: "/logs" },
];

export const CustomNodeDefaultValues: Record<
  Exclude<CustomNodeType, "None">,
  { description: string }
> = {
  AI: {
    description: "Use the power of AI to create nodes",
  },
  Slack: { description: "Post/trigger messages into your slack workspace." },
  "Google Drive": {
    description:
      "Connect with Google drive to trigger changes in the files and folders.",
  },
  Notion: { description: "Create new database item and page in notion." },
  Discord: {
    description: "Post/trigger messages into your discord server.",
  },
};

export const CONNECTIONS: Record<ConnectionTypes, Connection> = {
  "Google Drive": {
    title: "Google Drive",
    description: "Connect your google drive to listen to files/folder changes",
    image: "/googleDrive.png",
  },
  Discord: {
    title: "Discord",
    description: "Connect your discord to send notification and messages",
    image: "/discord.png",
    message: {
      "0": "A new message is posted in the text channel.",
      "1": "A User or Role is mentioned.",
      "2": "A new Reaction is added to a Message.",
      "3": "A new user has join the Discord Server.",
    },
  },
  Notion: {
    title: "Notion",
    description: "Create entries in your notion dashboard and automate tasks.",
    image: "/notion.png",
  },
  Slack: {
    title: "Slack",
    description:
      "Use slack to send notifications to team members through your own custom bot.",
    image: "/slack.png",
    message: {
      "0": "A new message is posted to a #channel.",
      "1": "A new file is uploaded into the public #channel.",
      "2": "A new Reaction is added to a Message.",
      "3": "A new #channel is created.",
      "4": "A new user joined a #public-channel or #private-channel.",
    },
  },
};

export const mapper = {
  true: true,
  false: false,
};

export const SCOPES: Record<ConnectionTypes, string[]> = {
  "Google Drive": ["https://www.googleapis.com/auth/drive.metadata.readonly"],
  Discord: ["identify", "email", "guilds", "bot", "webhook.incoming"],
  Notion: [],
  Slack: ["chat:write", "users:read", "channels:read", "incoming-webhook"],
};

export const USER_SCOPES: Record<ConnectionTypes, string[]> = {
  "Google Drive": [],
  Discord: [],
  Notion: [],
  Slack: [
    "chat:write",
    "users:read",
    "channels:read",
    "channels:history",
    "files:read",
    "groups:history",
    "reactions:read",
    "groups:read",
    "mpim:read",
  ],
};

export const DashboardFeatures = [
  {
    title: "Workflows",
    desc: "Create your workflow",
    href: "/workflows",
    content:
      "Crafting Perfect Workflows for Maximum Efficiency and Productivity 🚀",
  },
  {
    title: "Subscription",
    desc: "Manage your subscription",
    href: "/billing",
    content:
      "Unlock 🔓 limitless potential with our subscription - your key to premium features! 🚀💡",
  },
  {
    title: "Settings",
    desc: "Manage username and profile photo",
    href: "/settings",
    content: "Edit your profile photo and username as you like 😎.",
  },
  {
    title: "Logs",
    desc: "View apps logs",
    href: "/logs",
    content: "Unlock 🔓 the Story Behind Your App 📱: Logging Made Simple.",
  },
];
