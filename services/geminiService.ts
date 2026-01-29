
import { GoogleGenAI } from "@google/genai";

export const getMountainAdvice = async (mountain: string, tripDate: string, medicalNotes: string): Promise<string> => {
  if (!mountain) return "";

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Anda adalah Safety Officer Jejak Langkah Adventure.
      Berikan instruksi keamanan dan perlengkapan wajib untuk pendakian ${mountain} pada ${tripDate}.
      Peserta mencatat: "${medicalNotes || 'Sehat walafiat'}".
      
      Aturan Output:
      1. Jika ada risiko medis serius, berikan PERINGATAN KERAS di awal.
      2. Berikan 5 poin perlengkapan krusial untuk medan ${mountain}.
      3. Gunakan bahasa profesional dan tegas.
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
