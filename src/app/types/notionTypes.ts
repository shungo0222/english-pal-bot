/**
 * Represents the properties of a Notion page.
 *
 * Each property corresponds to a specific column or field in the associated Notion database.
 * These properties hold structured data about the page, such as metadata and custom content.
 */
export interface NotionPageProperties {
  /**
   * The last reviewed date for the phrase or word.
   *
   * - Format: ISO 8601 date string (e.g., "2024-11-27").
   * - This represents the most recent date the user studied this item.
   */
  lastStudied: string;

  /**
   * Indicates whether the pronunciation of the phrase or word requires special attention.
   *
   * - Boolean value (`true` or `false`).
   * - If `true`, the user should focus on pronunciation while studying this word.
   */
  pronunciationCheck: boolean;

  /**
   * A list of movies associated with the phrase or word.
   *
   * - Example: ["The Matrix", "Inception"]
   * - This helps link the word or phrase to its context, such as movies where it was encountered.
   */
  movie: string[];

  /**
   * A reference URL used to research the meaning of the phrase or word.
   *
   * - Example: "https://dictionary.cambridge.org/us/dictionary/english/sulk"
   */
  url: string;

  /**
   * The grammatical category or type of the phrase or word.
   *
   * - Example: ["Verb", "Noun"]
   * - Represents the word type or its classifications (e.g., part of speech).
   */
  category: string[];

  /**
   * The creation date of this Notion page.
   *
   * - Format: ISO 8601 date string (e.g., "2024-11-27T01:26:00.000Z").
   * - This indicates when the page was first created in the database.
   */
  created: string;

  /**
   * An example sentence using the phrase or word.
   *
   * - Example: "He's sulking in his room because I wouldn't let him have any more chocolate."
   * - Provides contextual usage to better understand the phrase or word.
   */
  example: string;

  /**
   * The definition or explanation of the phrase or word.
   *
   * - Example: "To be silent and refuse to smile or be pleasant because you are angry."
   */
  meaning: string;

  /**
   * The memorization status of the phrase or word.
   *
   * - Example: "Never Better", "Good", "So So", "Not At All"
   * - Tracks how well the user has memorized the item, based on their self-assessment.
   */
  memorized: string;

  /**
   * The phrase or word being studied.
   *
   * - Example: "sulk"
   * - This is the main title or focus of the Notion page.
   */
  phrase: string;
}

/**
 * Represents a single Notion page retrieved from a Notion database query.
 *
 * This interface models the structure of an individual page object as returned by
 * the Notion API. It includes metadata such as the page ID and URL, as well as
 * its associated properties structured according to the database schema.
 */
export interface NotionPage {
  /**
   * The unique identifier for the Notion page.
   *
   * - This ID is globally unique within Notion and can be used to reference or
   *   update the specific page through the API.
   * - Example: "14bc2a7d-deb3-8075-b11a-c057a3e6f685"
   */
  id: string;

  /**
   * The URL of the Notion page.
   *
   * - This is a public or private link to the page, depending on the permissions
   *   set in the Notion workspace.
   * - Example: "https://www.notion.so/sulk-14bc2a7ddeb38075b11ac057a3e6f685"
   */
  url: string;

  /**
   * The structured properties of the Notion page.
   *
   * - These properties are defined by the schema of the database to which the
   *   page belongs.
   * - Each property corresponds to a column or field in the database and contains
   *   specific data related to the page (e.g., title, tags, or custom fields).
   */
  properties: NotionPageProperties;
}

/**
 * Represents the API response returned when querying a Notion database.
 *
 * This interface is used to model the response from the Notion API's `databases.query` endpoint.
 * It includes metadata for pagination and the array of page results fetched from the database.
 */
export interface NotionApiResponse {
  /**
   * The cursor used for paginating through results.
   * If there are more results available, this value will be a string representing
   * the cursor for the next page of results.
   * If there are no more results, this value will be `null`.
   */
  next_cursor: string | null;

  /**
   * An array of pages retrieved from the queried Notion database.
   * Each element in the array represents a single page, with its associated properties and metadata.
   */
  results: NotionPage[];
}