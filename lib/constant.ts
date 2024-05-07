import Category from "@/components/icons/category";
import Logs from "@/components/icons/clipboard";
import Templates from "@/components/icons/cloud_download";
import Home from "@/components/icons/home";
import Payment from "@/components/icons/payment";
import Settings from "@/components/icons/settings";
import Workflows from "@/components/icons/workflows";
import {
  Connection,
  ConnectionTypes,
  CustomNodeTypes,
  PropertyTypes,
} from "./types";

export const menuOptions = [
  { name: "Dashboard", Component: Home, href: "/dashboard" },
  { name: "Workflows", Component: Workflows, href: "/workflows" },
  { name: "Settings", Component: Settings, href: "/settings" },
  { name: "Connections", Component: Category, href: "/connections" },
  { name: "Billing", Component: Payment, href: "/billing" },
  { name: "Templates", Component: Templates, href: "/templates" },
  { name: "Logs", Component: Logs, href: "/logs" },
];

export const CustomNodeDefaultValues: Record<string, { description: string }> =
  {
    AI: {
      description:
        "Use the power of AI to summarize, respond, create and much more.",
    },
    Slack: { description: "Send a notification to slack" },
    "Google Drive": {
      description:
        "Connect with Google drive to trigger actions or to create files and folders.",
    },
    Notion: { description: "Create entries directly in notion." },
    Discord: {
      description: "Post messages to your discord server",
    },
    "Google Calendar": {
      description: "Create a calendar invite.",
    },
    Wait: {
      description: "Delay the next action step by using the wait timer.",
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
      "0": "A User or Role is mentioned.",
      "1": "A new message is posted in the text channel.",
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
      "0": "A new #channel is created",
      "1": "A new file is uploaded into the public #channel.",
      "2": "A new Reaction is added to a Message.",
      "3": "A new message is posted to a #channel.",
      "4": "A new user joined a #public-channel or #private-channel.",
    },
  },
};

// Types included automatically, if present in notion db schema- created_by, created_time, last_edited_by, last_edited_time
// Unsupported types 'cause they are highly complex and time consuming to implement- files, formula, relation, rollup, unique_id, verification
export const messageSchema: Record<string, string> = {
  url: "url",
  checkbox: "checkbox",
  number: "number",
  email: "email",
  title: "text",
  status: "text",
  select: "text",
  multi_select: "text",
  phone_number: "tel",
  date: "date",
  rich_text: "text",
  people: "text",
};

export const databaseIdMapper = new Map<
  string,
  {
    name: string;
    type: PropertyTypes;
  }[]
>();

export const UnsupportedTypes = new Set([
  "last_edited_by",
  "last_edited_time",
  "created_by",
  "created_time",
  "files",
  "relation",
  "rollup",
  "unique_id",
  "formula",
  "verification",
]);
