import { generateId } from "./utils.js";

export const storageKeys = {
  prompts: "clipmaker-prompts-v1",
  promptConfigs: "clipmaker-prompt-configs-v1",
  activeConfigId: "clipmaker-active-config-id-v1",
  savedVideos: "clipmaker-saved-videos-v1",
};

export const savePromptState = (app) => {
  localStorage.setItem(storageKeys.prompts, JSON.stringify(app.prompts));
  localStorage.setItem(storageKeys.promptConfigs, JSON.stringify(app.promptConfigs));

  if (app.activeConfigId) {
    localStorage.setItem(storageKeys.activeConfigId, app.activeConfigId);
  } else {
    localStorage.removeItem(storageKeys.activeConfigId);
  }
};

export const loadPromptState = (app) => {
  try {
    const savedPrompts = JSON.parse(localStorage.getItem(storageKeys.prompts) || "[]");
    const savedConfigs = JSON.parse(localStorage.getItem(storageKeys.promptConfigs) || "[]");
    const savedActiveConfigId = localStorage.getItem(storageKeys.activeConfigId);

    app.prompts = Array.isArray(savedPrompts)
      ? savedPrompts
          .map((prompt) => ({
            id: prompt.id || generateId("prompt"),
            title: (prompt.title || "Prompt sem título").trim(),
            text: (prompt.text || "").trim(),
            active: Boolean(prompt.active),
          }))
          .filter((prompt) => prompt.text)
      : [];

    app.promptConfigs = Array.isArray(savedConfigs)
      ? savedConfigs.map((cfg) => ({
          id: cfg.id || generateId("config"),
          name: (cfg.name || "Configuração").trim(),
          promptIds: Array.isArray(cfg.promptIds) ? cfg.promptIds : [],
        }))
      : [];

    app.activeConfigId = savedActiveConfigId || null;
  } catch (error) {
    console.warn("Falha ao carregar prompts personalizados.", error);
    app.prompts = [];
    app.promptConfigs = [];
    app.activeConfigId = null;
  }
};

export const loadSavedVideos = (app) => {
  try {
    const stored = localStorage.getItem(storageKeys.savedVideos);
    if (stored) {
      const parsed = JSON.parse(stored);
      app.savedVideos = Array.isArray(parsed)
        ? parsed.map((video) => ({
            id: video.id || generateId("video"),
            name: String(video.name || "Vídeo"),
            public_id: video.public_id || "",
            clipUrl: video.clipUrl || "",
            thumbnailUrl: video.thumbnailUrl || "",
            timestamp: Number(video.timestamp || Date.now()),
            isNew: Boolean(video.isNew),
          }))
        : [];
    }
  } catch (error) {
    console.error("Erro ao carregar vídeos salvos:", error);
  }
};

export const saveSavedVideos = (app) => {
  localStorage.setItem(storageKeys.savedVideos, JSON.stringify(app.savedVideos));
};
