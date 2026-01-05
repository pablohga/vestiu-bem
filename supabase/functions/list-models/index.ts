import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai";

serve(async () => {
  const apiKey = Deno.env.get("GEMINI_API_KEY");

  if (!apiKey) {
    return new Response("GEMINI_API_KEY não configurada", { status: 500 });
  }

  const ai = new GoogleGenAI({ apiKey });

  const models = await ai.models.list();

  return new Response(
    JSON.stringify(models, null, 2),
    { headers: { "Content-Type": "application/json" } }
  );
});
