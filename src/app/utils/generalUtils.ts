import { FlexBox, FlexBubble } from "@line/bot-sdk";
import { ButtonLabel } from "../constants/buttons";
import type { NotionPage, NotionPageProperties } from "../types/notionTypes";

/**
 * Returns a string combining an emoji icon and the corresponding ButtonLabel text.
 * 
 * This utility function maps each ButtonLabel to a specific emoji and returns
 * a formatted string that includes both the icon and the label. It is designed
 * to be reusable across various components and contexts (e.g., quick replies,
 * regular messages, or UI elements).
 * 
 * @param label - The ButtonLabel for which the icon and label text are required.
 * @returns A string combining the emoji icon and the ButtonLabel text.
 */
export function getIconAndLabel(label: ButtonLabel): string {
  // Define a mapping between ButtonLabel values and their corresponding icons
  const icons: Record<ButtonLabel, string> = {
    [ButtonLabel.Next]: "⏭",  // Icon for the "Next" button
    [ButtonLabel.Meaning]: "💬",  // Icon for the "Meaning" button
    [ButtonLabel.NeverBetter]: "❤️",  // Icon for the "Never Better" button
    [ButtonLabel.Good]: "👍", // Icon for the "Good" button
    [ButtonLabel.SoSo]: "💦", // Icon for the "So So" button
    [ButtonLabel.NotAtAll]: "💣", // Icon for the "Not At All" button
  };

  // Combine the icon and label text
  const icon = icons[label] || ""; // Default to an empty string if no icon is found
  return `${icon} ${label}`; // Combine the icon and the label text
}

/**
 * Formats the NotionPageProperties into a structured message for LINE Bot.
 * 
 * @param properties - The properties of the Notion page to format.
 * @returns A formatted message string.
 * 
 * @note This function is no longer actively used as it has been replaced by the Flex Message implementation for better UI/UX. 
 * However, it has been retained here for reference or in case the plain text format is needed in the future.
 */
export function formatMessage(properties: NotionPageProperties): string {
  // Create the formatted message
  const memorizedLabel = properties.memorized
    ? getIconAndLabel(properties.memorized as ButtonLabel)
    : "No progress recorded.";
  
  // Calculate the number of days since last studied
  const daysSinceLastStudied = properties.lastStudied
    ? Math.floor((new Date().getTime() - new Date(properties.lastStudied).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const message = [
    `- Meaning:\n${properties.meaning || "Meaning not available"}`,
    `- Example:\n${properties.example || "Example not available"}`,
    `- Pronunciation Check:\n${
      properties.pronunciationCheck
        ? "⚠️ Issue"
        : "✅ OK"
    }`,
    `- Category:\n${properties.category.join(", ") || "No category specified."}`,
    `- Last Studied:\n${properties.lastStudied || "Not studied yet."}${
      daysSinceLastStudied !== null ? `\n(${daysSinceLastStudied} days ago)` : ""
    }`,
    `- Memorized:\n${memorizedLabel}`,
    `- URL:\n${properties.url || "No reference URL available."}`,
  ];

  // Join the parts with double line breaks for better readability
  return message.join("\n\n");
}

/**
 * Converts Notion page data into a Flex Message Bubble for LINE Bot.
 *
 * @param page - The Notion page containing properties to be formatted.
 * @returns A FlexBubble object representing the page details in a structured format.
 */
export function formatFlexMessage(page: NotionPage): FlexBubble {
  const properties = page.properties;

  // Get the memorization status label
  const memorizedLabel = properties.memorized
    ? getIconAndLabel(properties.memorized as ButtonLabel)
    : "No progress recorded.";

  // Calculate days since the item was last studied
  const daysSinceLastStudied = properties.lastStudied
    ? Math.floor(
        (new Date().getTime() - new Date(properties.lastStudied).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  // Helper function to create a row in the Flex Message body
  const createRow = (label: string, value: string, valueColor: string = "#ffffff"): FlexBox => ({
    type: "box",
    layout: "horizontal",
    paddingTop: "sm",
    contents: [
      {
        type: "text",
        text: `${label}:`,
        size: "sm",
        color: "#c7d5e0",
        flex: 2,
      },
      {
        type: "text",
        text: value || "-",
        size: "sm",
        color: valueColor,
        flex: 3,
        wrap: true,
      },
    ],
  });

  return {
    type: "bubble",
    styles: {
      body: { backgroundColor: "#2b3a42" }, // Slightly brightened, blue-tinted background
      header: { backgroundColor: "#2b3a42" },
      footer: { backgroundColor: "#2b3a42" },
    },
    header: {
      type: "box",
      layout: "vertical",
      paddingBottom: "none",
      contents: [
        {
          type: "text",
          text: properties.phrase,
          weight: "bold",
          size: properties.phrase.length > 20 ? "md" : "lg",
          color: "#ffffff",
          wrap: true,
        },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        createRow("Meaning", properties.meaning),
        { type: "separator", margin: "sm" },
        createRow("Example", properties.example),
        { type: "separator", margin: "sm" },
        createRow(
          "Pronunciation",
          properties.pronunciationCheck ? "⚠️ Issue" : "✅ OK",
          properties.pronunciationCheck ? "#FF0000" : "#00AA00"
        ),
        { type: "separator", margin: "sm" },
        createRow("Category", properties.category.join(", ")),
        { type: "separator", margin: "sm" },
        createRow(
          "Last Studied",
          properties.lastStudied
            ? `${properties.lastStudied}${
                daysSinceLastStudied !== null
                  ? `\n(${daysSinceLastStudied} days ago)`
                  : ""
              }`
            : "Not studied yet."
        ),
        { type: "separator", margin: "sm" },
        createRow("Memorized", memorizedLabel),
      ],
    },
    footer: {
      type: "box",
      layout: "horizontal",
      spacing: "sm",
      contents: [
        {
          type: "button",
          style: "primary",
          action: {
            type: "uri",
            label: "URL",
            uri: properties.url || "https://www.google.com",
          },
          color: "#4CAF50", // Green background
        },
        {
          type: "button",
          style: "primary",
          action: {
            type: "uri",
            label: "Notion",
            uri: page.url,
          },
          color: "#2196F3", // Blue background
        },
      ],
    },
  };
}