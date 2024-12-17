import { doc, getDoc, updateDoc, arrayUnion, increment, setDoc, serverTimestamp } from "firebase/firestore";
import { firestore } from "../constants/firebaseConfig";

// Helper function to get the date in "YYYY-MM-DD" format
function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Saves the current learning progress to Firestore.
 * 
 * @param wordData - The word information being studied.
 * @param memorizedStatus - The memorization status: "Never Better", "Good", "So So", "Not At All".
 */
export async function saveLearningProgress(
  wordData: { pageId: string; phrase: string },
  memorizedStatus: "Never Better" | "Good" | "So So" | "Not At All"
) {
  const date = getCurrentDate(); // Get the current date automatically

  try {
    const progressRef = doc(firestore, "learningProgress", date);
    const progressDoc = await getDoc(progressRef);

    // Ensure the document exists (initialize if not)
    if (!progressDoc.exists()) {
      await setDoc(
        progressRef,
        {
          totalStudied: 0,
          memorized: {
            "Never Better": 0,
            "Good": 0,
            "So So": 0,
            "Not At All": 0,
          },
          studiedWords: [],
          lastUpdated: new Date().toISOString(),
          createdAt: serverTimestamp(),
        },
        { merge: true } // Merge only if the document doesn't exist
      );
      console.log(`Document for ${date} initialized.`);
    }

    // Update the learning progress
    await updateDoc(progressRef, {
      totalStudied: increment(1), // Increment total studied count
      [`memorized.${memorizedStatus}`]: increment(1), // Increment specific memorized status
      studiedWords: arrayUnion({
        pageId: wordData.pageId,
        phrase: wordData.phrase,
        memorized: memorizedStatus,
        updatedAt: new Date().toISOString(),
      }),
      lastUpdated: new Date().toISOString(),
    });

    console.log("Learning progress saved successfully.");
  } catch (error) {
    console.error("Error saving learning progress:", error);
    throw new Error("Failed to save learning progress.");
  }
}