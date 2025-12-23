
import { GoogleGenAI, Type } from "@google/genai";

export const processDocumentOCR = async (base64Image: string, mimeType: string) => {
  try {
    // Create a new GoogleGenAI instance right before making an API call to ensure it always uses 
    // the most up-to-date API key from the environment/dialog as per guidelines.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Use gemini-3-flash-preview for high-performance multi-modal processing
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { 
            text: `You are an expert OCR system for Japanese legal documents (Residence Cards or Driver's Licenses). 
            Extract information into structured JSON according to the schema.` 
          },
          { inlineData: { mimeType, data: base64Image } }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            birthday: { type: Type.STRING },
            address: { type: Type.STRING },
            postalCode: { type: Type.STRING },
            gender: { type: Type.STRING },
            visaType: { type: Type.STRING },
            visaPeriod: { type: Type.STRING },
            residenceCardNo: { type: Type.STRING },
          }
        }
      }
    });
    
    // The extracted text is available via the .text property
    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("OCR Error:", error);
    throw error;
  }
};

export const cropFaceFromDocument = async (base64Image: string, mimeType: string) => {
  try {
    // Create a new GoogleGenAI instance right before making an API call
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // gemini-2.5-flash-image is used for image manipulation/analysis tasks
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: "Locate the headshot on this ID card and return ONLY the cropped face as an image." },
          { inlineData: { mimeType, data: base64Image } }
        ]
      }
    });

    // Iterate through response parts to find the image part (inlineData) as per guidelines
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString: string = part.inlineData.data;
          return `data:image/png;base64,${base64EncodeString}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Face Crop Error:", error);
    return null;
  }
};
