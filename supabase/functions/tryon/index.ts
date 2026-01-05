import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { VertexAI } from "npm:@google-cloud/vertexai";

serve(async (req) => {

  const origin = req.headers.get("origin") || "";

  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Credentials": "true"
  };

  // ✅ Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const { userImage, clothImage, prompt } = await req.json();

    if (!userImage || !clothImage) {
      return new Response(
        JSON.stringify({ error: "Imagens não fornecidas" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }

    const credentials = JSON.parse(
      Deno.env.get("GOOGLE_VERTEX_CREDENTIALS")!
    );

    const vertexAI = new VertexAI({
      project: Deno.env.get("GOOGLE_PROJECT_ID"),
      location: Deno.env.get("GOOGLE_VERTEX_LOCATION") || "us-central1",
      credentials
    });

    const model = vertexAI.preview.getGenerativeModel({
      model: "gemini-1.0-pro-vision"
    });

    const result = await model.generateContent([
      {
        role: "user",
        parts: [
          {
            text: prompt ||
              "Vista a roupa na pessoa de forma realista, mantendo proporções e iluminação naturais."
          },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: userImage
            }
          },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: clothImage
            }
          }
        ]
      }
    ]);

    return new Response(
      JSON.stringify({ result: result.response }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );

  } catch (error) {
    console.error("Erro TryOn:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao gerar try-on" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  }
});
