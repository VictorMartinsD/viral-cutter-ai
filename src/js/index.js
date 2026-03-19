/*
  AUTOR: Victor Martins
  DESCRICAO: Script principal para funcionalidades do site viral-cutter-ai.
*/

const el = {
  root: document.documentElement,
  body: document.body,
  status: document.getElementById("status"),
  videoNowTitle: document.getElementById("videoNowTitle"),
  video: document.getElementById("video"),
  videoFrame: document.getElementById("videoFrame"),
  apiKey: document.getElementById("apiKey"),
  button: document.getElementById("uploadWidget"),
  themeToggle: document.getElementById("themeToggle"),
  themeBulbOn: document.getElementById("themeBulbOn"),
  themeBulbOff: document.getElementById("themeBulbOff"),
  apiHelpButton: document.getElementById("apiHelpButton"),
  apiModal: document.getElementById("apiModal"),
  apiModalBackdrop: document.getElementById("apiModalBackdrop"),
  apiModalCard: document.getElementById("apiModalCard"),
  closeApiModal: document.getElementById("closeApiModal"),
  securityToggle: document.getElementById("securityToggle"),
  securityDetails: document.getElementById("securityDetails"),
  securityChevron: document.getElementById("securityChevron"),
  openPromptPanel: document.getElementById("openPromptPanel"),
  closePromptPanel: document.getElementById("closePromptPanel"),
  promptPanel: document.getElementById("promptPanel"),
  promptExamplesToggle: document.getElementById("promptExamplesToggle"),
  promptExamples: document.getElementById("promptExamples"),
  promptTitleInput: document.getElementById("promptTitleInput"),
  promptTextInput: document.getElementById("promptTextInput"),
  savePromptBtn: document.getElementById("savePromptBtn"),
  newPromptBtn: document.getElementById("newPromptBtn"),
  promptList: document.getElementById("promptList"),
  addPromptConfigBtn: document.getElementById("addPromptConfigBtn"),
  clearAllPromptsBtn: document.getElementById("clearAllPromptsBtn"),
  clearAllConfigsBtn: document.getElementById("clearAllConfigsBtn"),
  promptConfigList: document.getElementById("promptConfigList"),
  savedVideosList: document.getElementById("savedVideosList"),
  savedVideosSelectToggle: document.getElementById("savedVideosSelectToggle"),
  savedVideosSelectAll: document.getElementById("savedVideosSelectAll"),
  savedVideosDeselectAll: document.getElementById("savedVideosDeselectAll"),
  savedVideosDeleteSelected: document.getElementById("savedVideosDeleteSelected"),
};

const app = {
  transcriptionURL: "",
  public_id: "",
  widget: null,
  apiKeyRawValue: "",
  prompts: [],
  promptConfigs: [],
  editingPromptId: null,
  activeConfigId: null,
  savedVideos: [],
  selectedVideoIds: [],
  isVideoSelectionMode: false,
  currentVideoId: null,
};

const config = {
  cloudName: "df0kqv5py",
  uploadPreset: "upload_nlw",
};

const storageKeys = {
  prompts: "clipmaker-prompts-v1",
  promptConfigs: "clipmaker-prompt-configs-v1",
  activeConfigId: "clipmaker-active-config-id-v1",
  savedVideos: "clipmaker-saved-videos-v1",
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const updateStatus = (message, loading = false) => {
  el.status.textContent = message;
  el.status.classList.remove("status-loading", "status-success");

  if (loading) {
    el.status.classList.add("status-loading");
    return;
  }

  if (message.toLowerCase().includes("sucesso")) {
    el.status.classList.add("status-success");
  }
};

const setVideoFrameLoading = (isLoading) => {
  el.videoFrame.classList.toggle("video-loading", isLoading);
};

const syncThemeToggle = () => {
  const isDark = el.root.classList.contains("dark");
  el.themeBulbOn.classList.toggle("hidden", isDark);
  el.themeBulbOff.classList.toggle("hidden", !isDark);
  el.themeToggle.classList.toggle("text-amber-500", !isDark);
  el.themeToggle.classList.toggle("text-zinc-400", isDark);
};

const getWidgetStyles = () => {
  const isDark = el.root.classList.contains("dark");

  if (isDark) {
    return {
      palette: {
        window: "#0f172a",
        windowBorder: "#1d4ed8",
        tabIcon: "#bfdbfe",
        menuIcons: "#e0f2fe",
        textDark: "#f8fafc",
        textLight: "#dbeafe",
        link: "#93c5fd",
        action: "#fb923c",
        inactiveTabIcon: "#64748b",
        error: "#fda4af",
        inProgress: "#fde047",
        complete: "#22c55e",
        sourceBg: "#0b1120",
      },
    };
  }

  return {
    palette: {
      window: "#ecfeff",
      windowBorder: "#0ea5e9",
      tabIcon: "#0c4a6e",
      menuIcons: "#155e75",
      textDark: "#0f172a",
      textLight: "#334155",
      link: "#0369a1",
      action: "#0d9488",
      inactiveTabIcon: "#64748b",
      error: "#dc2626",
      inProgress: "#a16207",
      complete: "#16a34a",
      sourceBg: "#082f49",
    },
  };
};

const generateId = (prefix) => `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

const escapeHTML = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const truncateText = (text, maxLength = 65) => {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length > maxLength) {
    return trimmed.substring(0, maxLength) + "...";
  }
  return trimmed;
};

const truncatePromptTitle = (text) => {
  const isMobile = window.innerWidth < 768;
  const maxLength = isMobile ? 23 : 100;
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length > maxLength) {
    return trimmed.substring(0, maxLength) + "...";
  }
  return trimmed;
};

const truncateSavedPromptTitle = (text) => {
  const isMobile = window.innerWidth < 768;
  const maxLength = isMobile ? 16 : 100;
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length > maxLength) {
    return trimmed.substring(0, maxLength) + "...";
  }
  return trimmed;
};

const truncateVideoTitle = (text) => {
  const trimmed = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  const maxLength = isMobileViewport() ? 5 : 11;
  if (trimmed.length > maxLength) {
    return trimmed.substring(0, maxLength) + "...";
  }
  return trimmed;
};

const truncatePlayerVideoTitle = (text) => {
  const trimmed = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  const maxLength = isMobileViewport() ? 22 : 44;
  if (trimmed.length > maxLength) {
    return trimmed.substring(0, maxLength) + "...";
  }
  return trimmed;
};

const setCurrentVideoTitle = (title = "") => {
  if (!el.videoNowTitle) {
    return;
  }
  el.videoNowTitle.textContent = truncatePlayerVideoTitle(title);
};

const isMobileViewport = () => window.innerWidth < 768;

const getCloudinaryThumb = (video) => {
  if (video.thumbnailUrl) {
    return video.thumbnailUrl;
  }

  if (!video.public_id) {
    return "";
  }

  return `https://res.cloudinary.com/${config.cloudName}/video/upload/so_0,w_360,h_360,c_fill/${video.public_id}.jpg`;
};

const getSavedVideoURL = (video) => {
  if (video.clipUrl) {
    return video.clipUrl;
  }

  if (!video.public_id) {
    return "";
  }

  return `https://res.cloudinary.com/${config.cloudName}/video/upload/${video.public_id}.mp4`;
};

const getActivePromptIds = () => app.prompts.filter((prompt) => prompt.active).map((prompt) => prompt.id);

const savePromptState = () => {
  localStorage.setItem(storageKeys.prompts, JSON.stringify(app.prompts));
  localStorage.setItem(storageKeys.promptConfigs, JSON.stringify(app.promptConfigs));

  if (app.activeConfigId) {
    localStorage.setItem(storageKeys.activeConfigId, app.activeConfigId);
  } else {
    localStorage.removeItem(storageKeys.activeConfigId);
  }
};

const loadPromptState = () => {
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

const clearPromptEditor = () => {
  app.editingPromptId = null;
  el.promptTitleInput.value = "";
  el.promptTextInput.value = "";
  el.promptTextInput.setAttribute("rows", "3");
  el.savePromptBtn.textContent = "Salvar prompt";
  updatePromptInputLimits();
};

const updatePromptInputLimits = () => {
  const titleWidth = el.promptTitleInput.clientWidth || 280;
  const textWidth = el.promptTextInput.clientWidth || 280;
  const textHeight = el.promptTextInput.clientHeight || 96;

  const titleMaxLength = clamp(Math.round(titleWidth / 6.5), 28, 96);
  const textMaxLength = clamp(Math.round((textWidth * textHeight) / 16), 120, 900);

  el.promptTitleInput.maxLength = titleMaxLength;
  el.promptTextInput.maxLength = textMaxLength;

  if (el.promptTitleInput.value.length > titleMaxLength) {
    el.promptTitleInput.value = el.promptTitleInput.value.slice(0, titleMaxLength);
  }

  if (el.promptTextInput.value.length > textMaxLength) {
    el.promptTextInput.value = el.promptTextInput.value.slice(0, textMaxLength);
  }
};

const animateButtonPress = (buttonElement) => {
  gsap.fromTo(buttonElement, { scale: 1 }, { scale: 0.97, duration: 0.08, yoyo: true, repeat: 1, ease: "power1.out" });
};

const openPromptPanel = () => {
  gsap.killTweensOf(el.promptPanel);
  el.promptPanel.classList.remove("hidden");
  el.openPromptPanel.setAttribute("aria-expanded", "true");

  gsap.fromTo(
    el.promptPanel,
    { height: 0, autoAlpha: 0, y: -10 },
    {
      height: el.promptPanel.scrollHeight,
      autoAlpha: 1,
      y: 0,
      duration: 0.35,
      ease: "power2.out",
      onComplete: () => {
        el.promptPanel.style.height = "auto";
      },
    },
  );
};

const closePromptPanel = () => {
  gsap.killTweensOf(el.promptPanel);
  gsap.fromTo(
    el.promptPanel,
    { height: el.promptPanel.scrollHeight, autoAlpha: 1, y: 0 },
    {
      height: 0,
      autoAlpha: 0,
      y: -8,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        el.promptPanel.classList.add("hidden");
        el.promptPanel.style.height = "";
        el.openPromptPanel.setAttribute("aria-expanded", "false");
      },
    },
  );
};

const showPromptExamples = () => {
  gsap.killTweensOf(el.promptExamples);
  el.promptExamples.classList.remove("hidden");

  gsap.fromTo(
    el.promptExamples,
    { height: 0, autoAlpha: 0 },
    {
      height: el.promptExamples.scrollHeight,
      autoAlpha: 1,
      duration: 0.3,
      ease: "power2.out",
      onComplete: () => {
        el.promptExamples.style.height = "auto";
      },
    },
  );

  el.promptExamplesToggle.innerHTML = '<i data-lucide="sparkles" class="h-4 w-4"></i> Ocultar exemplos de prompts';
  lucide.createIcons();
};

const hidePromptExamples = () => {
  gsap.killTweensOf(el.promptExamples);

  gsap.fromTo(
    el.promptExamples,
    { height: el.promptExamples.scrollHeight, autoAlpha: 1 },
    {
      height: 0,
      autoAlpha: 0,
      duration: 0.26,
      ease: "power2.in",
      onComplete: () => {
        el.promptExamples.classList.add("hidden");
        el.promptExamples.style.height = "";
      },
    },
  );

  el.promptExamplesToggle.innerHTML = '<i data-lucide="sparkles" class="h-4 w-4"></i> Mostrar exemplos de prompts';
  lucide.createIcons();
};

const renderPromptList = () => {
  if (!app.prompts.length) {
    const emptyPromptText = isMobileViewport()
      ? "Nenhum prompt salvo ainda. Crie o primeiro no campo acima."
      : "Nenhum prompt salvo ainda. Crie o primeiro no campo ao lado.";

    el.promptList.innerHTML = `<p class="rounded-xl border border-dashed border-zinc-300 p-3 text-xs text-slate-600 dark:border-zinc-700 dark:text-zinc-400">${emptyPromptText}</p>`;

    return;
  }

  el.promptList.innerHTML = app.prompts
    .map(
      (prompt) => `
      <article class="prompt-item ${prompt.active ? "is-active" : ""}" data-prompt-id="${escapeHTML(prompt.id)}">
        ${prompt.active ? '<span class="prompt-active-badge">✓</span>' : ""}
        <div class="prompt-item-header">
          <span class="prompt-item-title" data-prompt-rename-id="${escapeHTML(prompt.id)}" title="${escapeHTML(prompt.title)}">${escapeHTML(truncateSavedPromptTitle(prompt.title))}</span>
        </div>

        <p class="prompt-snippet" title="${escapeHTML(prompt.text)}">${escapeHTML(truncateText(prompt.text))}</p>

        <div class="prompt-actions">
          <button type="button" class="prompt-chip-btn" data-prompt-toggle-id="${escapeHTML(prompt.id)}">
            ${prompt.active ? "Desativar" : "Ativar"}
          </button>
          <button type="button" class="prompt-chip-btn" data-prompt-edit-id="${escapeHTML(prompt.id)}">Editar</button>
          <button type="button" class="prompt-chip-btn" data-prompt-delete-id="${escapeHTML(prompt.id)}">Excluir</button>
        </div>
      </article>`,
    )
    .join("");
};

const renderConfigList = () => {
  if (!app.promptConfigs.length) {
    el.promptConfigList.innerHTML =
      '<p class="rounded-xl border border-dashed border-zinc-300 p-3 text-xs text-slate-600 dark:border-zinc-700 dark:text-zinc-400">Nenhuma configuração criada. Salve combinações para reutilizar em vários uploads.</p>';
    return;
  }

  const activePromptIds = getActivePromptIds();

  el.promptConfigList.innerHTML = app.promptConfigs
    .map((cfg) => {
      const isCurrent = cfg.id === app.activeConfigId;
      const promptTitles = cfg.promptIds
        .map((promptId) => app.prompts.find((prompt) => prompt.id === promptId)?.title)
        .filter(Boolean);
      const promptCount = promptTitles.length;
      const isSavable = activePromptIds.length > 0;
      const subtitleText = `${promptCount} prompt(s) nesta configuração`;

      return `
        <article class="config-card ${isCurrent ? "is-active" : ""}" data-config-id="${escapeHTML(cfg.id)}">
          ${isCurrent ? '<span class="config-active-badge">✓</span>' : ""}
          <div class="config-title config-title-editable" data-config-edit-inline="${escapeHTML(cfg.id)}" title="${escapeHTML(cfg.name)}">${escapeHTML(truncatePromptTitle(cfg.name))}</div>
          <p class="config-subtitle" title="${escapeHTML(promptTitles.join("\n") || "Sem prompts nesta configuração")}">${escapeHTML(subtitleText)}</p>

          <div class="prompt-actions">
            <button type="button" class="prompt-chip-btn" data-config-toggle-id="${escapeHTML(cfg.id)}">${
              isCurrent ? "Desativar" : "Ativar"
            }</button>
            <button type="button" class="prompt-chip-btn" data-config-delete-id="${escapeHTML(cfg.id)}">Excluir</button>
          </div>
        </article>`;
    })
    .join("");
};

const renderPromptUI = () => {
  renderPromptList();
  renderConfigList();
};

const loadSavedVideos = () => {
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

const saveSavedVideos = () => {
  localStorage.setItem(storageKeys.savedVideos, JSON.stringify(app.savedVideos));
};

const renderSavedVideos = () => {
  if (!app.savedVideos.length) {
    el.savedVideosList.innerHTML =
      '<p class="col-span-full rounded-xl border border-dashed border-zinc-300 p-3 text-xs text-slate-600 dark:border-zinc-700 dark:text-zinc-400 cursor-pointer" data-scroll-to-api-key>Nenhum vídeo salvo ainda. Carregue um vídeo para começar!</p>';

    // Scroll animation on empty message click
    const emptyMessage = el.savedVideosList.querySelector("[data-scroll-to-api-key]");
    if (emptyMessage) {
      emptyMessage.addEventListener("click", () => {
        gsap.to(window, {
          scrollTo: { y: "#apiKey", offsetY: 100 },
          duration: 0.28,
          ease: "power1.out",
        });
      });
    }

    updateVideoToolbarState();
    return;
  }

  el.savedVideosList.innerHTML = app.savedVideos
    .map(
      (video) => `
      <div class="saved-video-item ${app.selectedVideoIds.includes(video.id) ? "selected" : ""} ${app.currentVideoId === video.id ? "is-current" : ""}" data-video-id="${escapeHTML(video.id)}">
        <div class="saved-video-thumbnail">
          <img class="saved-video-thumb-img" src="${escapeHTML(getCloudinaryThumb(video))}" alt="Miniatura de ${escapeHTML(video.name)}" loading="lazy" />
          <button type="button" class="saved-video-close-btn" data-video-delete-id="${escapeHTML(video.id)}" title="Excluir">×</button>
          ${video.isNew ? '<div class="saved-video-new-badge">NOVO</div>' : ""}
          ${app.isVideoSelectionMode ? '<div class="saved-video-checkbox"></div>' : ""}
        </div>
        <p class="saved-video-title" title="${escapeHTML(video.name)}" data-video-title-id="${escapeHTML(video.id)}">${escapeHTML(truncateVideoTitle(video.name))}</p>
      </div>`,
    )
    .join("");
  lucide.createIcons();
  updateVideoToolbarState();
};

const playSavedVideo = (videoId) => {
  const targetVideo = app.savedVideos.find((video) => video.id === videoId);
  if (!targetVideo) {
    return;
  }

  const source = getSavedVideoURL(targetVideo);
  if (!source) {
    return;
  }

  setVideoFrameLoading(true);
  el.video.addEventListener(
    "loadeddata",
    () => {
      setVideoFrameLoading(false);
      app.currentVideoId = targetVideo.id;
      const label = targetVideo.name;
      setCurrentVideoTitle(label);
      renderSavedVideos();
    },
    { once: true },
  );
  el.video.setAttribute("src", source);
};

const updateVideoToolbarState = () => {
  const totalVideos = app.savedVideos.length;
  const selectedCount = app.selectedVideoIds.length;
  const hasSelection = selectedCount > 0;
  const canSelectToggle = totalVideos > 0;
  const canSelectAll = totalVideos > 0 && selectedCount < totalVideos;
  const canDeselectAll = app.isVideoSelectionMode && hasSelection;

  el.savedVideosSelectToggle.classList.toggle("active", app.isVideoSelectionMode);
  el.savedVideosSelectToggle.disabled = !canSelectToggle;
  el.savedVideosDeleteSelected.disabled = !(app.isVideoSelectionMode && hasSelection);
  el.savedVideosDeleteSelected.classList.toggle("active", app.isVideoSelectionMode && hasSelection);

  el.savedVideosSelectAll.disabled = !canSelectAll;
  el.savedVideosDeselectAll.disabled = !canDeselectAll;
};

const toggleVideoSelectionMode = () => {
  if (!app.savedVideos.length) {
    updateVideoToolbarState();
    return;
  }

  app.isVideoSelectionMode = !app.isVideoSelectionMode;
  app.selectedVideoIds = [];
  updateVideoToolbarState();
  renderSavedVideos();
};

const deleteSelectedVideos = () => {
  if (!app.selectedVideoIds.length) return;

  const accepted = confirm(`Deseja excluir ${app.selectedVideoIds.length} vídeo(s)?`);
  if (!accepted) return;

  app.savedVideos = app.savedVideos.filter((v) => !app.selectedVideoIds.includes(v.id));
  app.selectedVideoIds = [];
  saveSavedVideos();
  renderSavedVideos();
  updateVideoToolbarState();
};

const createPrompt = () => {
  const titleRaw = el.promptTitleInput.value.trim();
  const text = el.promptTextInput.value.trim();

  if (!text) {
    alert("Digite uma instrução para salvar o prompt.");
    el.promptTextInput.focus();
    return;
  }

  const title = titleRaw || `Prompt ${app.prompts.length + 1}`;

  app.prompts.push({
    id: generateId("prompt"),
    title,
    text,
    active: true,
  });

  app.activeConfigId = null;
  savePromptState();
  renderPromptUI();
  clearPromptEditor();
};

const updatePrompt = () => {
  const targetPrompt = app.prompts.find((prompt) => prompt.id === app.editingPromptId);
  if (!targetPrompt) {
    clearPromptEditor();
    return;
  }

  const titleRaw = el.promptTitleInput.value.trim();
  const text = el.promptTextInput.value.trim();

  if (!text) {
    alert("Digite uma instrução para salvar o prompt.");
    el.promptTextInput.focus();
    return;
  }

  targetPrompt.title = titleRaw || targetPrompt.title || "Prompt sem título";
  targetPrompt.text = text;

  savePromptState();
  renderPromptUI();
  clearPromptEditor();
};

const createConfig = () => {
  const defaultName = `Configuração ${app.promptConfigs.length + 1}`;
  app.promptConfigs.push({
    id: generateId("config"),
    name: defaultName,
    promptIds: [],
  });

  savePromptState();
  renderConfigList();
};

const saveCurrentSelectionToConfig = (configId) => {
  const targetConfig = app.promptConfigs.find((cfg) => cfg.id === configId);
  if (!targetConfig) {
    return;
  }

  const activePromptIds = getActivePromptIds();
  if (!activePromptIds.length) {
    alert("Ative ao menos um prompt para salvar na configuração.");
    return;
  }

  targetConfig.promptIds = [...activePromptIds];
  app.activeConfigId = targetConfig.id;
  savePromptState();
  renderConfigList();
};

const applyConfig = (configId) => {
  const targetConfig = app.promptConfigs.find((cfg) => cfg.id === configId);
  if (!targetConfig) {
    return;
  }

  const promptIdSet = new Set(targetConfig.promptIds);
  app.prompts.forEach((prompt) => {
    prompt.active = promptIdSet.has(prompt.id);
  });

  app.activeConfigId = targetConfig.id;
  savePromptState();
  renderPromptUI();
};

const deactivateConfig = () => {
  app.activeConfigId = null;
  app.prompts.forEach((prompt) => {
    prompt.active = false;
  });

  savePromptState();
  renderPromptUI();
};

const toggleConfigActivation = (configId) => {
  if (app.activeConfigId === configId) {
    deactivateConfig();
    return;
  }

  applyConfig(configId);
};

const clearAllPrompts = () => {
  const accepted = confirm("Deseja realmente apagar todos os prompts salvos?");
  if (!accepted) {
    return;
  }

  app.prompts = [];
  app.promptConfigs = app.promptConfigs.map((cfg) => ({ ...cfg, promptIds: [] }));
  app.activeConfigId = null;
  app.editingPromptId = null;

  savePromptState();
  renderPromptUI();
  clearPromptEditor();
};

const clearAllConfigs = () => {
  const accepted = confirm("Deseja realmente apagar todas as configurações salvas?");
  if (!accepted) {
    return;
  }

  app.promptConfigs = [];
  app.activeConfigId = null;

  savePromptState();
  renderConfigList();
};

const getPriorityPromptBlock = () => {
  const activePrompts = app.prompts.filter((prompt) => prompt.active && prompt.text.trim());

  if (!activePrompts.length) {
    return "No extra priority instructions provided by the user.";
  }

  return activePrompts
    .map((prompt, index) => `${index + 1}. Prioritize this user instruction: ${prompt.text.trim()}`)
    .join("\n");
};

const openApiModal = () => {
  gsap.killTweensOf([el.apiModalBackdrop, el.apiModalCard]);
  el.apiModal.classList.remove("hidden");
  el.body.classList.add("overflow-hidden");

  gsap.fromTo(el.apiModalBackdrop, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, ease: "power1.out" });
  gsap.fromTo(
    el.apiModalCard,
    { y: 20, scale: 0.97, autoAlpha: 0 },
    { y: 0, scale: 1, autoAlpha: 1, duration: 0.28, ease: "power2.out" },
  );
};

const closeApiModal = () => {
  gsap.killTweensOf([el.apiModalBackdrop, el.apiModalCard]);

  gsap.to(el.apiModalBackdrop, { autoAlpha: 0, duration: 0.18, ease: "power1.in" });
  gsap.to(el.apiModalCard, {
    y: 16,
    scale: 0.97,
    autoAlpha: 0,
    duration: 0.22,
    ease: "power2.in",
    onComplete: () => {
      el.apiModal.classList.add("hidden");
      el.body.classList.remove("overflow-hidden");
    },
  });
};

const renderApiMask = () => {
  el.apiKey.value = "*".repeat(app.apiKeyRawValue.length);
};

const waitForTranscription = async () => {
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

const getTranscription = async () => {
  const response = await fetch(app.transcriptionURL);
  return response.text();
};

const getViralMoment = async () => {
  const transcription = await getTranscription();
  const priorityPrompt = getPriorityPromptBlock();
  const model = "gemini-3-flash-preview";
  const endpointGemini = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const headers = {
    "x-goog-api-key": app.apiKeyRawValue,
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

const processWidgetResult = async (error, result) => {
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
    const isReady = await waitForTranscription();
    if (!isReady) {
      throw new Error("erro ao buscar transcrição");
    }

    const viralMoment = await getViralMoment();
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

        // Save video to saved videos list
        const newVideo = {
          id: generateId("video"),
          name: originalFileName,
          public_id: app.public_id,
          clipUrl: viralMomentURL,
          thumbnailUrl: originalThumbnail,
          timestamp: Date.now(),
          isNew: true,
        };

        app.savedVideos.unshift(newVideo);
        app.currentVideoId = newVideo.id;
        saveSavedVideos();
        renderSavedVideos();

        // Remove "new" badge after 5 seconds
        setTimeout(() => {
          const savedVideo = app.savedVideos.find((v) => v.id === newVideo.id);
          if (savedVideo) {
            savedVideo.isNew = false;
            saveSavedVideos();
            renderSavedVideos();
          }
        }, 5000);
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

const openWidget = () => {
  app.widget = cloudinary.createUploadWidget(
    {
      ...config,
      styles: getWidgetStyles(),
    },
    processWidgetResult,
  );
  app.widget.open();
};

lucide.createIcons();
syncThemeToggle();
renderApiMask();
loadPromptState();
loadSavedVideos();
renderPromptUI();
renderSavedVideos();
clearPromptEditor();
updatePromptInputLimits();
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

gsap.fromTo(
  ".hero-word",
  { y: 40, autoAlpha: 0 },
  {
    y: 0,
    autoAlpha: 1,
    duration: 0.9,
    stagger: 0.08,
    ease: "power4.out",
    delay: 0.12,
  },
);

gsap.utils.toArray(".reveal").forEach((item, index) => {
  gsap.fromTo(
    item,
    { y: 24, autoAlpha: 0 },
    {
      y: 0,
      autoAlpha: 1,
      duration: 0.72,
      delay: index * 0.04,
      ease: "power2.out",
      scrollTrigger: {
        trigger: item,
        start: "top 86%",
        once: true,
      },
    },
  );
});

ScrollTrigger.create({
  trigger: "#beneficios",
  start: "top 70%",
  once: true,
  onEnter: () => {
    gsap.fromTo(
      ".benefit-word",
      { y: 40, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 0.75,
        stagger: 0.07,
        ease: "power3.out",
      },
    );
  },
});

el.themeToggle.addEventListener("click", () => {
  el.root.classList.toggle("dark");
  localStorage.setItem("clipmaker-theme", el.root.classList.contains("dark") ? "dark" : "light");
  syncThemeToggle();
  if (app.widget) {
    app.widget.destroy();
    app.widget = null;
  }
});

el.apiHelpButton.addEventListener("click", openApiModal);
el.closeApiModal.addEventListener("click", closeApiModal);
el.apiModalBackdrop.addEventListener("click", closeApiModal);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !el.apiModal.classList.contains("hidden")) {
    closeApiModal();
    return;
  }

  if (event.key === "Escape" && !el.promptPanel.classList.contains("hidden")) {
    closePromptPanel();
  }
});

el.openPromptPanel.addEventListener("click", () => {
  const isHidden = el.promptPanel.classList.contains("hidden");
  if (isHidden) {
    openPromptPanel();
    return;
  }

  closePromptPanel();
});

el.closePromptPanel.addEventListener("click", closePromptPanel);

el.promptExamplesToggle.addEventListener("click", () => {
  const isHidden = el.promptExamples.classList.contains("hidden");
  if (isHidden) {
    showPromptExamples();
    return;
  }

  hidePromptExamples();
});

el.savePromptBtn.addEventListener("click", () => {
  if (app.editingPromptId) {
    updatePrompt();
    return;
  }

  createPrompt();
});

el.newPromptBtn.addEventListener("click", () => {
  const hasDraft = Boolean(el.promptTitleInput.value.trim() || el.promptTextInput.value.trim());
  if (hasDraft) {
    const accepted = confirm("Seu prompt não foi salvo! Deseja apagar e criar um novo?");
    if (!accepted) {
      return;
    }
  }

  clearPromptEditor();
});

el.addPromptConfigBtn.addEventListener("click", createConfig);
el.clearAllPromptsBtn.addEventListener("click", clearAllPrompts);
el.clearAllConfigsBtn.addEventListener("click", clearAllConfigs);

el.promptList.addEventListener("click", (event) => {
  const toggleId = event.target.getAttribute("data-prompt-toggle-id");
  if (toggleId) {
    const targetPrompt = app.prompts.find((prompt) => prompt.id === toggleId);
    if (targetPrompt) {
      targetPrompt.active = !targetPrompt.active;
      app.activeConfigId = null;
      savePromptState();
      renderPromptUI();
    }
    return;
  }

  const renameId = event.target.getAttribute("data-prompt-rename-id");
  if (renameId) {
    const targetPrompt = app.prompts.find((prompt) => prompt.id === renameId);
    if (!targetPrompt) {
      return;
    }

    const titleElement = event.target;
    const originalName = targetPrompt.title;

    const input = document.createElement("input");
    input.type = "text";
    input.value = originalName;
    input.className = "prompt-title-input";
    input.maxLength = 100;

    titleElement.replaceWith(input);
    input.focus();
    input.select();

    const saveEdit = () => {
      const newName = input.value.trim();
      if (newName && newName !== originalName) {
        targetPrompt.title = newName;
        savePromptState();
      }
      renderPromptUI();
    };

    input.addEventListener("blur", saveEdit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        saveEdit();
      } else if (e.key === "Escape") {
        renderPromptUI();
      }
    });
    return;
  }

  const editId = event.target.getAttribute("data-prompt-edit-id");
  if (editId) {
    const targetPrompt = app.prompts.find((prompt) => prompt.id === editId);
    if (!targetPrompt) {
      return;
    }

    app.editingPromptId = targetPrompt.id;
    el.promptTitleInput.value = targetPrompt.title;
    el.promptTextInput.value = targetPrompt.text;
    el.promptTextInput.setAttribute("rows", "10");
    el.savePromptBtn.textContent = "Atualizar prompt";
    openPromptPanel();
    el.promptTextInput.focus();
    return;
  }

  const deleteId = event.target.getAttribute("data-prompt-delete-id");
  if (deleteId) {
    const targetPrompt = app.prompts.find((prompt) => prompt.id === deleteId);
    if (!targetPrompt) {
      return;
    }

    const accepted = confirm(`Excluir o prompt "${targetPrompt.title}"?`);
    if (!accepted) {
      return;
    }

    app.prompts = app.prompts.filter((prompt) => prompt.id !== deleteId);
    app.promptConfigs = app.promptConfigs.map((cfg) => ({
      ...cfg,
      promptIds: cfg.promptIds.filter((id) => id !== deleteId),
    }));

    if (app.editingPromptId === deleteId) {
      clearPromptEditor();
    }

    savePromptState();
    renderPromptUI();
    return;
  }

  // Click anywhere on the card (but not on buttons) to toggle
  const articleElement = event.target.closest("article[data-prompt-id]");
  if (articleElement && !event.target.closest("button")) {
    const promptId = articleElement.getAttribute("data-prompt-id");
    const targetPrompt = app.prompts.find((prompt) => prompt.id === promptId);
    if (targetPrompt) {
      targetPrompt.active = !targetPrompt.active;
      app.activeConfigId = null;
      savePromptState();
      renderPromptUI();
    }
  }
});

el.promptConfigList.addEventListener("click", (event) => {
  const toggleId = event.target.getAttribute("data-config-toggle-id");
  if (toggleId) {
    toggleConfigActivation(toggleId);
    return;
  }

  const editInlineId = event.target.getAttribute("data-config-edit-inline");
  if (editInlineId) {
    const targetConfig = app.promptConfigs.find((cfg) => cfg.id === editInlineId);
    if (!targetConfig) {
      return;
    }

    const titleElement = event.target;
    const originalName = targetConfig.name;

    const input = document.createElement("input");
    input.type = "text";
    input.value = originalName;
    input.className = "config-title-input";

    titleElement.replaceWith(input);
    input.focus();
    input.select();

    const saveEdit = () => {
      const newName = input.value.trim();
      if (newName && newName !== originalName) {
        targetConfig.name = newName;
        savePromptState();
      }
      renderConfigList();
    };

    input.addEventListener("blur", saveEdit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        saveEdit();
      } else if (e.key === "Escape") {
        renderConfigList();
      }
    });
    return;
  }

  const deleteId = event.target.getAttribute("data-config-delete-id");
  if (deleteId) {
    const targetConfig = app.promptConfigs.find((cfg) => cfg.id === deleteId);
    if (!targetConfig) {
      return;
    }

    const accepted = confirm(`Excluir a configuração "${targetConfig.name}"?`);
    if (!accepted) {
      return;
    }

    app.promptConfigs = app.promptConfigs.filter((cfg) => cfg.id !== deleteId);
    if (app.activeConfigId === deleteId) {
      app.activeConfigId = null;
    }

    savePromptState();
    renderConfigList();
    return;
  }

  // Click anywhere on the card (but not on buttons) to toggle
  const articleElement = event.target.closest("article[class*='config-card']");
  if (articleElement && !event.target.closest("button") && !event.target.closest("input")) {
    const configId = articleElement.getAttribute("data-config-id");
    if (configId) {
      toggleConfigActivation(configId);
    }
  }
});

el.securityToggle.addEventListener("click", () => {
  const isOpen = el.securityDetails.classList.contains("hidden");

  if (isOpen) {
    el.securityDetails.classList.remove("hidden");
    gsap.fromTo(
      el.securityDetails,
      { height: 0, autoAlpha: 0 },
      {
        height: el.securityDetails.scrollHeight,
        autoAlpha: 1,
        duration: 0.35,
        ease: "power2.out",
        onComplete: () => {
          el.securityDetails.style.height = "auto";
        },
      },
    );
  } else {
    gsap.to(el.securityDetails, {
      height: 0,
      autoAlpha: 0,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        el.securityDetails.classList.add("hidden");
        el.securityDetails.style.height = "";
      },
    });
  }

  el.securityChevron.setAttribute("data-lucide", isOpen ? "chevron-up" : "chevron-down");
  lucide.createIcons();

  if (isOpen) {
    setTimeout(() => {
      el.securityDetails.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 120);
  }
});

el.apiKey.addEventListener("keydown", (event) => {
  const isModifier = event.ctrlKey || event.metaKey || event.altKey;
  if (isModifier && ["a", "c", "x", "v"].includes(event.key.toLowerCase())) {
    return;
  }

  if (event.key === "Backspace") {
    const selectionIsAll =
      el.apiKey.selectionStart === 0 && el.apiKey.selectionEnd === el.apiKey.value.length && el.apiKey.value.length > 0;

    if (selectionIsAll) {
      app.apiKeyRawValue = "";
      renderApiMask();
      event.preventDefault();
      return;
    }

    app.apiKeyRawValue = app.apiKeyRawValue.slice(0, -1);
    renderApiMask();
    event.preventDefault();
    return;
  }

  if (event.key === "Delete") {
    app.apiKeyRawValue = "";
    renderApiMask();
    event.preventDefault();
    return;
  }

  if (
    event.key === "Tab" ||
    event.key === "Enter" ||
    event.key === "Escape" ||
    event.key.startsWith("Arrow") ||
    event.key === "Home" ||
    event.key === "End"
  ) {
    return;
  }

  if (event.key.length === 1) {
    app.apiKeyRawValue += event.key;
    renderApiMask();
    event.preventDefault();
  }
});

el.apiKey.addEventListener("paste", (event) => {
  event.preventDefault();
  const pastedText = (event.clipboardData || window.clipboardData).getData("text").trim();

  if (pastedText) {
    app.apiKeyRawValue += pastedText;
    renderApiMask();
  }
});

el.apiKey.addEventListener("focus", () => {
  requestAnimationFrame(() => {
    const length = el.apiKey.value.length;
    el.apiKey.setSelectionRange(length, length);
  });
});

el.button.addEventListener("click", () => {
  if (!app.apiKeyRawValue) {
    alert("Por favor, insira sua API do Gemini primeiro.");
    el.apiKey.focus();
    return;
  }

  animateButtonPress(el.button);

  updateStatus("Abrindo caixa para envio de vídeo...", true);
  setVideoFrameLoading(true);
  openWidget();
});

el.apiHelpButton.addEventListener("click", () => {
  animateButtonPress(el.apiHelpButton);
});

window.addEventListener("resize", updatePromptInputLimits, { passive: true });
window.addEventListener(
  "resize",
  () => {
    renderPromptUI();
    updateVideoToolbarState();
  },
  { passive: true },
);

el.savedVideosSelectToggle.addEventListener("click", toggleVideoSelectionMode);
el.savedVideosSelectAll.addEventListener("click", () => {
  if (el.savedVideosSelectAll.disabled) {
    return;
  }

  if (!app.isVideoSelectionMode) {
    app.isVideoSelectionMode = true;
  }

  app.selectedVideoIds = app.savedVideos.map((v) => v.id);
  updateVideoToolbarState();
  renderSavedVideos();
});
el.savedVideosDeselectAll.addEventListener("click", () => {
  if (!app.isVideoSelectionMode || el.savedVideosDeselectAll.disabled) {
    return;
  }
  app.selectedVideoIds = [];
  updateVideoToolbarState();
  renderSavedVideos();
});
el.savedVideosDeleteSelected.addEventListener("click", deleteSelectedVideos);

el.savedVideosList.addEventListener("click", (event) => {
  // Handle video title rename
  const titleElement = event.target.closest(".saved-video-title");
  if (titleElement && !app.isVideoSelectionMode) {
    const videoId = titleElement.getAttribute("data-video-title-id");
    const video = app.savedVideos.find((v) => v.id === videoId);
    if (!video) return;

    const originalName = video.name;
    const input = document.createElement("input");
    input.type = "text";
    input.value = originalName;
    input.className = "saved-video-title-input";
    input.maxLength = 100;

    titleElement.replaceWith(input);
    input.focus();
    input.select();

    const saveEdit = () => {
      const newName = input.value.trim();
      if (newName && newName !== originalName) {
        video.name = newName;
        saveSavedVideos();
      }
      renderSavedVideos();
    };

    input.addEventListener("blur", saveEdit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        saveEdit();
      } else if (e.key === "Escape") {
        renderSavedVideos();
      }
    });
    return;
  }

  // Handle individual video delete
  const deleteButton = event.target.closest("[data-video-delete-id]");
  if (deleteButton) {
    const videoId = deleteButton.getAttribute("data-video-delete-id");
    const video = app.savedVideos.find((v) => v.id === videoId);
    if (!video) return;

    const accepted = confirm(`Excluir o vídeo "${video.name}"?`);
    if (!accepted) return;

    app.savedVideos = app.savedVideos.filter((v) => v.id !== videoId);
    saveSavedVideos();
    renderSavedVideos();
    return;
  }

  // Handle video selection in selection mode
  const videoItem = event.target.closest(".saved-video-item");
  if (!videoItem) return;

  const videoId = videoItem.getAttribute("data-video-id");
  if (!app.isVideoSelectionMode) {
    if (
      !event.target.closest(".saved-video-title") &&
      !event.target.closest(".saved-video-title-input") &&
      !event.target.closest("[data-video-delete-id]")
    ) {
      playSavedVideo(videoId);
    }
    return;
  }

  if (app.selectedVideoIds.includes(videoId)) {
    app.selectedVideoIds = app.selectedVideoIds.filter((id) => id !== videoId);
  } else {
    app.selectedVideoIds.push(videoId);
  }
  updateVideoToolbarState();
  renderSavedVideos();
});

let scrollDebounce;
window.addEventListener(
  "scroll",
  () => {
    el.body.classList.add("is-scrolling");
    clearTimeout(scrollDebounce);
    scrollDebounce = setTimeout(() => {
      el.body.classList.remove("is-scrolling");
    }, 130);
  },
  { passive: true },
);
