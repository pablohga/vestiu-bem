import { Asset } from "../types";
import { supabase } from "./supabase";

/**
 * Converte File em Asset (Base64)
 * ⚠️ Continua sendo usado pelo TryOn.tsx
 */
export const fileToAsset = (file: File): Promise<Asset> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const data = base64String.split(",")[1]; // remove prefixo data:image/*
      resolve({
        mimeType: file.type,
        data
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Proxy para Supabase Edge Function (Vertex AI)
 */
export const generateTryOnImage = async (
  userImage: Asset,
  clothingImage: Asset,
  userPrompt?: string
): Promise<string> => {

  const { data: sessionData } = await supabase.auth.getSession();

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tryon`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionData.session?.access_token}`
      },
      body: JSON.stringify({
        userImage: userImage.data,
        clothImage: clothingImage.data,
        prompt: userPrompt
      })
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Erro ao gerar imagem");
  }

  const data = await response.json();

  const parts = data.result?.candidates?.[0]?.content?.parts;
  if (!parts) {
    throw new Error("Resposta inválida da IA");
  }

  const imagePart = parts.find((p: any) => p.inlineData?.data);
  if (!imagePart) {
    throw new Error("Nenhuma imagem foi gerada pela IA");
  }

  return imagePart.inlineData.data;
};
