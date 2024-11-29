import { Client } from "@notionhq/client";
import { NotionApiResponse, NotionPage, NotionPageProperties } from "../types/notionTypes";

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY, // Your Notion API Key from .env
});

/**
 * Transforms raw Notion API data into a structured NotionPage object.
 * 
 * This function is responsible for extracting and mapping the necessary data
 * from a raw Notion API page response into the `NotionPage` structure. It ensures
 * that only relevant fields are included and defaults are provided for optional fields.
 * 
 * @param rawPage - The raw Notion page data from the API response. This is the unprocessed
 *                  data returned by the Notion API when querying a database.
 * @returns A structured `NotionPage` object containing the formatted properties.
 */
function transformNotionPage(rawPage: any): NotionPage {
  // Extract the properties field from the raw page object
  const properties = rawPage.properties;

  // Map the raw properties into the structured NotionPageProperties object
  const transformedProperties: NotionPageProperties = {
    lastStudied: properties["Last Studied"]?.date?.start || "", // Date of the last study session
    pronunciationCheck: properties["PronunciationCheck"]?.checkbox || false, // Whether pronunciation has been checked
    movie: properties["Movie"]?.multi_select?.map((item: any) => item.name) || [], // List of associated movie names
    url: properties["URL"]?.url || "", // URL string related to the word/phrase
    category: properties["Category"]?.multi_select?.map((item: any) => item.name) || [], // List of categories (e.g., noun, verb)
    created: properties["Created"]?.created_time || "", // Page creation date in ISO 8601 format
    example: properties["Example"]?.rich_text?.[0]?.plain_text || "", // Example sentence in plain text
    meaning: properties["Meaning"]?.rich_text?.[0]?.plain_text || "", // Meaning of the word/phrase in plain text
    memorized: properties["Memorized"]?.select?.name || "", // Memorization status (e.g., "Never Better")
    phrase: properties["Phrase"]?.title?.[0]?.plain_text || "", // The primary phrase or word
  };

  // Return the formatted NotionPage object
  return {
    id: rawPage.id, // Unique identifier for the page
    url: rawPage.url, // URL of the Notion page
    properties: transformedProperties, // Structured properties of the page
  };
}

/**
 * Fetches and formats pages from a specific Notion database with pagination support.
 * 
 * This function queries a Notion database using the Notion API, retrieves pages starting from
 * a specified cursor (if provided), and transforms the raw API response into a structured format.
 * 
 * @param startCursor - (Optional) The cursor to start fetching pages from. Defaults to the first page.
 * @returns A `Promise` that resolves to a `NotionApiResponse` containing structured and formatted pages.
 *          The response includes pagination details (`next_cursor`) and an array of formatted `NotionPage` objects.
 * @throws An error if the Notion API call fails or the data transformation encounters an issue.
 */
export async function getFormattedDatabasePages(startCursor?: string): Promise<NotionApiResponse> {
  try {
    // Ensure the database ID is defined in the environment variables
    const databaseId = process.env.NOTION_DATABASE_ID;
    if (!databaseId) {
      throw new Error("NOTION_DATABASE_ID environment variable is not set.");
    }

    // Query the Notion database with optional pagination and sorting by "Last Studied"
    const rawResponse = await notion.databases.query({
      database_id: databaseId, // Fixed database ID from environment variable
      start_cursor: startCursor, // Optional cursor for pagination
      sorts: [
        {
          property: "Last Studied", // The property to sort by
          direction: "ascending", // Sort in ascending order (oldest first)
        },
      ],
    });

    // Transform raw pages into structured NotionPage objects
    const formattedPages: NotionPage[] = rawResponse.results.map(transformNotionPage);

    return {
      next_cursor: rawResponse.next_cursor || null, // Cursor for the next page
      results: formattedPages, // Transformed pages
    };
  } catch (error) {
    // Log the error for debugging purposes
    console.error("Error fetching and formatting database pages:", error);

    // Throw a new error to indicate failure to the calling function
    throw new Error("Failed to fetch and format database pages.");
  }
}

/**
 * Updates the "Memorized" and "Last Studied" properties of a Notion page.
 * 
 * @param pageId - The ID of the Notion page to update.
 * @param memorizedValue - The new value for the "Memorized" property.
 *                          Must be one of: "Never Better", "Good", "So So", "Not At All".
 * @returns A promise that resolves when the update is complete.
 * @throws An error if the Notion API update fails.
 */
export async function updateMemorizationStatus(
  pageId: string,
  memorizedValue: "Never Better" | "Good" | "So So" | "Not At All"
): Promise<void> {
  try {
    // Current timestamp in ISO 8601 format
    const currentTimestamp = new Date().toISOString();

    // Update the Notion page
    await notion.pages.update({
      page_id: pageId,
      properties: {
        Memorized: {
          select: { name: memorizedValue }, // Update the select field
        },
        "Last Studied": {
          date: { start: currentTimestamp }, // Update the date field
        },
      },
    });
  } catch (error) {
    throw new Error("Failed to update memorization status.");
  }
}