import { NextRequest, NextResponse } from "next/server";
import path from "path";
import util from "util";
import fs from "fs";
import { TextToSpeechClient, protos } from "@google-cloud/text-to-speech";

// Initialize Google Cloud Text-to-Speech client
const client = new TextToSpeechClient();

/**
 * Generates an audio file from the provided text using Google Cloud Text-to-Speech API.
 * 
 * @param text - The text to be synthesized into speech.
 * @param outputFilePath - The path where the generated audio file will be saved.
 * @returns Promise<void>
 */
async function generateAudioFile(text: string, outputFilePath: string): Promise<void> {
  try {
    // Construct the request
    const request: protos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest = {
      input: { text },
      voice: { languageCode: "en-US", ssmlGender: protos.google.cloud.texttospeech.v1.SsmlVoiceGender.NEUTRAL },
      audioConfig: { audioEncoding: "MP3" },
    };

    // Perform text-to-speech request
    const [response] = await client.synthesizeSpeech(request);

    if (!response.audioContent) {
      throw new Error("Failed to generate audio content.");
    }

    // Write the audio content to a file
    const writeFile = util.promisify(fs.writeFile);
    await writeFile(outputFilePath, response.audioContent, "binary");
    console.log(`Audio file created successfully: ${outputFilePath}`);
  } catch (error) {
    console.error("An error occurred while generating the audio file:", error);
    throw error;
  }
}

/**
 * Verifies if the request contains a valid internal API key.
 * @param req - The incoming NextRequest object.
 * @returns True if the API key is valid, otherwise false.
 */
function isValidApiKey(req: NextRequest): boolean {
  const apiKey = req.headers.get("internal-api-key");
  return apiKey === process.env.INTERNAL_API_KEY;
}

/**
 * API Endpoint: Convert text into an audio file
 *
 * This API receives a text string via a POST request, converts it into an audio file
 * using Google Cloud Text-to-Speech API, and returns the URL to access the generated audio file.
 *
 * @param request - The HTTP POST request containing the JSON payload with the `text` to synthesize.
 * @returns A JSON response containing the URL of the generated audio file or an error message.
 */
export async function POST(request: NextRequest) {
  try {
    // API Key Validation
    if (!isValidApiKey(request)) {
      return NextResponse.json(
        { error: "Invalid API key." },
        { status: 403 }
      );
    }

    // Parse the incoming request body
    const { text, pageId } = await request.json();

    // Validate the input
    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing 'text' parameter." },
        { status: 400 }
      );
    }

    if (!pageId || typeof pageId !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing 'pageId' parameter." },
        { status: 400 }
      );
    }

    // Define the output directory and file path
    const outputDir = path.resolve(process.cwd(), "public/output"); // Directory for saving audio files
    const fileName = `audio-${pageId}.mp3`; // Unique file name based on "pageId"
    const outputFilePath = path.join(outputDir, fileName);

    // Ensure the output directory exists, create it if not
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate the audio file from the text
    await generateAudioFile(text, outputFilePath);

    // Get the host name from the request header
    const host = request.headers.get("host");
    if (!host) {
      throw new Error("Failed to get host name.");
    }

    // Construct the URL for the generated file (accessible via the public directory)
    const fileUrl = `https://${host}/output/${fileName}`;

    // Return the file URL as a JSON response
    return NextResponse.json({ fileUrl });
  } catch (error) {
    // Log the error for debugging
    console.error("Error generating audio file:", error);

    // Return a 500 error response
    return NextResponse.json(
      { error: "Failed to generate audio file." },
      { status: 500 }
    );
  }
}