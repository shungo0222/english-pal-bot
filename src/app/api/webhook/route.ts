// ============================
// Imports and Configurations
// ============================

import { NextRequest, NextResponse } from "next/server";
import * as line from "@line/bot-sdk";
import type { QuickReplyItem } from "@line/bot-sdk";

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
    action: { type: "message", label: ButtonLabel.Next, text: ButtonLabel.Next },
  },

  // The "Meaning" button displays the meaning of the current word
  Meaning: {
    type: "action",
    action: { type: "message", label: ButtonLabel.Meaning, text: ButtonLabel.Meaning },
  },

  // The "Never Better" button marks the word as fully memorized by the user
  NeverBetter: {
    type: "action",
    action: { type: "message", label: ButtonLabel.NeverBetter, text: ButtonLabel.NeverBetter },
  },

  // The "Good" button marks the word as moderately memorized
  Good: {
    type: "action",
    action: { type: "message", label: ButtonLabel.Good, text: ButtonLabel.Good },
  },

  // The "So So" button marks the word as partially memorized
  SoSo: {
    type: "action",
    action: { type: "message", label: ButtonLabel.SoSo, text: ButtonLabel.SoSo },
  },

  // The "Not At All" button marks the word as not memorized at all
  NotAtAll: {
    type: "action",
    action: { type: "message", label: ButtonLabel.NotAtAll, text: ButtonLabel.NotAtAll },
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
            return; // Stop further processing for this event
          }

          // Handle "Next" button press
          if (userMessage === ButtonLabel.Next) {
            userState = "NotUnderstood"; // Update state
            await client.replyMessage({
              replyToken: event.replyToken,
              messages: [
                {
                  type: "text",
                  text: "Here is the next word! Please select an action.",
                  quickReply: { items: [Button.Next, Button.Meaning] },
                },
              ],
            });
          }

          // Handle "Meaning" button press
          else if (userMessage === ButtonLabel.Meaning) {
            if (userState === "NotUnderstood") {
              userState = "Understood"; // Update state
              await client.replyMessage({
                replyToken: event.replyToken,
                messages: [
                  {
                    type: "text",
                    text: "The meaning of this word is 'example'.",
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
            if (userState === "Understood") {
              userState = "NotUnderstood"; // Reset state
              await client.replyMessage({
                replyToken: event.replyToken,
                messages: [
                  {
                    type: "text",
                    text: `The button '${userMessage}' was pressed! It has been recorded.`,
                  },
                  {
                    type: "text",
                    text: "Here is the next word! Please select an action.",
                    quickReply: { items: [Button.Next, Button.Meaning] },
                  },
                ],
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