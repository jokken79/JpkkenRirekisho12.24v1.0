
import { GoogleGenAI } from "@google/genai";
import { StaffMember } from "../types";

export const getStaffInsights = async (staff: StaffMember[]) => {
  if (!staff || staff.length === 0) return "No staff data available for analysis.";

  // Create a new GoogleGenAI instance right before making an API call to ensure it always uses 
  // the most up-to-date API key from the environment/dialog as per guidelines.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const staffSummary = staff.map(s => ({
    name: s.fullName,
    type: s.type,
    dept: s.department || s.companyName,
    status: s.status,
    hireDate: s.hireDate || s.contractStart
  })).slice(0, 50); // Limit context for safety

  const prompt = `Analyze the following personnel data for StaffHub UNS Pro and provide a strategic executive summary (max 200 words). 
  Focus on:
  1. Ratio of GenzaiX vs Ukeoi
  2. Potential operational risks (e.g. status trends)
  3. Key recommendations for resource allocation.
  
  Data: ${JSON.stringify(staffSummary)}`;

  try {
    // Upgraded to gemini-3-pro-preview for complex reasoning and strategic analysis tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.9,
      }
    });
    // .text is a property, not a method
    return response.text || "Unable to generate insights at this time.";
  } catch (error) {
    console.error('AI Error:', error);
    return "The AI Intelligence service is currently unavailable. Please check your API configuration.";
  }
};
