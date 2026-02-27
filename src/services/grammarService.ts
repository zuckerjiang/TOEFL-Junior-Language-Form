import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateGrammarQuestion(excludeTopics: string[] = []): Promise<Question | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a high-difficulty TOEFL Junior "Language Form & Meaning" question. 
      The question should be a sentence with one blank (indicated by "______").
      Focus on advanced grammar topics like: Subjunctive mood, complex relative clauses, inverted structures, advanced participles, or subtle conjunction usage.
      Avoid these topics if possible: ${excludeTopics.join(", ")}.
      Ensure the options are challenging and include common distractors.
      
      IMPORTANT: The "explanation" fields (rule, example, commonError) MUST be written in Chinese (简体中文).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, description: "The specific grammar topic (e.g., 'Inversion', 'Subjunctive Mood')" },
            content: { type: Type.STRING, description: "The sentence with '______' for the blank" },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Four options for the blank"
            },
            correctAnswer: { type: Type.STRING, description: "The correct option" },
            explanation: {
              type: Type.OBJECT,
              properties: {
                rule: { type: Type.STRING },
                example: { type: Type.STRING },
                commonError: { type: Type.STRING }
              },
              required: ["rule", "example", "commonError"]
            }
          },
          required: ["category", "content", "options", "correctAnswer", "explanation"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    
    const questionData = JSON.parse(text);
    return {
      id: Date.now(),
      type: 'grammar',
      ...questionData
    };
  } catch (error) {
    console.error("Error generating question:", error);
    return null;
  }
}
