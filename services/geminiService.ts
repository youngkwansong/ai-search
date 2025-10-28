import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, Role } from '../types';

// The application now relies exclusively on the process.env.API_KEY.
// If the key is not set, the API call will fail and the error will be displayed in the UI.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateResponse = async (history: Message[]) => {
    const model = 'gemini-2.5-flash';
    
    // Format history for the API
    const contents = history.map(msg => ({
        role: msg.role === Role.USER ? 'user' : 'model',
        parts: [{ text: msg.content }]
    }));

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model,
            contents,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const text = response.text;
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        
        const references = groundingChunks
            .map(chunk => chunk.web)
            .filter(web => web?.uri && web.title)
            .map(web => ({
                uri: web.uri!,
                title: web.title!,
            }));
            
        // Deduplicate references based on URI
        const uniqueReferences = Array.from(new Map(references.map(ref => [ref.uri, ref])).values());

        return {
            content: text,
            references: uniqueReferences,
        };
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to get a response from the AI. Please check your API key and network connection.");
    }
};
