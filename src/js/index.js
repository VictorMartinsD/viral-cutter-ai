/*
  AUTOR: Victor Martins
  DESCRIÇÃO: Script principal para funcionalidades do site viral-cutter-ai.
*/

// 1. Variáveis Globais e Seletores de Elementos
const app = {
  transcriptionURL: "",
  public_id: "",
  waitForTranscription: async () => {
    if (!app.public_id) {
      throw new Error("Nenhum public_id encontrado para buscar a transcricao.");
    }

    const maxAttempts = 30;
    const delayMs = 2000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const transcriptionURL = `https://res.cloudinary.com/${config.cloudName}/raw/upload/v${Date.now()}/${app.public_id}.transcript`;

      try {
        const response = await fetch(transcriptionURL, { cache: "no-store" });

        if (response.ok) {
          console.log("✅ Transcrição encontrada com sucesso!", transcriptionURL);
          app.transcriptionURL = transcriptionURL;
          return transcriptionURL;
        }
      } catch (error) {
        console.warn(`Tentativa ${attempt} falhou ao verificar a transcricao.`, error);
      }

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    throw new Error("Transcricao nao ficou pronta apos 30 tentativas.");
  },
  getTranscription: async () => {
    const response = await fetch(app.transcriptionURL);
    return response.text();
  },
  getViralMoment: async () => {
    const transcription = await app.getTranscription();
    const model = "gemini-3-flash-preview";
    const endpointGemini = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const headers = {
      "x-goog-api-key": "AIzaSyDS8CnLqFljQMfL6cqGqWNFqW1x0RfXFJU",
      "Content-Type": "application/json",
    };

    const prompt = `
    Role: You are a professional video editor specializing in viral content.
    Task: Analyze the transcription below and indentify the most engaging, funny, or surprising segment.
    Constraints:
    1. Duration: Minimum 30 seconds, Maximum 60 seconds.
    2. Format: Return ONLY the start and end string for Cloudinary. Format: so_<start_seconds>,eo_<end_seconds>
    3. Examples: "so_10,eo_20" or "so_12.5,eo_45.2"
    4. CRITICAL: Do not use markdown, do not use quotes, do not explain. Return ONLY the raw string.

    Transcription:
    ${transcription}`;

    const contents = [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ];

    const maxRetries = 3;
    const retryDelayMs = 1500;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(endpointGemini, {
          method: "POST",
          headers,
          body: JSON.stringify({ contents }),
        });

        if (!response.ok) {
          throw new Error(`Gemini retornou HTTP ${response.status}`);
        }

        const data = await response.json();
        const rawText = data.candidates[0].content.parts[0].text;
        return rawText.replace(/```/g, "").replace(/json/g, "").trim();
      } catch (error) {
        lastError = error;

        // Retry apenas para erros de conexão/rede.
        const isNetworkError = error instanceof TypeError;
        if (!isNetworkError || attempt === maxRetries) {
          throw error;
        }

        console.warn(
          `Falha de conexao com Gemini (tentativa ${attempt}/${maxRetries}). Nova tentativa em ${retryDelayMs}ms.`,
          error,
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }

    throw lastError;
  },
};

const config = {
  cloudName: "df0kqv5py",
  uploadPreset: "upload_nlw",
};

// 2. Funções Principais
const myWidget = cloudinary.createUploadWidget(config, async (error, result) => {
  if (!error && result && result.event === "success") {
    console.log("Done! Here is the image info: ", result.info);
    app.public_id = result.info.public_id;

    try {
      const isReady = await app.waitForTranscription();
      if (!isReady) {
        throw new Error("erro ao buscar transcrição");
      }

      const viralMoment = await app.getViralMoment(); //so_12.5,eo_45.2
      const viralMomentURL = `https://res.cloudinary.com/${config.cloudName}/video/upload/${viralMoment}/${app.public_id}.mp4`;
      console.log({ viralMoment });
    } catch (error) {
      console.log({ error });
    }
  }
});

// 3. Eventos (Clicks, Forms, etc)
document.getElementById("upload_widget").addEventListener(
  "click",
  function () {
    myWidget.open();
  },
  false,
);
