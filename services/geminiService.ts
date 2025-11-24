import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { PoemStyle, PoemMood, Poem, Language } from '../types';

const MODEL_NAME = "gemini-2.5-flash";

// La clave de API se gestiona de forma segura a través de las variables de entorno.
// Asumimos que process.env.API_KEY está preconfigurado en el entorno de ejecución.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Función auxiliar para llamar al backend de Vercel (Anthropic)
const callAnthropicFallback = async (
  base64Image: string, 
  mimeType: string, 
  prompt: string
): Promise<Poem> => {
  try {
    const response = await fetch('/api/fallback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
        mimeType: mimeType,
        prompt: prompt
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Fallback Service Error: ${errText}`);
    }

    const data = await response.json();
    let jsonString = data.text;

    // Limpieza básica por si el modelo devuelve bloques de markdown
    jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Fallback failed:", error);
    throw new Error("El servicio de respaldo también falló. Por favor intenta más tarde.");
  }
};

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
    // INTENTO 1: GEMINI (Cliente directo)
    console.log("Intentando generar con Gemini...");
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
    
    // Detectar errores recuperables (Quota, Overloaded, Service Unavailable)
    // O simplemente cualquier error para asegurar la experiencia de usuario
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Si es un error de sintaxis JSON de Gemini, o un error de red/cuota, probamos el fallback
    console.warn("Gemini falló. Activando protocolo de respaldo (Anthropic)...");
    
    try {
      // INTENTO 2: ANTHROPIC (Vía Vercel Function)
      return await callAnthropicFallback(base64Image, mimeType, prompt);
    } catch (fallbackError) {
        // Si ambos fallan, lanzamos el error original o uno genérico
        if (error instanceof SyntaxError) {
            throw new Error("La respuesta de la IA no fue válida.");
        }
        throw new Error("No se pudo generar el poema con ninguno de los servicios disponibles.");
    }
  }
};