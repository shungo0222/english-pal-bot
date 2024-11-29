import type { NotionPageProperties } from "../types/notionTypes";

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