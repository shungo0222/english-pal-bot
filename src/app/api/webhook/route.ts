// ============================
// Imports and Configurations
// ============================

import { NextRequest, NextResponse } from "next/server";
import * as line from "@line/bot-sdk";
import type { QuickReplyItem } from "@line/bot-sdk";
import type { NotionPage } from "../../types/notionTypes";
import { getNextPage } from "../../utils/cacheUtils";
import { getIconAndLabel, formatMessage } from "../../utils/generalUtils";
import { updateMemorizationStatus } from "../../utils/notionUtils";

// ============================
// Client Initialization
// ============================

// Initialize LINE Messaging API Client
// The Messaging API client requires a channel access token to authenticate API calls.
// The access token should be securely stored in environment variables.
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!, // Access token for the LINE Messaging API
});

// ============================
// State Management
// ============================

/**
 * State variable to manage the current status of the bot's interaction with the user.
 * The state transitions as the user interacts with the bot.
 * 
 * Possible states for the `userState` variable:
 * 
 * 1. "NotDisplayed" (Initial state)
 *    - Indicates that the bot has not yet displayed any vocabulary word to the user.
 *    - This is the default state when the bot starts an interaction or resets after completing a cycle.
 * 
 * 2. "NotUnderstood"
 *    - Indicates that the bot has displayed a vocabulary word to the user, but the user has not yet requested its meaning.
 *    - In this state, the user can either proceed to the next word without viewing the meaning
 *      or request the meaning of the current word.
 * 
 * 3. "Understood"
 *    - Indicates that the bot has displayed a vocabulary word and the user has successfully reviewed its meaning.
 *    - This state allows the user to evaluate their understanding of the word by selecting from predefined feedback options.
 *    - After providing feedback, the state resets to "NotUnderstood" to display the next word.
 */
let userState: "NotDisplayed" | "NotUnderstood" | "Understood" = "NotDisplayed";

/**
 * State variable to track the currently displayed vocabulary word.
 * 
 * This variable holds the information about the current word being studied by the user.
 * It is updated whenever a new word is displayed (e.g., after pressing the "Next" button)
 * and used to respond appropriately to user interactions.
 * 
 * Possible values for the `currentWord` variable:
 * 
 * 1. `null` (Initial state)
 *    - Indicates that no word has been displayed yet.
 *    - This is the default state when the bot starts a new session or after a reset.
 * 
 * 2. `NotionPage` object
 *    - Represents the current word being displayed to the user, including its associated properties
 *      (e.g., phrase, meaning, example).
 *    - This object is updated when a new word is fetched and displayed.
 * 
 * Usage:
 * - If `currentWord` is `null`, the bot sends a default response for unsupported user messages.
 * - If `currentWord` is set, the bot uses its properties (e.g., `phrase`) to construct meaningful responses.
 */
let currentWord: NotionPage | null = null;

// ============================
// Enums and Constants
// ============================

// Define an enum for button labels used in the LINE Bot's quick reply actions
// Each enum value represents the text displayed on a button
export enum ButtonLabel {
  // Represents the "Next" button used to fetch the next word
  Next = "Next",

  // Represents the "Meaning" button used to display the meaning of the current word
  Meaning = "Meaning",

  // Represents the "Never Better" button to mark the word as completely memorized
  NeverBetter = "Never Better",

  // Represents the "Good" button to mark the word as moderately memorized
  Good = "Good",

  // Represents the "So So" button to mark the word as partially memorized
  SoSo = "So So",

  // Represents the "Not At All" button to mark the word as not memorized at all
  NotAtAll = "Not At All",
}

// Define a collection of quick reply buttons for LINE Bot
// Each button is represented as a QuickReplyItem object and tied to a specific action
export const Button: Record<string, QuickReplyItem> = {
  // The "Next" button allows the user to request the next word in the sequence
  Next: {
    type: "action",
    action: {
      type: "message",
      label: getIconAndLabel(ButtonLabel.Next),
      text: ButtonLabel.Next
    },
  },

  // The "Meaning" button displays the meaning of the current word
  Meaning: {
    type: "action",
    action: {
      type: "message",
      label: getIconAndLabel(ButtonLabel.Meaning),
      text: ButtonLabel.Meaning
    },
  },

  // The "Never Better" button marks the word as fully memorized by the user
  NeverBetter: {
    type: "action",
    action: {
      type: "message",
      label: getIconAndLabel(ButtonLabel.NeverBetter),
      text: ButtonLabel.NeverBetter
    },
  },

  // The "Good" button marks the word as moderately memorized
  Good: {
    type: "action",
    action: {
      type: "message",
      label: getIconAndLabel(ButtonLabel.Good),
      text: ButtonLabel.Good
    },
  },

  // The "So So" button marks the word as partially memorized
  SoSo: {
    type: "action",
    action: {
      type: "message",
      label: getIconAndLabel(ButtonLabel.SoSo),
      text: ButtonLabel.SoSo
    },
  },

  // The "Not At All" button marks the word as not memorized at all
  NotAtAll: {
    type: "action",
    action: {
      type: "message",
      label: getIconAndLabel(ButtonLabel.NotAtAll),
      text: ButtonLabel.NotAtAll
    },
  },
};

// ============================
// Utility Functions
// ============================

/**
 * Checks if a given value is a valid ButtonLabel.
 * This function ensures type safety when processing user input or external data.
 * 
 * @param value - The input value to check.
 * @returns - True if the value is a valid ButtonLabel, false otherwise.
 */
function isValidButtonLabel(value: string): value is ButtonLabel {
  // Use Object.values to get all possible ButtonLabel values and check inclusion
  return Object.values(ButtonLabel).includes(value as ButtonLabel);
}

// ============================
// Main API Logic
// ============================

/**
 * Main handler for incoming POST requests from LINE Webhook.
 * This function processes user interactions and responds with appropriate messages
 * and quick reply options based on the current state.
 */
export async function POST(req: NextRequest) {
  try {
    // Parse the incoming request body
    const body = await req.json();
    const events = body.events;

    // Process each event sent by the LINE platform
    await Promise.all(
      events.map(async (event: line.WebhookEvent) => {
        // Check if the event is a text message
        if (event.type === "message" && event.message.type === "text") {
          const userMessage = event.message.text;

          // Handle unsupported messages
          if (!isValidButtonLabel(userMessage)) {
            console.warn("Unsupported button label received:", userMessage);
            if (!currentWord) {
              // No current word, respond with a default unsupported message
              userState = "NotDisplayed"; // Reset state to initial
              await client.replyMessage({
                replyToken: event.replyToken,
                messages: [
                  {
                    type: "text",
                    text: 'The message you sent is not supported. Please press the "Next" button to fetch the next word.',
                    quickReply: { items: [Button.Next] },
                  },
                ],
              });
            } else {
              // A current word exists, respond with the current word's phrase
              await client.replyMessage({
                replyToken: event.replyToken,
                messages: [
                  {
                    type: "text",
                    text: currentWord.properties.phrase,
                    quickReply: { items: [Button.Next, Button.Meaning] },
                  },
                ],
              });
            }
            return; // Stop further processing for this event
          }

          // Log the user's input message
          console.log("User input received:", userMessage);

          // Handle "Next" button press
          if (userMessage === ButtonLabel.Next) {
            // Ensure chatId exists
            const chatId = event.source.userId;
            if (!chatId) {
              console.error("Chat ID not found. Cannot fetch the next page.");
              await client.replyMessage({
                replyToken: event.replyToken,
                messages: [
                  {
                    type: "text",
                    text: "Unable to process your request. Chat ID not found.",
                  },
                ],
              });
              return; // Stop further processing
            }

            // Fetch the next page from the cache and update currentWord
            currentWord = await getNextPage(client, chatId);

            if (currentWord) {
              userState = "NotUnderstood"; // Update state
              await client.replyMessage({
                replyToken: event.replyToken,
                messages: [
                  {
                    type: "text",
                    text: currentWord.properties.phrase,
                    quickReply: { items: [Button.Next, Button.Meaning] },
                  },
                ],
              });
            } else {
              // No more pages to fetch
              currentWord = null; // Clear the currentWord
              await client.replyMessage({
                replyToken: event.replyToken,
                messages: [
                  {
                    type: "text",
                    text: "No more words available. You have completed all the words!",
                  },
                ],
              });
            }
          }

          // Handle "Meaning" button press
          else if (userMessage === ButtonLabel.Meaning) {
            if (userState === "NotUnderstood" && currentWord) {
              userState = "Understood"; // Update state
              await client.replyMessage({
                replyToken: event.replyToken,
                messages: [
                  {
                    type: "text",
                    text: formatMessage(currentWord.properties),
                  },
                  {
                    type: "text",
                    text: `Notion URL:\n${currentWord.url || "No URL available"}`,
                  },
                  {
                    type: "text",
                    text: "Please select an action:",
                    quickReply: {
                      items: [
                        Button.Next,
                        Button.NeverBetter,
                        Button.Good,
                        Button.SoSo,
                        Button.NotAtAll,
                      ],
                    },
                  },
                ],
              });
            }
          }

          // Handle feedback button presses
          else if (
            [
              ButtonLabel.NeverBetter,
              ButtonLabel.Good,
              ButtonLabel.SoSo,
              ButtonLabel.NotAtAll,
            ].includes(userMessage)
          ) {
            if (userState === "Understood" && currentWord) {
              userState = "NotUnderstood"; // Reset state

              let updateSuccessful = false; // Flag to track success or failure

              try {
                // Update Notion page memorization status
                await updateMemorizationStatus(currentWord.id, userMessage);
                console.log(`Notion page "${currentWord.properties.phrase}" updated with memorization status: ${userMessage}`);
                updateSuccessful = true; // Mark as successful
              } catch (error) {
                // Log error for debugging
                console.error(`Failed to update Notion page ${currentWord.id}:`, error);
              }

              // Reply to the user based on the update status
              const replyMessages: line.TextMessage[] = updateSuccessful
                ? [
                    {
                      type: "text",
                      text: `The button "${userMessage}" was pressed! It has been recorded successfully.`,
                      quickReply: { items: [Button.Next] },
                    },
                  ]
                : [
                    {
                      type: "text",
                      text: `The button "${userMessage}" was pressed, but the update could not be completed. Please check it in Notion.`,
                      quickReply: { items: [Button.Next] },
                    },
                  ];

              await client.replyMessage({
                replyToken: event.replyToken,
                messages: replyMessages,
              });
            }
          }
        }
      })
    );

    // Respond with success status
    return NextResponse.json({ status: "Success" });
  } catch (error) {
    // Log and handle errors
    console.error("Error handling webhook:", error);
    return NextResponse.json({ status: "Error" }, { status: 500 });
  }
}