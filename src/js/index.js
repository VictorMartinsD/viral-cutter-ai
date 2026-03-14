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

    const isReady = await app.waitForTranscription();
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
