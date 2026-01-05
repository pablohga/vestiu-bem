import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

/**
 * ============================
 * Utils — OAuth2 (Service Account)
 * ============================
 */

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function base64UrlEncode(obj: any): string {
  return btoa(JSON.stringify(obj))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function getAccessToken(): Promise<string> {
  const creds = JSON.parse(
    Deno.env.get("GOOGLE_VERTEX_CREDENTIALS")!
  );

  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: "RS256",
    typ: "JWT"
  };

  const payload = {
    iss: creds.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: creds.token_uri,
    iat: now,
    exp: now + 3600
  };

  const unsignedJWT =
    `${base64UrlEncode(header)}.${base64UrlEncode(payload)}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(creds.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsignedJWT)
  );

  const signedJWT =
    `${unsignedJWT}.${btoa(
      String.fromCharCode(...new Uint8Array(signature))
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")}`;

  const res = await fetch(creds.token_uri, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: signedJWT
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error("Erro ao obter access_token: " + err);
  }

  const json = await res.json();
  return json.access_token;
}

/**
 * ============================
 * Edge Function
 * ============================
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

serve(async (req) => {

  // Preflight CORS
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

    const projectId = Deno.env.get("GOOGLE_PROJECT_ID");
    const location =
      Deno.env.get("GOOGLE_VERTEX_LOCATION") || "us-central1";

    if (!projectId) {
      throw new Error("GOOGLE_PROJECT_ID não configurado");
    }

    // 🔐 OAuth2
    const accessToken = await getAccessToken();

    // 🎨 Nano Banana (imagem)
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/gemini-2.5-flash-image:generateContent`;

    const vertexResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text:
                  prompt ||
                  "Atue como um fotógrafo de moda profissional e editor de imagem. A primeira imagem fornecida é o 'Modelo' (pessoa). A segunda imagem fornecida é a 'Roupa' (peça de vestuário). TAREFA: Gere uma nova imagem fotorrealista de alta qualidade do 'Modelo' vestindo a 'Roupa'. REGRAS: 1. Mantenha as características faciais, tom de pele, tipo de corpo e pose do 'Modelo' o mais fiel possível. 2. Substitua a roupa original do 'Modelo' pela 'Roupa' fornecida. 3. A roupa deve se ajustar naturalmente ao corpo do modelo (caimento realista, dobras, iluminação). 4. Mantenha o fundo original se possível, ou use um fundo de estúdio neutro e elegante se o recorte for difícil. 5. Alta resolução, nítido, estilo Shein/Fashion Nova. PROMPT NEGATIVO: Evite: distorções faciais, mudança de identidade do modelo, rosto diferente, olhos desalinhados, boca torta, pele artificial, tom de pele alterado, corpo deformado, proporções irreais, membros extras, braços ou pernas faltando, mãos deformadas, dedos extras, dedos fundidos, mãos borradas, pose diferente da original, expressão facial alterada, roupa mal encaixada, roupa flutuando, roupa colada artificialmente, textura de tecido irreal, dobras incorretas, costuras erradas, sombras inconsistentes, iluminação irreal, reflexos estranhos, baixa resolução, imagem borrada, pixelização, ruído excessivo, arte digital, estilo cartoon, anime, ilustração, pintura, CGI, 3D render, aparência plástica, efeito boneca, fundo bagunçado, fundo distorcido, recortes visíveis, bordas serrilhadas, marcas d'água, textos, logotipos, branding, distorções de perspectiva."
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
        ]
      })
    });

    const result = await vertexResponse.json();

    if (!vertexResponse.ok) {
      console.error("Erro Vertex:", result);
      throw new Error(result.error?.message || "Erro no Vertex AI");
    }

    return new Response(
      JSON.stringify({ result }),
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
      JSON.stringify({ error: String(error) }),
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
