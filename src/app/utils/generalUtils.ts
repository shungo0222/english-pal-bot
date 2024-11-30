import { ButtonLabel } from "../api/webhook/route";
import type { NotionPageProperties } from "../types/notionTypes";

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
 */
export function formatMessage(properties: NotionPageProperties): string {
  // Create the formatted message
  const message = [
    `- Meaning:\n${properties.meaning || "Meaning not available"}`,
    `- Example:\n${properties.example || "Example not available"}`,
    `- Pronunciation Check:\n${
      properties.pronunciationCheck
        ? "⚠️ Pay special attention to pronunciation!"
        : "No special pronunciation issues."
    }`,
    `- Category:\n${properties.category.join(", ") || "No category specified."}`,
    `- Last Studied:\n${properties.lastStudied || "Not studied yet."}`,
    `- Memorized:\n${properties.memorized || "No progress recorded."}`,
    `- URL:\n${properties.url || "No reference URL available."}`,
  ];

  // Join the parts with double line breaks for better readability
  return message.join("\n\n");
}