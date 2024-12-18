import fs from "fs";
import path from "path";
import * as line from "@line/bot-sdk";
import { getFormattedDatabasePages } from "./notionUtils";
import type { NotionApiResponse, NotionPage } from "../types/notionTypes";

/**
 * Cache for storing Notion pages and pagination state.
 */
export const cache = {
  data: [] as NotionPage[], // Cached pages
  nextCursor: null as string | null, // Cursor for the next page
  currentIndex: 0, // Index for the current page being served

  /**
   * Resets the cache to its initial state.
   * This clears all cached data, resets the cursor, and the current index.
   */
  reset(): void {
    console.log("Cache is being reset.");

    // Clear the audio files in the output directory
    clearOutputDirectory();

    this.data = [];
    this.nextCursor = null;
    this.currentIndex = 0;
  },

  /**
   * Checks whether there are more pages to fetch or serve.
   * This is useful for determining whether the user has finished all available pages.
   * 
   * @returns A boolean indicating if there are more pages available.
   */
  hasMore(): boolean {
    return this.currentIndex < this.data.length || this.nextCursor !== null;
  },
};

/**
 * Starts a loading animation in the LINE chat.
 *
 * @param client - Initialized LINE Messaging API client instance
 * @param chatId - LINE user's chat ID
 */
export async function startLoadingAnimation(
  client: line.messagingApi.MessagingApiClient,
  chatId: string
): Promise<void> {
  try {
    await client.showLoadingAnimation({
      chatId: chatId,
    });
    console.log(`Loading animation started for chat ID: ${chatId}`);
  } catch (error) {
    console.error("Failed to start loading animation:", error);
  }
}

/**
 * Sends a POST request to the audio generation API to generate an audio file.
 *
 * @param apiKey - Internal API key for authentication.
 * @param text - The text to be converted into audio.
 * @param pageId - The ID of the Notion page associated with the text.
 * @param host - The host of the API server (e.g., "localhost:3000").
 * @param client - Initialized LINE Messaging API client instance
 * @param chatId - The LINE user's chat ID for displaying the loading animation.
 * @returns A promise that resolves to a boolean indicating success or failure.
 */
export async function generateAudioFileViaApi(
  apiKey: string,
  text: string,
  pageId: string,
  host: string,
  client: line.messagingApi.MessagingApiClient,
  chatId: string,
): Promise<boolean> {
  const apiUrl = `https://${host}/api/generate-audio-file`; // Build the full API URL dynamically
  try {
    // Validate the API key
    if (!apiKey) {
      throw new Error("API key is required for internal server-to-server authentication.");
    }

    // Display loading animation while fetching data
    await startLoadingAnimation(client, chatId);

    // Send a POST request to the audio generation API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "internal-api-key": apiKey, // Pass the internal API key
      },
      body: JSON.stringify({ text, pageId }), // Include text and page ID
    });

    // Check the response status
    if (!response.ok) {
      console.error(`Failed to generate audio for text: "${text}". Status: ${response.status}`);
      return false;
    }

    console.log(`Audio file successfully generated for text: "${text}"`);
    return true;
  } catch (error) {
    console.error(`Error generating audio for text: "${text}"`, error);
    return false;
  }
}

/**
 * Deletes all audio files in the public/output directory.
 */
function clearOutputDirectory(): void {
  const outputDir = path.resolve(process.cwd(), "public/output");

  try {
    // Check if the directory exists
    if (fs.existsSync(outputDir)) {
      // Read all files in the directory
      const files = fs.readdirSync(outputDir);

      // Delete each file
      files.forEach((file) => {
        const filePath = path.join(outputDir, file);
        fs.unlinkSync(filePath); // Synchronous file deletion
        console.log(`Deleted file: ${filePath}`);
      });
    } else {
      console.warn(`Output directory does not exist: ${outputDir}`);
    }
  } catch (error) {
    console.error("Error clearing output directory:", error);
  }
}

/**
 * Fetches the next page from the cached data or the Notion API.
 * If all cached pages have been served, it fetches the next set of pages using pagination.
 * Displays a loading animation in the LINE chat while fetching data from the Notion API.
 *
 * @param client - Initialized LINE Messaging API client instance
 * @param chatId - The LINE user's chat ID for displaying the loading animation.
 * @returns A `Promise` that resolves to the next `NotionPage`, or `null` if no more pages are available.
 */
export async function getNextPage(
  client: line.messagingApi.MessagingApiClient,
  chatId: string,
): Promise<NotionPage | null> {
  try {
    // If the cache is empty or all pages have been served
    if (cache.currentIndex >= cache.data.length) {
      console.log("Cache exhausted. Fetching new data from Notion API...");

      // Save nextCursor before resetting the cache
      const nextCursor = cache.nextCursor;
      console.log("nextCursor:", nextCursor);

      // Reset cache to clear old data and delete old audio files
      cache.reset();

      // Display loading animation while fetching data
      await startLoadingAnimation(client, chatId);

      // Fetch the next batch of data from the Notion API
      const response: NotionApiResponse = await getFormattedDatabasePages(
        nextCursor ?? undefined // Handle null by passing undefined
      );

      console.log("API response received:", {
        nextCursor: response.next_cursor,
        resultsCount: response.results.length,
      });

      // Update the cache with the new data
      cache.data = response.results; // Load the new batch of data
      cache.nextCursor = response.next_cursor; // Update the next cursor
      cache.currentIndex = 0; // Reset index for the new batch

      // If no results are fetched, return null
      if (cache.data.length === 0) {
        return null;
      }
    }

    // Serve the next page from the cache
    const nextPage = cache.data[cache.currentIndex];
    console.log("Serving next page:", {
      currentIndex: cache.currentIndex,
      phrase: nextPage.properties.phrase,
      pageId: nextPage.id,
    });

    cache.currentIndex += 1; // Increment the index for the next call
    return nextPage;
  } catch (error) {
    console.error("Error fetching the next page:", error);
    throw new Error("Failed to fetch the next page.");
  }
}