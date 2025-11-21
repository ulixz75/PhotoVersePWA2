import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { PoemStyle, PoemMood, Poem, Language } from '../types';

const MODEL_NAME = "gemini-2.5-flash";

// La clave de API se gestiona de forma segura a través de las variables de entorno.
// Asumimos que process.env.API_KEY está preconfigurado en el entorno de ejecución.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generatePoemFromImage = async (
  base64Image: string,
  mimeType: string,
  style: PoemStyle,
  mood: PoemMood,
  language: Language
): Promise<Poem> => {
  const langInstruction = language === 'es' ? 'español' : 'inglés';
  
  const prompt = `Analiza esta imagen y crea un poema original en ${langInstruction} con un título.
- Estilo poético: ${style}.
- Tono emocional: ${mood}.
- Estructura: El poema debe tener entre 2 y 4 estrofas. Cada estrofa debe tener un máximo de 6 líneas.
- Responde únicamente en formato JSON con una clave "title" para el título y una clave "poem" para el poema (el poema debe usar '\\n' para los saltos de línea y '\\n\\n' para separar estrofas).`;

  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType: mimeType,
    },
  };

  const textPart = {
    text: prompt,
  };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            poem: { type: Type.STRING },
          },
          required: ["title", "poem"],
        },
      },
    });

    const responseJson = response.text.trim();
    if (!responseJson) {
      throw new Error("La API no devolvió contenido.");
    }
    
    const result: Poem = JSON.parse(responseJson);
    return result;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof SyntaxError) {
        throw new Error("La respuesta de la API no es un JSON válido.");
    }
    // Si el error viene de la API (ej: clave inválida), lo pasamos.
    if (error instanceof Error) {
        throw new Error(`Error de la API: ${error.message}`);
    }
    throw new Error("No se pudo generar el poema. Inténtalo de nuevo más tarde.");
  }
};