
import { GoogleGenAI, Type } from "@google/genai";

// Re-initialize GoogleGenAI inside functions to ensure latest API key and configuration as per guidelines for Gemini 3 models
export const generateDrillFromMistakes = async (mistakenChars: string[]): Promise<string> => {
  if (!mistakenChars.length) return "";
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a typing practice string focusing specifically on these difficult characters: ${mistakenChars.join(", ")}. The string should be around 100 characters long and meaningful if possible. Do not include markdown formatting or quotes.`,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Gemini drill generation failed:", error);
    return "";
  }
};

export const getAIFeedback = async (wpm: number, accuracy: number): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `As a typing coach, provide a very short (max 2 sentences) encouraging feedback for a student who typed at ${wpm} WPM with ${accuracy}% accuracy.`,
    });
    return response.text.trim();
  } catch (error) {
    return "Great effort! Keep practicing to improve your muscle memory.";
  }
};
