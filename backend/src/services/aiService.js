import { GoogleGenAI, Type } from "@google/genai";

export const generateInsights = async (tradesData) => {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY is not set. Returning mock insights.");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Format trades data for the prompt
    const formattedTrades = tradesData.map(t => ({
      date: t.exit_date || t.entry_date,
      market: t.market_type,
      symbol: t.symbol,
      direction: t.direction,
      pnl: t.pnl,
      rr: t.rr_ratio,
      strategy: t.strategy,
      notes: t.notes,
      lessons: t.lessons_learned,
      tags: t.tags,
      emotionBefore: t.emotionBefore,
      emotionAfter: t.emotionAfter
    }));

    const prompt = `
      You are an expert trading psychologist and analyst.
      Analyze the following trading journal data and provide actionable insights in Mongolian.
      Focus on identifying patterns in winning vs losing trades, psychological mistakes, strengths, and strategic improvements.
      
      Trading Data:
      ${JSON.stringify(formattedTrades, null, 2)}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "A brief overall summary of the trader's performance and current state in Mongolian.",
            },
            mistakes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of 2-3 specific mistakes or negative patterns identified from the data in Mongolian.",
            },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of 2-3 specific strengths or positive patterns identified from the data in Mongolian.",
            },
            advice: {
              type: Type.STRING,
              description: "One clear, actionable piece of advice for the next trading session in Mongolian.",
            }
          },
          required: ["summary", "mistakes", "strengths", "advice"]
        }
      }
    });

    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error generating AI insights:", error);
    return null;
  }
};
