import { GoogleGenAI } from "@google/genai";
import { Asset } from "../types";

// Using the mapped model ID for "nano banana" as per instructions
const MODEL_NAME = 'gemini-2.5-flash-image';

export const generateTryOnImage = async (
  userImage: Asset,
  clothingImage: Asset,
  userPrompt?: string
): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("API Key não encontrada. Configure a variável de ambiente API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Construct the prompt
  // We send two images: the user and the clothing.
  // We ask the model to combine them.
  const prompt = userPrompt || `
    Atue como um fotógrafo de moda profissional e editor de imagem.
    
    A primeira imagem fornecida é o "Modelo" (pessoa).
    A segunda imagem fornecida é a "Roupa" (peça de vestuário).
    
    TAREFA: Gere uma nova imagem fotorrealista de alta qualidade do "Modelo" vestindo a "Roupa".
    
    REGRAS:
    1. Mantenha as características faciais, tom de pele, tipo de corpo e pose do "Modelo" o mais fiel possível.
    2. Substitua a roupa original do "Modelo" pela "Roupa" fornecida.
    3. A roupa deve se ajustar naturalmente ao corpo do modelo (caimento realista, dobras, iluminação).
    4. Mantenha o fundo original se possível, ou use um fundo de estúdio neutro e elegante se o recorte for difícil.
    5. Alta resolução, nítido, estilo Shein/Fashion Nova.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: userImage.mimeType,
              data: userImage.data
            }
          },
          {
            inlineData: {
              mimeType: clothingImage.mimeType,
              data: clothingImage.data
            }
          },
          { text: prompt }
        ]
      },
      config: {
        // Nano Banana configuration
        // Using generateContent implies we might get text or image. 
        // Typically flash-image returns inlineData in the response parts.
      }
    });

    // Parse response
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error("Nenhuma imagem foi gerada.");
    }

    const parts = candidates[0].content.parts;
    let generatedImageBase64 = '';

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        generatedImageBase64 = part.inlineData.data;
        break;
      }
    }

    if (!generatedImageBase64) {
      // Sometimes models might refuse and return text explaining why.
      const textPart = parts.find(p => p.text);
      if (textPart) {
        throw new Error(`O modelo retornou texto ao invés de imagem: ${textPart.text}`);
      }
      throw new Error("Falha ao encontrar dados de imagem na resposta.");
    }

    return generatedImageBase64;

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Erro ao gerar a imagem.");
  }
};

export const fileToAsset = (file: File): Promise<Asset> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const data = base64String.split(',')[1];
      const mimeType = file.type;
      resolve({ mimeType, data });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
