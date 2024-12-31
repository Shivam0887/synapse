import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import Stripe from "stripe";
import { CustomNodeType, PropertyTypes, SupportedPropertyTypes } from "./types";
import { HTMLInputTypeAttribute } from "react";

export const stripe = new Stripe(`${process.env.STRIPE_SECRET!}`, {
  apiVersion: "2024-12-18.acacia",
  typescript: true,
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const absolutePathUrl = "https://synapsse.netlify.app";

export const oauthRedirectUri = `${absolutePathUrl}/api/auth/callback`;

export const typedEntries = <T extends object>(data: T) => {
  return Object.entries(data) as [keyof T, T[keyof T]][];
};

// Types included automatically, if present in notion db schema- created_by, created_time, last_edited_by, last_edited_time
// Unsupported types 'cause they are highly complex and time consuming to implement- files, formula, relation, rollup, unique_id, verification
export const notionInputProperty: Record<
  SupportedPropertyTypes,
  HTMLInputTypeAttribute
> = {
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

export const isConnectionType = (nodeType: CustomNodeType | undefined) =>
  !(nodeType === undefined || nodeType === "None" || nodeType === "AI");

export const isValidTrigger = (nodeType: CustomNodeType | undefined) =>
  !(
    nodeType === undefined ||
    nodeType === "None" ||
    nodeType === "AI" ||
    nodeType === "Notion"
  );

export const isUnsupportedPropertyType = (property: PropertyTypes) => {
  return (
    property === "last_edited_by" ||
    property === "last_edited_time" ||
    property === "created_by" ||
    property === "created_time" ||
    property === "files" ||
    property === "relation" ||
    property === "rollup" ||
    property === "unique_id" ||
    property === "formula" ||
    property === "verification"
  );
};

export const getPropertyItem = (
  type: SupportedPropertyTypes,
  value: string
) => {
  switch (type) {
    case "title":
      return {
        title: [
          {
            text: {
              content: value,
            },
          },
        ],
      };
    case "multi_select":
      return {
        multi_select: [{ name: value }],
      };
    case "number":
      return {
        number: parseInt(value),
      };
    case "status":
      return {
        name: value,
      };
    case "date":
      return {
        date: {
          start: value,
          end: null,
        },
      };
    case "checkbox":
      return {
        checkbox: value === "true" ? true : false,
      };
    case "email":
      return {
        email: value,
      };
    case "rich_text":
      return {
        rich_text: [
          {
            text: {
              content: value,
            },
          },
        ],
      };
    case "people":
      return {
        people: [
          {
            name: value,
          },
        ],
      };
    case "phone_number":
      return {
        phone_number: value,
      };
    case "select":
      return {
        name: value,
      };
    default:
      return {
        url: value,
      };
  }
};
