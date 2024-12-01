import type { QuickReplyItem } from "@line/bot-sdk";
import { getIconAndLabel } from "../utils/generalUtils";

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