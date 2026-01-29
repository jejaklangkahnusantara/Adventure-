
import { GoogleGenAI } from "@google/genai";

export const getMountainAdvice = async (mountain: string, tripDate: string): Promise<string> => {
  if (!mountain) return "";

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Anda adalah Safety Officer Jejak Langkah Adventure.
      Berikan instruksi keamanan dan perlengkapan wajib untuk pendakian ${mountain} pada ${tripDate}.
      
      Aturan Output:
      1. Berikan 5 poin perlengkapan krusial untuk medan ${mountain}.
      2. Gunakan bahasa profesional dan tegas.
      3. Fokus pada aspek teknis pendakian.
      4. Maksimal 100 kata.`,
      config: {
        temperature: 0.5,
      }
    });

    return response.text || "Siapkan fisik dengan baik. Bawa jas hujan, jaket thermal, dan headlamp.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Koneksi AI terganggu. Pastikan membawa standar operasional pendakian (SOP) lengkap.";
  }
};
