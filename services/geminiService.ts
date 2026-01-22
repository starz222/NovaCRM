
import { GoogleGenAI, Type } from "@google/genai";
import { Contact, Deal, CRMData, DealStage } from "../types";

// The API_KEY is injected by Vite during the build process
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateLeadInsight = async (contact: Contact, notes: string[]) => {
  try {
    if (!process.env.API_KEY) throw new Error("API Key missing");
    
    const prompt = `Analyze this contact for a CRM and provide a short executive summary of our relationship status and 3 actionable next steps.
    Contact: ${contact.name} from ${contact.company} (${contact.role})
    Interaction History:
    ${notes.join('\n')}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are an expert sales assistant. Be concise, professional, and strategic.",
        temperature: 0.7,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI Insights currently unavailable. Check API_KEY settings.";
  }
};

export const analyzeNewContact = async (name: string, company: string, notes: string) => {
  try {
    const prompt = `A new contact has been added to the CRM.
    Name: ${name}
    Company: ${company}
    Initial Notes: ${notes}

    Based on these notes, determine:
    1. The most appropriate Pipeline Stage (Lead, Qualified, Proposal, Negotiation, Closed Won, Closed Lost).
    2. A specific "Immediate Next Step".
    3. A comprehensive 3-step action plan for this lead. Each step must have a title, a type (Email, Call, Meeting, or Message), and a suggested day delay (0 for today, 1 for tomorrow, etc.).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedStage: { 
              type: Type.STRING, 
              enum: Object.values(DealStage),
            },
            nextStep: { type: Type.STRING },
            actionPlan: {
              type: Type.ARRAY,
              items: { 
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['Email', 'Call', 'Meeting', 'Message'] },
                  delayDays: { type: Type.NUMBER }
                },
                required: ["title", "type", "delayDays"]
              }
            },
            summary: { type: Type.STRING }
          },
          required: ["suggestedStage", "nextStep", "actionPlan", "summary"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Lead Analysis Error:", error);
    return null;
  }
};

export const suggestEmailDraft = async (contact: Contact, context: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a professional follow-up email to ${contact.name} from ${contact.company}. Context: ${context}`,
    });
    return response.text;
  } catch (error) {
    return "Failed to draft email.";
  }
};

export const getDealSummary = async (deals: Deal[]) => {
  try {
    if (!deals.length) return null;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Summarize pipeline health for these deals: ${JSON.stringify(deals)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            healthScore: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            riskDeals: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["healthScore", "summary", "riskDeals"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    return null;
  }
};
