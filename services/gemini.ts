
import { GoogleGenAI } from "@google/genai";

// Fallback local drill generator when offline or no API key
const generateLocalDrill = (mistakenChars: string[]): string => {
  if (!mistakenChars.length) return "";
  const chars = [...mistakenChars];
  let drill = "";
  for (let i = 0; i < 15; i++) {
    const c1 = chars[Math.floor(Math.random() * chars.length)];
    const c2 = chars[Math.floor(Math.random() * chars.length)];
    drill += `${c1}${c2}${c1} `;
  }
  return drill.trim();
};

const getLocalFeedback = (wpm: number, accuracy: number): string => {
  if (accuracy >= 98 && wpm >= 40) {
    return "Outstanding rhythm and precision! You are typing with great mastery.";
  } else if (accuracy >= 95) {
    return "Great accuracy! Keep your fingers relaxed to gradually boost your typing speed.";
  } else if (accuracy < 90) {
    return "Focus on hitting the correct keys cleanly first before speeding up. Accuracy builds speed!";
  } else {
    return "Good steady progress! Keep your eyes on the screen and trust your muscle memory.";
  }
};

export const generateDrillFromMistakes = async (mistakenChars: string[]): Promise<string> => {
  if (!mistakenChars.length) return "";
  
  try {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return generateLocalDrill(mistakenChars);
    }
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a typing practice string focusing specifically on these difficult characters: ${mistakenChars.join(", ")}. The string should be around 100 characters long and meaningful if possible. Do not include markdown formatting or quotes.`,
    });
    return response.text?.trim() || generateLocalDrill(mistakenChars);
  } catch (error) {
    console.warn("Gemini drill generation failed, using local drill:", error);
    return generateLocalDrill(mistakenChars);
  }
};

export const getAIFeedback = async (wpm: number, accuracy: number): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return getLocalFeedback(wpm, accuracy);
    }
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `As a typing coach, provide a very short (max 2 sentences) encouraging feedback for a student who typed at ${wpm} WPM with ${accuracy}% accuracy.`,
    });
    return response.text?.trim() || getLocalFeedback(wpm, accuracy);
  } catch (error) {
    return getLocalFeedback(wpm, accuracy);
  }
};

