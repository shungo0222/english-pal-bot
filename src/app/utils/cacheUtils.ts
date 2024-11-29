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
 * This function is used internally by `getNextPage` to indicate that data is being fetched from the Notion DB.
 *
 * @param client - Initialized LINE Messaging API client instance
 * @param chatId - LINE user's chat ID
 */
async function startLoadingAnimation(
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
  chatId: string
): Promise<NotionPage | null> {
  try {
    // If the cache is empty or all pages have been served
    if (cache.currentIndex >= cache.data.length) {
      console.log("Cache exhausted. Fetching new data from Notion API...");
      
      // Display loading animation while fetching data
      await startLoadingAnimation(client, chatId);

      // Fetch the next batch of data from the Notion API
      const response: NotionApiResponse = await getFormattedDatabasePages(
        cache.nextCursor ?? undefined // Handle null by passing undefined
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
    });

    cache.currentIndex += 1; // Increment the index for the next call
    return nextPage;
  } catch (error) {
    console.error("Error fetching the next page:", error);
    throw new Error("Failed to fetch the next page.");
  }
}