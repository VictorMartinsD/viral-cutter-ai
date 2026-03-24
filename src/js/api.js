import { generateId } from "./utils.js";

export const waitForTranscription = async (app, config) => {
  if (!app.public_id) {
    throw new Error("Nenhum public_id encontrado para buscar a transcrição.");
  }

  const maxAttempts = 30;
  const delayMs = 2000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const transcriptionURL = `https://res.cloudinary.com/${config.cloudName}/raw/upload/v${Date.now()}/${app.public_id}.transcript`;

    try {
      const response = await fetch(transcriptionURL, { cache: "no-store" });

      if (response.ok) {
        app.transcriptionURL = transcriptionURL;
        return transcriptionURL;
      }
    } catch (error) {
      console.warn(`Tentativa ${attempt} falhou ao verificar a transcrição.`, error);
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error("Transcrição não ficou pronta após 30 tentativas.");
};

export const getTranscription = async (transcriptionURL) => {
  const response = await fetch(transcriptionURL);
  return response.text();
};

export const getViralMoment = async (apiKey, transcription, priorityPrompt) => {
  const model = "gemini-3-flash-preview";
  const endpointGemini = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const headers = {
    "x-goog-api-key": apiKey,
    "Content-Type": "application/json",
  };

  const prompt = `
	Role: You are a professional video editor specializing in viral content.
	Task: Analyze the transcription below and identify the most engaging, funny, or surprising segment.
	Priority custom instructions:
	${priorityPrompt}

	Rule: Keep all base constraints below, but treat custom instructions as top priority whenever possible.

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
};

export const processWidgetResult = async (error, result, context) => {
  const {
    app,
    config,
    el,
    updateStatus,
    setVideoFrameLoading,
    setCurrentVideoTitle,
    saveSavedVideos,
    renderSavedVideos,
    handleUploadSuccessFeedback,
    getPriorityPromptBlock,
    waitForTranscriptionFn = waitForTranscription,
    getTranscriptionFn = getTranscription,
    getViralMomentFn = getViralMoment,
  } = context;

  if (error) {
    updateStatus("Erro ao abrir a caixa de upload.", false);
    return;
  }

  if (!result || result.event !== "success") {
    return;
  }

  app.public_id = result.info.public_id;
  updateStatus("Transcrevendo vídeo e selecionando melhor trecho...", true);

  try {
    const isReady = await waitForTranscriptionFn(app, config);
    if (!isReady) {
      throw new Error("erro ao buscar transcrição");
    }

    const transcription = await getTranscriptionFn(app.transcriptionURL);
    const priorityPrompt = getPriorityPromptBlock();
    const viralMoment = await getViralMomentFn(app.apiKeyRawValue, transcription, priorityPrompt);
    const viralMomentURL = `https://res.cloudinary.com/${config.cloudName}/video/upload/${viralMoment}/${app.public_id}.mp4`;
    const originalFileName = String(result.info.original_filename || app.public_id || "Vídeo").replace(/\.[^/.]+$/, "");
    const originalThumbnail = result.info.thumbnail_url || "";

    el.video.addEventListener(
      "loadeddata",
      () => {
        setVideoFrameLoading(false);
        updateStatus("Corte gerado com sucesso.", false);
        const label = originalFileName;
        setCurrentVideoTitle(label);

        const newVideo = {
          id: generateId("video"),
          name: originalFileName,
          public_id: app.public_id,
          clipUrl: viralMomentURL,
          thumbnailUrl: originalThumbnail,
          timestamp: Date.now(),
          isNew: true,
        };

        app.savedVideos = app.savedVideos.map((video) => ({ ...video, isNew: false }));
        app.savedVideos.unshift(newVideo);
        app.currentVideoId = newVideo.id;
        saveSavedVideos(app);
        renderSavedVideos();
        handleUploadSuccessFeedback(newVideo.id);
      },
      { once: true },
    );

    el.video.setAttribute("src", viralMomentURL);
  } catch (fetchError) {
    setVideoFrameLoading(false);
    updateStatus("Não foi possível gerar o corte agora. Tente novamente.", false);
    console.log({ fetchError });
  }
};
