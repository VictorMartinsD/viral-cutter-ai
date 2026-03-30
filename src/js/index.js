import { generateId, escapeHTML, truncateText, truncatePlayerVideoTitle } from "./utils.js";
import { initTheme } from "./theme.js";
import { waitForTranscription, getTranscription, getViralMoment, processWidgetResult } from "./api.js";
import { storageKeys, savePromptState, loadPromptState, loadSavedVideos, saveSavedVideos } from "./storage.js";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (prefersReducedMotion) {
  gsap.globalTimeline.timeScale(100);
  gsap.defaults({ duration: 0 });
}

const el = {
  root: document.documentElement,
  body: document.body,
  status: document.getElementById("status"),
  videoNowTitle: document.getElementById("videoNowTitle"),
  video: document.getElementById("video"),
  videoFrame: document.getElementById("videoFrame"),
  apiKey: document.getElementById("apiKey"),
  apiKeyVisibilityToggle: document.getElementById("apiKeyVisibilityToggle"),
  apiKeyVisibilityIcon: document.getElementById("apiKeyVisibilityIcon"),
  button: document.getElementById("uploadWidget"),
  apiHelpButton: document.getElementById("apiHelpButton"),
  apiModal: document.getElementById("apiModal"),
  apiModalBackdrop: document.getElementById("apiModalBackdrop"),
  apiModalCard: document.getElementById("apiModalCard"),
  closeApiModal: document.getElementById("closeApiModal"),
  customDialog: document.getElementById("customDialog"),
  customDialogCard: document.getElementById("customDialogCard"),
  customDialogTitle: document.getElementById("customDialogTitle"),
  customDialogMessage: document.getElementById("customDialogMessage"),
  customDialogCancel: document.getElementById("customDialogCancel"),
  customDialogConfirm: document.getElementById("customDialogConfirm"),
  customDialogActions: document.querySelector("#customDialog .custom-dialog-actions"),
  securityToggle: document.getElementById("securityToggle"),
  securityDetails: document.getElementById("securityDetails"),
  securityChevron: document.getElementById("securityChevron"),
  openPromptPanel: document.getElementById("openPromptPanel"),
  closePromptPanel: document.getElementById("closePromptPanel"),
  promptPanel: document.getElementById("promptPanel"),
  promptExamplesToggle: document.getElementById("promptExamplesToggle"),
  promptExamples: document.getElementById("promptExamples"),
  promptEditorContainer: document.getElementById("promptEditorContainer"),
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
  isApiKeyVisible: false,
  prompts: [],
  promptConfigs: [],
  editingPromptId: null,
  activeConfigId: null,
  savedVideos: [],
  selectedVideoIds: [],
  isVideoSelectionMode: false,
  currentVideoId: null,
  latestUploadedVideoId: null,
  newBadgeAnimationPendingId: null,
  isSuccessJumpBarVisible: false,
  dialogResolver: null,
  dialogIsClosing: false,
};

const config = {
  cloudName: "df0kqv5py",
  uploadPreset: "upload_nlw",
};

const INPUT_LIMITS = {
  promptTitle: 60,
  promptText: 2000,
  videoTitle: 120,
  apiKey: 150,
};

const debounce = (callback, wait = 120) => {
  let timeoutId;

  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      callback(...args);
    }, wait);
  };
};

const throttle = (callback, wait = 80) => {
  let isThrottled = false;
  let pendingArgs = null;

  return (...args) => {
    if (isThrottled) {
      pendingArgs = args;
      return;
    }

    callback(...args);
    isThrottled = true;

    setTimeout(() => {
      isThrottled = false;
      if (!pendingArgs) {
        return;
      }

      const nextArgs = pendingArgs;
      pendingArgs = null;
      callback(...nextArgs);
    }, wait);
  };
};

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

const isWideViewportForSuccessBar = () => window.innerWidth > 789;

const scrollToSelectorWithOffset = (selector, offsetY = 0) => {
  const targetElement = document.querySelector(selector);
  if (!targetElement) {
    return;
  }

  const targetY = Math.max(0, window.scrollY + targetElement.getBoundingClientRect().top - offsetY);
  window.scrollTo({ top: targetY });
};

const scrollToVideoFrame = () => {
  scrollToSelectorWithOffset("#videoFrame", 96);
};

const isNearVideoFrame = () => {
  if (!el.videoFrame) {
    return false;
  }

  const rect = el.videoFrame.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const topThreshold = viewportHeight * 0.88;
  const bottomThreshold = 64;

  return rect.top <= topThreshold && rect.bottom >= bottomThreshold;
};

const ensureSuccessJumpBar = () => {
  if (el.successJumpBar) {
    return el.successJumpBar;
  }

  const bar = document.createElement("button");
  bar.type = "button";
  bar.className = "success-jump-bar";
  bar.setAttribute("aria-live", "polite");
  bar.setAttribute("aria-label", "Corte gerado com sucesso. Ir para o player");
  bar.innerHTML =
    '<span class="success-jump-bar-icon">\u2713</span><span class="success-jump-bar-text">Corte gerado com sucesso.</span>';

  bar.addEventListener("click", () => {
    hideSuccessJumpBar();
    scrollToVideoFrame();
  });

  document.body.appendChild(bar);
  el.successJumpBar = bar;
  return bar;
};

const hideSuccessJumpBar = () => {
  if (!el.successJumpBar) {
    return;
  }

  el.successJumpBar.classList.remove("is-visible");
  app.isSuccessJumpBarVisible = false;
};

const showSuccessJumpBar = () => {
  const bar = ensureSuccessJumpBar();
  if (!isWideViewportForSuccessBar()) {
    hideSuccessJumpBar();
    return;
  }

  bar.classList.add("is-visible");
  app.isSuccessJumpBarVisible = true;
};

const handleUploadSuccessFeedback = (uploadedVideoId) => {
  app.latestUploadedVideoId = uploadedVideoId;

  if (!isWideViewportForSuccessBar()) {
    hideSuccessJumpBar();
    scrollToVideoFrame();
    return;
  }

  if (isNearVideoFrame()) {
    hideSuccessJumpBar();
    return;
  }

  showSuccessJumpBar();
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

const setCurrentVideoTitle = (title = "") => {
  if (!el.videoNowTitle) {
    return;
  }
  if (el.videoNowTitle.matches("input.player-video-title-input")) {
    return;
  }
  el.videoNowTitle.textContent = truncatePlayerVideoTitle(title);
  el.videoNowTitle.setAttribute("title", title || "");
};

const startCurrentVideoTitleEdit = () => {
  if (!el.videoNowTitle || el.videoNowTitle.matches("input.player-video-title-input") || !app.currentVideoId) {
    return;
  }

  const currentVideo = app.savedVideos.find((video) => video.id === app.currentVideoId);
  if (!currentVideo) {
    return;
  }

  const titleElement = el.videoNowTitle;
  const originalTitle = currentVideo.name;
  const originalClassName = titleElement.className;
  const originalMarginTop = window.getComputedStyle(titleElement).marginTop;

  const input = document.createElement("input");
  input.type = "text";
  input.id = "videoNowTitle";
  input.className = "saved-video-title-input player-video-title-input";
  input.value = originalTitle;
  input.maxLength = INPUT_LIMITS.videoTitle;
  input.setAttribute("aria-label", "Editar título do vídeo atual");
  input.style.marginTop = originalMarginTop;

  titleElement.replaceWith(input);
  el.videoNowTitle = input;
  input.focus();
  input.select();

  const finishEdit = (shouldCommit) => {
    const nextTitle = input.value.trim().slice(0, INPUT_LIMITS.videoTitle);
    const finalTitle = shouldCommit && nextTitle ? nextTitle : originalTitle;

    if (shouldCommit && nextTitle && nextTitle !== originalTitle) {
      currentVideo.name = nextTitle;
      saveSavedVideos(app);
      renderSavedVideos();
    }

    const titleOutput = document.createElement("p");
    titleOutput.id = "videoNowTitle";
    titleOutput.className = originalClassName;
    titleOutput.textContent = truncatePlayerVideoTitle(finalTitle);
    titleOutput.setAttribute("title", finalTitle);

    input.replaceWith(titleOutput);
    el.videoNowTitle = titleOutput;
  };

  input.addEventListener("blur", () => finishEdit(true));
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      finishEdit(true);
    } else if (event.key === "Escape") {
      event.preventDefault();
      finishEdit(false);
    }
  });
};

const isMobileViewport = () => window.innerWidth < 768;
const canUseSavedVideoHoverEffects = () =>
  window.matchMedia("(hover: hover) and (pointer: fine)").matches && !isMobileViewport();

const getCloudinaryThumb = (video) => {
  if (!video.public_id) {
    return video.thumbnailUrl || "";
  }

  return `https://res.cloudinary.com/${config.cloudName}/video/upload/so_2,w_960,h_540,c_fill,g_auto,q_auto,f_jpg/${video.public_id}.jpg`;
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

const getPromptCombinationKey = (promptIds = []) => [...new Set(promptIds)].sort().join("|");

const formatConfigMsg = (name = "") => {
  const fallbackName = "Sem nome";
  const trimmedName = String(name || "").trim() || fallbackName;
  const normalizedName = trimmedName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const startsWithConfiguracao = /^\s*configuracao\b/i.test(normalizedName);

  if (!startsWithConfiguracao) {
    return `Configuração "${trimmedName}"`;
  }

  const withoutPrefix = trimmedName.replace(/^\s*configura[cç][aã]o\b\s*/i, "").trim();
  return `Configuração "${withoutPrefix || trimmedName}"`;
};

const getConfigDisplayLabel = (name = "") => {
  const fallbackName = "Sem nome";
  const trimmedName = String(name || "").trim() || fallbackName;
  const normalizedName = trimmedName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const startsWithConfiguracao = /^\s*configuracao\b/i.test(normalizedName);

  if (!startsWithConfiguracao) {
    return trimmedName;
  }

  const withoutPrefix = trimmedName.replace(/^\s*configura[cç][aã]o\b\s*/i, "").trim();
  return withoutPrefix || trimmedName;
};

const joinWithCommasAndConjunction = (items = []) => {
  if (!items.length) {
    return "";
  }

  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} e ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;
};

const sanitizeConfigTitle = (value = "") =>
  String(value || "")
    .trim()
    .substring(0, 60);

const normalizePromptConfigTitles = () => {
  let hasChanges = false;

  app.promptConfigs = app.promptConfigs.map((cfg) => {
    const safeName = sanitizeConfigTitle(cfg.name) || "Sem nome";
    if (safeName !== cfg.name) {
      hasChanges = true;
      return { ...cfg, name: safeName };
    }

    return cfg;
  });

  if (hasChanges) {
    savePromptState(app);
  }
};

const formatOrphanConfigsWarning = (orphanConfigs = []) => {
  if (!orphanConfigs.length) {
    return "";
  }

  const collator = new Intl.Collator("pt-BR", {
    numeric: true,
    sensitivity: "base",
  });

  const sortedUniqueQuotedLabels = [...new Set(orphanConfigs.map((cfg) => getConfigDisplayLabel(cfg.name)))]
    .sort((a, b) => collator.compare(a, b))
    .map((label) => `"${label}"`);

  const labelsList = joinWithCommasAndConjunction(sortedUniqueQuotedLabels);

  if (sortedUniqueQuotedLabels.length === 1) {
    return `⚠️ Esta ação excluirá a configuração ${labelsList}, pois ela ficará com menos de 2 prompts.`;
  }

  return `⚠️ Esta ação excluirá as configurações ${labelsList}, pois elas ficarão com menos de 2 prompts.`;
};

const analyzePromptDeletionImpact = (promptId) => {
  const affectedConfigs = app.promptConfigs.filter((cfg) => cfg.promptIds.includes(promptId));
  const affectedConfigIds = new Set(affectedConfigs.map((cfg) => cfg.id));

  if (!affectedConfigs.length) {
    return {
      affectedConfigs,
      orphanConfigs: [],
      mergePairs: [],
      configIdsToDelete: [],
      duplicateLoserToWinnerId: new Map(),
    };
  }

  const originalOrderById = new Map(app.promptConfigs.map((cfg, index) => [cfg.id, index]));
  const simulatedConfigs = app.promptConfigs.map((cfg) => ({
    ...cfg,
    promptIds: cfg.promptIds.filter((id) => id !== promptId),
  }));

  const orphanConfigs = simulatedConfigs.filter((cfg) => affectedConfigIds.has(cfg.id) && cfg.promptIds.length < 2);
  const orphanConfigIds = new Set(orphanConfigs.map((cfg) => cfg.id));

  const survivors = simulatedConfigs.filter((cfg) => !orphanConfigIds.has(cfg.id) && cfg.promptIds.length >= 2);
  const groupedByCombination = new Map();

  survivors.forEach((cfg) => {
    const key = getPromptCombinationKey(cfg.promptIds);
    if (!groupedByCombination.has(key)) {
      groupedByCombination.set(key, []);
    }
    groupedByCombination.get(key).push(cfg);
  });

  const mergePairs = [];
  const duplicateLoserToWinnerId = new Map();

  groupedByCombination.forEach((group) => {
    if (group.length < 2) {
      return;
    }

    const hasAnyAffectedConfig = group.some((cfg) => affectedConfigIds.has(cfg.id));
    if (!hasAnyAffectedConfig) {
      return;
    }

    const orderedGroup = [...group].sort(
      (a, b) => (originalOrderById.get(a.id) || 0) - (originalOrderById.get(b.id) || 0),
    );
    const affectedInGroup = orderedGroup.filter((cfg) => affectedConfigIds.has(cfg.id));
    const winnerConfig = affectedInGroup[0] || orderedGroup[0];

    orderedGroup.forEach((candidateConfig) => {
      if (candidateConfig.id === winnerConfig.id) {
        return;
      }

      duplicateLoserToWinnerId.set(candidateConfig.id, winnerConfig.id);
      mergePairs.push({
        winnerConfig,
        duplicateConfig: candidateConfig,
      });
    });
  });

  const configIdsToDelete = [...orphanConfigIds, ...duplicateLoserToWinnerId.keys()];

  return {
    affectedConfigs,
    orphanConfigs,
    mergePairs,
    configIdsToDelete,
    duplicateLoserToWinnerId,
  };
};

const applyPromptDeletionCascade = (promptId, impact) => {
  const configIdsToDelete = new Set(impact.configIdsToDelete);
  const previousActiveConfigId = app.activeConfigId;

  app.prompts = app.prompts.filter((prompt) => prompt.id !== promptId);
  app.promptConfigs = app.promptConfigs
    .map((cfg) => ({
      ...cfg,
      promptIds: cfg.promptIds.filter((id) => id !== promptId),
    }))
    .filter((cfg) => !configIdsToDelete.has(cfg.id));

  if (app.editingPromptId === promptId) {
    clearPromptEditor();
  }

  if (previousActiveConfigId && configIdsToDelete.has(previousActiveConfigId)) {
    const remappedConfigId = impact.duplicateLoserToWinnerId.get(previousActiveConfigId) || null;
    app.activeConfigId = remappedConfigId && !configIdsToDelete.has(remappedConfigId) ? remappedConfigId : null;
  }

  syncActiveConfigWithPromptSelection();
  savePromptState(app);
  renderPromptUI();
};

const syncActiveConfigWithPromptSelection = () => {
  const activePromptIds = getActivePromptIds();
  if (!activePromptIds.length) {
    app.activeConfigId = null;
    return;
  }

  const activeKey = getPromptCombinationKey(activePromptIds);
  const matchedConfig = app.promptConfigs.find((cfg) => getPromptCombinationKey(cfg.promptIds) === activeKey);
  app.activeConfigId = matchedConfig ? matchedConfig.id : null;
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
  const titleMaxLength = INPUT_LIMITS.promptTitle;
  const textMaxLength = INPUT_LIMITS.promptText;

  el.promptTitleInput.maxLength = titleMaxLength;
  el.promptTextInput.maxLength = textMaxLength;

  if (el.promptTitleInput.value.length > titleMaxLength) {
    el.promptTitleInput.value = el.promptTitleInput.value.slice(0, titleMaxLength);
  }

  if (el.promptTextInput.value.length > textMaxLength) {
    el.promptTextInput.value = el.promptTextInput.value.slice(0, textMaxLength);
  }
};

const updatePromptTitlePlaceholder = () => {
  if (!el.promptTitleInput) {
    return;
  }

  el.promptTitleInput.placeholder = window.innerWidth < 355 ? "Ex.: Gancho forte..." : "Ex.: Gancho forte para inicio";
};

const animateButtonPress = (buttonElement) => {
  gsap.fromTo(buttonElement, { scale: 1 }, { scale: 0.97, duration: 0.08, yoyo: true, repeat: 1, ease: "power1.out" });
};

const resolveCustomDialog = (value) => {
  if (!app.dialogResolver) {
    return;
  }

  const resolver = app.dialogResolver;
  app.dialogResolver = null;
  resolver(value);
};

const removeCustomDialogExtraButtons = () => {
  if (!el.customDialogActions) {
    return;
  }

  el.customDialogActions.querySelectorAll("[data-custom-dialog-extra]").forEach((button) => {
    button.remove();
  });
};

const closeCustomDialog = (resultValue) => {
  if (!el.customDialog.open || app.dialogIsClosing) {
    return;
  }

  app.dialogIsClosing = true;
  gsap.killTweensOf([el.customDialog, el.customDialogCard]);

  gsap.to(el.customDialogCard, {
    autoAlpha: 0,
    scale: 0.95,
    y: 10,
    duration: 0.2,
    ease: "power2.in",
  });

  gsap.to(el.customDialog, {
    autoAlpha: 0,
    duration: 0.16,
    ease: "power1.in",
    onComplete: () => {
      el.customDialog.close();
      app.dialogIsClosing = false;
      resolveCustomDialog(resultValue);
    },
  });
};

const showCustomDialog = ({
  title,
  message,
  messageHTML = "",
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  isAlert = false,
  extraActions = [],
}) =>
  new Promise((resolve) => {
    if (el.customDialog.open) {
      el.customDialog.close();
      resolveCustomDialog(false);
    }

    app.dialogResolver = resolve;
    app.dialogIsClosing = false;

    el.customDialogTitle.textContent = title;
    if (messageHTML) {
      el.customDialogMessage.innerHTML = messageHTML;
    } else {
      el.customDialogMessage.textContent = message;
    }
    el.customDialogConfirm.textContent = confirmLabel;
    el.customDialogCancel.textContent = cancelLabel;
    el.customDialogCancel.classList.toggle("hidden", isAlert);

    removeCustomDialogExtraButtons();
    extraActions.forEach((action) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `custom-dialog-btn ${
        action.variant === "confirm" ? "custom-dialog-btn-confirm" : "custom-dialog-btn-cancel"
      }`;
      button.textContent = action.label;
      button.dataset.customDialogExtra = "true";
      button.addEventListener("click", () => {
        closeCustomDialog(action.value);
      });

      el.customDialogActions.insertBefore(button, el.customDialogCancel);
    });

    el.customDialog.showModal();
    el.body.classList.add("modal-open");

    gsap.killTweensOf([el.customDialog, el.customDialogCard]);
    gsap.set(el.customDialog, { autoAlpha: 1 });
    gsap.fromTo(
      el.customDialogCard,
      { autoAlpha: 0, scale: 0.95, y: 12 },
      { autoAlpha: 1, scale: 1, y: 0, duration: 0.26, ease: "power2.out" },
    );
  });

const showConfirmDialog = (message, options = {}) =>
  showCustomDialog({
    title: options.title || "Confirme a ação",
    message,
    confirmLabel: options.confirmLabel || "Confirmar",
    cancelLabel: options.cancelLabel || "Cancelar",
    isAlert: false,
  });

const showAlertDialog = (message, options = {}) =>
  showCustomDialog({
    title: options.title || "Cutter.ai",
    message,
    messageHTML: options.messageHTML || "",
    confirmLabel: options.confirmLabel || "Entendi",
    cancelLabel: "",
    isAlert: true,
  });

const openPromptPanel = ({ onOpened } = {}) => {
  const isAlreadyOpen = !el.promptPanel.classList.contains("hidden");

  gsap.killTweensOf(el.promptPanel);
  el.promptPanel.classList.remove("hidden");
  el.openPromptPanel.setAttribute("aria-expanded", "true");

  if (isAlreadyOpen) {
    gsap.set(el.promptPanel, { height: "auto", autoAlpha: 1, y: 0 });
    if (typeof onOpened === "function") {
      onOpened();
    }
    return;
  }

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
        if (typeof onOpened === "function") {
          onOpened();
        }
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

const pulsePromptEditorContainer = () => {
  if (!el.promptEditorContainer) {
    return;
  }

  el.promptEditorContainer.classList.remove("prompt-editor-pulse");
  void el.promptEditorContainer.offsetWidth;
  el.promptEditorContainer.classList.add("prompt-editor-pulse");
};

const getNewlyActivatedIds = (previousIds = [], currentIds = []) => {
  const previousSet = new Set(previousIds);
  return currentIds.filter((id) => !previousSet.has(id));
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

const renderPromptList = ({ highlightPromptIds = [] } = {}) => {
  const highlightPromptIdSet = new Set(highlightPromptIds);

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
      <article class="prompt-item ${prompt.active ? `is-active${highlightPromptIdSet.has(prompt.id) ? " highlight-enter" : ""}` : ""}" data-prompt-id="${escapeHTML(prompt.id)}">
        ${prompt.active ? '<span class="prompt-active-badge">✓</span>' : ""}
        <div class="prompt-item-header">
          <span class="prompt-item-title" data-prompt-rename-id="${escapeHTML(prompt.id)}" title="${escapeHTML(prompt.title)}">${escapeHTML(prompt.title)}</span>
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

const renderConfigList = ({ highlightConfigIds = [] } = {}) => {
  const highlightConfigIdSet = new Set(highlightConfigIds);

  if (!app.promptConfigs.length) {
    el.promptConfigList.innerHTML =
      '<p class="config-empty-state col-span-full rounded-xl border border-dashed border-zinc-300 p-3 text-xs text-slate-600 dark:border-zinc-700 dark:text-zinc-400">Nenhuma configuração criada. Salve combinações para reutilizar em vários uploads.</p>';
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
      const subtitleText = `${promptCount} prompt(s) nesta configuração`;

      return `
        <article class="config-card ${isCurrent ? `is-active${highlightConfigIdSet.has(cfg.id) ? " highlight-enter" : ""}` : ""}" data-config-id="${escapeHTML(cfg.id)}">
          ${isCurrent ? '<span class="config-active-badge">✓</span>' : ""}
          <div class="config-title config-title-editable" data-config-edit-inline="${escapeHTML(cfg.id)}" title="${escapeHTML(cfg.name)}">${escapeHTML(cfg.name)}</div>
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

const renderPromptUI = ({ highlightPromptIds = [], highlightConfigIds = [] } = {}) => {
  renderPromptList({ highlightPromptIds });
  renderConfigList({ highlightConfigIds });
  el.clearAllPromptsBtn.disabled = app.prompts.length === 0;
};

const renderSavedVideos = ({ highlightSelectedVideoIds = [], highlightCurrentVideoIds = [] } = {}) => {
  const highlightSelectedVideoIdSet = new Set(highlightSelectedVideoIds);
  const highlightCurrentVideoIdSet = new Set(highlightCurrentVideoIds);

  if (!app.savedVideos.length) {
    el.savedVideosList.innerHTML =
      '<p class="col-span-full rounded-xl border border-dashed border-zinc-300 p-3 text-xs text-slate-600 dark:border-zinc-700 dark:text-zinc-400 cursor-pointer" data-scroll-to-api-key>Nenhum vídeo salvo ainda. Carregue um vídeo para começar!</p>';

    // Navega direto para o campo de API quando não ha videos.
    const emptyMessage = el.savedVideosList.querySelector("[data-scroll-to-api-key]");
    if (emptyMessage) {
      emptyMessage.addEventListener("click", () => {
        scrollToSelectorWithOffset("#apiKey", 100);
      });
    }

    updateVideoToolbarState();
    return;
  }

  el.savedVideosList.innerHTML = app.savedVideos
    .map((video) => {
      const shouldAnimateNewBadge = video.isNew && app.newBadgeAnimationPendingId === video.id;
      const isSelected = app.selectedVideoIds.includes(video.id);
      const isCurrent = app.currentVideoId === video.id;
      const highlightSelectedClass = isSelected && highlightSelectedVideoIdSet.has(video.id) ? " highlight-enter" : "";
      const highlightCurrentClass = isCurrent && highlightCurrentVideoIdSet.has(video.id) ? " highlight-enter" : "";

      return `
      <div class="saved-video-item ${isSelected ? `selected${highlightSelectedClass}` : ""} ${isCurrent ? `is-current${highlightCurrentClass}` : ""}" data-video-id="${escapeHTML(video.id)}">
        <div class="saved-video-thumbnail">
          <img class="saved-video-thumb-img" src="${escapeHTML(getCloudinaryThumb(video))}" alt="Miniatura de ${escapeHTML(video.name)}" loading="lazy" />
          <div class="saved-video-overlay">
            <span class="saved-video-play-indicator">
              <i data-lucide="play"></i>
            </span>
          </div>
          <button type="button" class="saved-video-close-btn" data-video-delete-id="${escapeHTML(video.id)}" title="Excluir">×</button>
          ${video.isNew ? `<div class="saved-video-new-badge${shouldAnimateNewBadge ? " saved-video-new-badge-animate" : ""}">NOVO</div>` : ""}
          ${app.isVideoSelectionMode ? '<div class="saved-video-checkbox"></div>' : ""}
        </div>
        <p class="saved-video-title" title="${escapeHTML(video.name)}" data-video-title-id="${escapeHTML(video.id)}">${escapeHTML(video.name)}</p>
      </div>`;
    })
    .join("");

  app.newBadgeAnimationPendingId = null;

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

  if (app.latestUploadedVideoId && videoId === app.latestUploadedVideoId) {
    hideSuccessJumpBar();
  }

  scrollToVideoFrame();

  setVideoFrameLoading(true);
  const previousCurrentVideoId = app.currentVideoId;
  el.video.addEventListener(
    "loadeddata",
    () => {
      setVideoFrameLoading(false);
      app.currentVideoId = targetVideo.id;
      if (targetVideo.isNew) {
        targetVideo.isNew = false;
        saveSavedVideos(app);
      }
      const label = targetVideo.name;
      setCurrentVideoTitle(label);
      const highlightCurrentVideoIds = previousCurrentVideoId !== targetVideo.id ? [targetVideo.id] : [];
      renderSavedVideos({ highlightCurrentVideoIds });
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

const deleteSelectedVideos = async () => {
  if (!app.selectedVideoIds.length) return;

  const accepted = await showConfirmDialog(`Isto removerá ${app.selectedVideoIds.length} vídeo(s) permanentemente.`, {
    title: "Atenção",
    confirmLabel: "Remover",
  });
  if (!accepted) return;

  app.savedVideos = app.savedVideos.filter((v) => !app.selectedVideoIds.includes(v.id));
  app.selectedVideoIds = [];
  saveSavedVideos(app);
  renderSavedVideos();
  updateVideoToolbarState();
};

const createPrompt = async () => {
  const titleRaw = el.promptTitleInput.value.trim().slice(0, INPUT_LIMITS.promptTitle);
  const text = el.promptTextInput.value.trim().slice(0, INPUT_LIMITS.promptText);

  if (!text) {
    await showAlertDialog("Escreva uma instrução antes de salvar.", {
      title: "Campo obrigatório",
    });
    el.promptTextInput.focus();
    return;
  }

  const title = titleRaw || `Prompt ${app.prompts.length + 1}`;

  app.prompts.unshift({
    id: generateId("prompt"),
    title,
    text,
    active: true,
  });

  syncActiveConfigWithPromptSelection();
  savePromptState(app);
  renderPromptUI();
  clearPromptEditor();
};

const updatePrompt = async () => {
  const targetPrompt = app.prompts.find((prompt) => prompt.id === app.editingPromptId);
  if (!targetPrompt) {
    clearPromptEditor();
    return;
  }

  const titleRaw = el.promptTitleInput.value.trim().slice(0, INPUT_LIMITS.promptTitle);
  const text = el.promptTextInput.value.trim().slice(0, INPUT_LIMITS.promptText);

  if (!text) {
    await showAlertDialog("Escreva uma instrução antes de salvar.", {
      title: "Campo obrigatório",
    });
    el.promptTextInput.focus();
    return;
  }

  targetPrompt.title = titleRaw || targetPrompt.title || "Prompt sem título";
  targetPrompt.text = text;

  savePromptState(app);
  renderPromptUI();
  clearPromptEditor();
};

const createConfig = async () => {
  const activePromptIds = getActivePromptIds();
  if (activePromptIds.length < 2) {
    showAlertDialog("", {
      title: "Configuração necessária",
      messageHTML: "Ative 2+ prompts em <strong>prompts salvos</strong> para criar uma combinação.",
    });
    return;
  }

  const activeCombinationKey = getPromptCombinationKey(activePromptIds);
  const existingConfig = app.promptConfigs.find(
    (cfg) => getPromptCombinationKey(cfg.promptIds) === activeCombinationKey,
  );

  if (existingConfig) {
    const previousActiveConfigId = app.activeConfigId;

    app.activeConfigId = existingConfig.id;
    savePromptState(app);
    const highlightConfigIds =
      app.activeConfigId && app.activeConfigId !== previousActiveConfigId ? [app.activeConfigId] : [];
    renderPromptUI({ highlightConfigIds });

    const decision = await showCustomDialog({
      title: "Opção disponível",
      message: "",
      messageHTML: `"<strong>${escapeHTML(existingConfig.name)}</strong>" já está ativa.<br /><br />Deseja <strong>desativar</strong> essa configuração?`,
      confirmLabel: "Desativar",
      cancelLabel: "Cancelar",
      isAlert: false,
      extraActions: [{ label: "Manter Ativado", value: "keep-active", variant: "cancel" }],
    });

    if (decision === true) {
      deactivateConfig();
    }

    return;
  }

  const defaultName = `Configuração ${app.promptConfigs.length + 1}`;
  const configId = generateId("config");

  app.promptConfigs.unshift({
    id: configId,
    name: sanitizeConfigTitle(defaultName),
    promptIds: [...activePromptIds],
  });

  const previousActiveConfigId = app.activeConfigId;
  app.activeConfigId = configId;

  savePromptState(app);
  const highlightConfigIds =
    app.activeConfigId && app.activeConfigId !== previousActiveConfigId ? [app.activeConfigId] : [];
  renderConfigList({ highlightConfigIds });
};

const applyConfig = (configId) => {
  const targetConfig = app.promptConfigs.find((cfg) => cfg.id === configId);
  if (!targetConfig) {
    return;
  }

  const previousActivePromptIds = getActivePromptIds();
  const previousActiveConfigId = app.activeConfigId;
  const promptIdSet = new Set(targetConfig.promptIds);
  app.prompts.forEach((prompt) => {
    prompt.active = promptIdSet.has(prompt.id);
  });

  app.activeConfigId = targetConfig.id;
  savePromptState(app);

  const currentActivePromptIds = getActivePromptIds();
  const highlightPromptIds = getNewlyActivatedIds(previousActivePromptIds, currentActivePromptIds);
  const highlightConfigIds =
    app.activeConfigId && app.activeConfigId !== previousActiveConfigId ? [app.activeConfigId] : [];

  renderPromptUI({ highlightPromptIds, highlightConfigIds });
};

const deactivateConfig = () => {
  app.activeConfigId = null;
  app.prompts.forEach((prompt) => {
    prompt.active = false;
  });

  savePromptState(app);
  renderPromptUI();
};

const toggleConfigActivation = (configId) => {
  if (app.activeConfigId === configId) {
    deactivateConfig();
    return;
  }

  applyConfig(configId);
};

const clearAllPrompts = async () => {
  const accepted = await showConfirmDialog("Todos os prompts salvos serão removidos permanentemente.", {
    title: "Atenção",
    confirmLabel: "Apagar",
  });
  if (!accepted) {
    return;
  }

  app.prompts = [];
  app.promptConfigs = app.promptConfigs.map((cfg) => ({ ...cfg, promptIds: [] }));
  app.activeConfigId = null;
  app.editingPromptId = null;

  savePromptState(app);
  renderPromptUI();
  clearPromptEditor();
};

const clearAllConfigs = async () => {
  const accepted = await showConfirmDialog("Todas as configurações salvas serão removidas permanentemente.", {
    title: "Atenção",
    confirmLabel: "Apagar",
  });
  if (!accepted) {
    return;
  }

  app.promptConfigs = [];
  app.activeConfigId = null;

  savePromptState(app);
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

const { openApiModal: openApiModalFunc, closeApiModal: closeApiModalFunc } = (() => {
  let previousFocus = null;

  const openApiModal = () => {
    previousFocus = document.activeElement;

    gsap.killTweensOf([el.apiModalBackdrop, el.apiModalCard]);
    el.apiModal.classList.remove("hidden");
    el.body.classList.add("overflow-hidden");

    gsap.fromTo(el.apiModalBackdrop, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, ease: "power1.out" });
    gsap.fromTo(
      el.apiModalCard,
      { y: 20, scale: 0.97, autoAlpha: 0 },
      {
        y: 0,
        scale: 1,
        autoAlpha: 1,
        duration: 0.28,
        ease: "power2.out",
        onComplete: () => {
          el.closeApiModal.focus();
        },
      },
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
        previousFocus?.focus();
        previousFocus = null;
      },
    });
  };

  return { openApiModal, closeApiModal };
})();

const openApiModal = openApiModalFunc;
const closeApiModal = closeApiModalFunc;

const renderApiMask = () => {
  el.apiKey.value = app.apiKeyRawValue;
};

const renderApiKeyVisibilityState = () => {
  const iconName = app.isApiKeyVisible ? "eye-off" : "eye";

  el.apiKey.type = app.isApiKeyVisible ? "text" : "password";
  el.apiKeyVisibilityToggle.setAttribute(
    "aria-label",
    app.isApiKeyVisible ? "Ocultar chave da API" : "Mostrar chave da API",
  );
  el.apiKeyVisibilityToggle.innerHTML = `<i data-lucide="${iconName}" class="h-4 w-4"></i>`;
  lucide.createIcons();
};

const toggleApiKeyVisibility = () => {
  app.isApiKeyVisible = !app.isApiKeyVisible;
  renderApiKeyVisibilityState();
  el.apiKey.focus();

  requestAnimationFrame(() => {
    const length = el.apiKey.value.length;
    el.apiKey.setSelectionRange(length, length);
  });
};

const openWidget = () => {
  app.widget = window.cloudinary.createUploadWidget(
    {
      ...config,
      styles: getWidgetStyles(),
    },
    (error, result) =>
      processWidgetResult(error, result, {
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
        waitForTranscriptionFn: waitForTranscription,
        getTranscriptionFn: getTranscription,
        getViralMomentFn: getViralMoment,
      }),
  );
  app.widget.open();
};

lucide.createIcons();
renderApiKeyVisibilityState();
initTheme({
  onToggle: () => {
    if (app.widget) {
      app.widget.destroy();
      app.widget = null;
    }
  },
});
renderApiMask();
loadPromptState(app);
normalizePromptConfigTitles();
loadSavedVideos(app);
renderPromptUI();
renderSavedVideos();
clearPromptEditor();
updatePromptInputLimits();
updatePromptTitlePlaceholder();
gsap.registerPlugin(ScrollTrigger);
gsap.config({ trial: true });
ScrollTrigger.config({ limitCallbacks: true });

gsap.from(".hero-word", {
  y: 40,
  autoAlpha: 0,
  duration: 0.9,
  stagger: 0.08,
  ease: "power4.out",
  delay: 0,
  immediateRender: false,
});

gsap.utils.toArray(".reveal").forEach((item) => {
  gsap.from(item, {
    y: 24,
    autoAlpha: 0,
    force3D: true,
    duration: 0.72,
    ease: "power2.out",
    immediateRender: false,
    scrollTrigger: {
      trigger: item,
      start: "top 92%",
      fastScrollEnd: true,
      toggleActions: "play none none none",
      once: true,
    },
  });
});

let hasBenefitsHighlightPlayed = false;

ScrollTrigger.create({
  trigger: "#beneficios",
  start: "top 70%",
  fastScrollEnd: true,
  once: true,
  onEnter: () => {
    if (hasBenefitsHighlightPlayed) {
      return;
    }

    hasBenefitsHighlightPlayed = true;
    gsap.from(".benefit-word", {
      y: 40,
      autoAlpha: 0,
      duration: 0.75,
      stagger: 0.07,
      ease: "power3.out",
      immediateRender: false,
    });
  },
});

el.apiHelpButton.addEventListener("click", openApiModal);
el.closeApiModal.addEventListener("click", closeApiModal);
el.apiModalBackdrop.addEventListener("click", closeApiModal);

el.customDialogConfirm.addEventListener("click", () => {
  closeCustomDialog(true);
});

el.customDialogCancel.addEventListener("click", () => {
  closeCustomDialog(false);
});

el.customDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeCustomDialog(false);
});

el.customDialog.addEventListener("close", () => {
  el.body.classList.remove("modal-open");

  if (!app.dialogIsClosing) {
    resolveCustomDialog(false);
  }
});

el.customDialog.addEventListener("click", (event) => {
  const bounds = el.customDialogCard.getBoundingClientRect();
  const insideX = event.clientX >= bounds.left && event.clientX <= bounds.right;
  const insideY = event.clientY >= bounds.top && event.clientY <= bounds.bottom;

  if (!insideX || !insideY) {
    closeCustomDialog(false);
  }
});

document.addEventListener("keydown", (event) => {
  if (el.customDialog.open) {
    return;
  }

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

el.savePromptBtn.addEventListener("click", async () => {
  if (app.editingPromptId) {
    await updatePrompt();
    return;
  }

  await createPrompt();
});

el.newPromptBtn.addEventListener("click", async () => {
  const hasDraft = Boolean(el.promptTitleInput.value.trim() || el.promptTextInput.value.trim());
  if (hasDraft) {
    const accepted = await showConfirmDialog("O prompt não foi salvo e será perdido. Deseja continuar?", {
      title: "Confirmação",
      confirmLabel: "Descartar",
    });
    if (!accepted) {
      return;
    }
  }

  clearPromptEditor();
});

el.addPromptConfigBtn.addEventListener("click", createConfig);
el.clearAllPromptsBtn.addEventListener("click", clearAllPrompts);
el.clearAllConfigsBtn.addEventListener("click", clearAllConfigs);

el.promptList.addEventListener("click", async (event) => {
  const toggleId = event.target.getAttribute("data-prompt-toggle-id");
  if (toggleId) {
    const targetPrompt = app.prompts.find((prompt) => prompt.id === toggleId);
    if (targetPrompt) {
      const previousActivePromptIds = getActivePromptIds();
      const previousActiveConfigId = app.activeConfigId;

      targetPrompt.active = !targetPrompt.active;
      syncActiveConfigWithPromptSelection();
      savePromptState(app);

      const currentActivePromptIds = getActivePromptIds();
      const highlightPromptIds = getNewlyActivatedIds(previousActivePromptIds, currentActivePromptIds);
      const highlightConfigIds =
        app.activeConfigId && app.activeConfigId !== previousActiveConfigId ? [app.activeConfigId] : [];

      renderPromptUI({ highlightPromptIds, highlightConfigIds });
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
    input.maxLength = INPUT_LIMITS.promptTitle;

    titleElement.replaceWith(input);
    input.focus();
    input.select();

    const saveEdit = () => {
      const newName = input.value.trim().slice(0, INPUT_LIMITS.promptTitle);
      if (newName && newName !== originalName) {
        targetPrompt.title = newName;
        savePromptState(app);
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

    openPromptPanel({
      onOpened: () => {
        if (window.innerWidth < 1024) {
          scrollToSelectorWithOffset("#promptEditorContainer", 20);
          pulsePromptEditorContainer();
        } else {
          pulsePromptEditorContainer();
        }

        el.promptTextInput.focus({ preventScroll: true });
      },
    });

    return;
  }

  const deleteId = event.target.getAttribute("data-prompt-delete-id");
  if (deleteId) {
    const targetPrompt = app.prompts.find((prompt) => prompt.id === deleteId);
    if (!targetPrompt) {
      return;
    }

    const impact = analyzePromptDeletionImpact(deleteId);
    const warningLines = [];

    const orphanWarning = formatOrphanConfigsWarning(impact.orphanConfigs);
    if (orphanWarning) {
      warningLines.push(orphanWarning);
    }

    impact.mergePairs.forEach(({ winnerConfig, duplicateConfig }) => {
      warningLines.push(
        `⚠️ A ${formatConfigMsg(winnerConfig.name)} será mesclada com ${formatConfigMsg(duplicateConfig.name)} por ficarem idênticas. O nome que será mantido é: "${winnerConfig.name}".`,
      );
    });

    const commonInfoLines =
      warningLines.length === 0
        ? impact.affectedConfigs.map((cfg) => `Este prompt será removido da ${formatConfigMsg(cfg.name)}.`)
        : [];

    const warningBlockHTML = warningLines
      .map((line) => `<span style="color:#dc2626;font-weight:700;">${escapeHTML(line)}</span>`)
      .join("<br /><br />");
    const commonInfoBlockHTML = commonInfoLines.map((line) => `<span>${escapeHTML(line)}</span>`).join("<br /><br />");

    const messageSections = [`Excluir o prompt \"${escapeHTML(targetPrompt.title)}\"?`];
    if (warningBlockHTML) {
      messageSections.push(warningBlockHTML);
    }
    if (commonInfoBlockHTML) {
      messageSections.push(commonInfoBlockHTML);
    }

    const accepted = await showCustomDialog({
      title: "Confirmar ação",
      message: "",
      messageHTML: messageSections.join("<br /><br />"),
      confirmLabel: "Remover",
      cancelLabel: "Cancelar",
      isAlert: false,
    });

    if (!accepted) {
      return;
    }

    applyPromptDeletionCascade(deleteId, impact);
    return;
  }

  const articleElement = event.target.closest("article[data-prompt-id]");
  if (articleElement && !event.target.closest("button")) {
    const promptId = articleElement.getAttribute("data-prompt-id");
    const targetPrompt = app.prompts.find((prompt) => prompt.id === promptId);
    if (targetPrompt) {
      const previousActivePromptIds = getActivePromptIds();
      const previousActiveConfigId = app.activeConfigId;

      targetPrompt.active = !targetPrompt.active;
      syncActiveConfigWithPromptSelection();
      savePromptState(app);

      const currentActivePromptIds = getActivePromptIds();
      const highlightPromptIds = getNewlyActivatedIds(previousActivePromptIds, currentActivePromptIds);
      const highlightConfigIds =
        app.activeConfigId && app.activeConfigId !== previousActiveConfigId ? [app.activeConfigId] : [];

      renderPromptUI({ highlightPromptIds, highlightConfigIds });
    }
  }
});

el.promptConfigList.addEventListener("click", async (event) => {
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
    input.value = sanitizeConfigTitle(originalName);
    input.className = "config-title-input";
    input.maxLength = 60;

    titleElement.replaceWith(input);
    input.focus();
    input.select();

    input.addEventListener("input", () => {
      if (input.value.length > 60) {
        input.value = input.value.substring(0, 60);
      }
    });

    input.addEventListener("paste", (e) => {
      e.preventDefault();
      const pastedText = (e.clipboardData || window.clipboardData).getData("text");
      input.value = `${input.value}${pastedText}`.substring(0, 60);
    });

    input.addEventListener("keydown", (e) => {
      const atLimit = input.value.length >= 60;
      const isPrintable = e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
      if (atLimit && isPrintable) {
        e.preventDefault();
      }
    });

    const saveEdit = () => {
      const newName = input.value.trim().substring(0, 60);
      if (newName && newName !== originalName) {
        targetConfig.name = newName;
        savePromptState(app);
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

    const accepted = await showConfirmDialog(`A configuração "${targetConfig.name}" será removida permanentemente.`, {
      title: "Atenção",
      confirmLabel: "Remover",
    });
    if (!accepted) {
      return;
    }

    app.promptConfigs = app.promptConfigs.filter((cfg) => cfg.id !== deleteId);
    if (app.activeConfigId === deleteId) {
      app.activeConfigId = null;
    }

    savePromptState(app);
    renderConfigList();
    return;
  }

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
    el.securityDetails.scrollIntoView({ block: "nearest" });
  }
});

el.apiKeyVisibilityToggle.addEventListener("click", () => {
  toggleApiKeyVisibility();
});

el.apiKey.addEventListener("keydown", (event) => {
  const isToggleShortcut = event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "h";
  if (isToggleShortcut) {
    event.preventDefault();
    toggleApiKeyVisibility();
    return;
  }

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
    if (app.apiKeyRawValue.length >= INPUT_LIMITS.apiKey) {
      event.preventDefault();
      return;
    }

    app.apiKeyRawValue += event.key;
    renderApiMask();
    event.preventDefault();
  }
});

el.apiKey.addEventListener("paste", (event) => {
  event.preventDefault();
  const pastedText = (event.clipboardData || window.clipboardData).getData("text").trim().slice(0, INPUT_LIMITS.apiKey);

  if (pastedText) {
    app.apiKeyRawValue = `${app.apiKeyRawValue}${pastedText}`.slice(0, INPUT_LIMITS.apiKey);
    renderApiMask();
  }
});

el.apiKey.addEventListener("focus", () => {
  requestAnimationFrame(() => {
    const length = el.apiKey.value.length;
    el.apiKey.setSelectionRange(length, length);
  });
});

el.button.addEventListener("click", async (e) => {
  e.preventDefault();

  app.apiKeyRawValue = app.apiKeyRawValue.trim().slice(0, INPUT_LIMITS.apiKey);
  renderApiMask();

  if (!app.apiKeyRawValue) {
    await showAlertDialog("Insira sua chave da API do Gemini para continuar.", {
      title: "Configuração necessária",
      confirmLabel: "Ok",
    });
    el.apiKey.focus();
    return;
  }

  animateButtonPress(el.button);

  updateStatus("Abrindo caixa para envio de vídeo...", true);
  setVideoFrameLoading(true);
  scrollToVideoFrame();
  openWidget();
});

el.apiHelpButton.addEventListener("click", () => {
  animateButtonPress(el.apiHelpButton);
});

el.video.addEventListener("play", () => {
  if (app.latestUploadedVideoId && app.currentVideoId === app.latestUploadedVideoId) {
    hideSuccessJumpBar();
  }
});

document.addEventListener("click", (event) => {
  const titleElement = event.target.closest("#videoNowTitle");
  if (!titleElement || titleElement.matches("input.player-video-title-input")) {
    return;
  }

  startCurrentVideoTitleEdit();
});

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[href^='#']");
  if (!link) {
    return;
  }

  const targetId = link.getAttribute("href").slice(1);
  const targetElement = document.getElementById(targetId);

  if (!targetElement) {
    return;
  }

  event.preventDefault();
  scrollToSelectorWithOffset(`#${targetId}`, 100);
});

const handleResizeForPromptInputs = debounce(() => {
  updatePromptInputLimits();
  updatePromptTitlePlaceholder();
}, 140);

const handleResizeForPromptAndVideos = debounce(() => {
  renderPromptUI();
  updateVideoToolbarState();
  if (!isWideViewportForSuccessBar()) {
    hideSuccessJumpBar();
  }
}, 160);

window.addEventListener("resize", handleResizeForPromptInputs, { passive: true });
window.addEventListener("resize", handleResizeForPromptAndVideos, { passive: true });

el.savedVideosSelectToggle.addEventListener("click", toggleVideoSelectionMode);
el.savedVideosSelectAll.addEventListener("click", () => {
  if (el.savedVideosSelectAll.disabled) {
    return;
  }

  const previousSelectedVideoIds = [...app.selectedVideoIds];
  if (!app.isVideoSelectionMode) {
    app.isVideoSelectionMode = true;
  }

  app.selectedVideoIds = app.savedVideos.map((v) => v.id);
  const highlightSelectedVideoIds = getNewlyActivatedIds(previousSelectedVideoIds, app.selectedVideoIds);
  updateVideoToolbarState();
  renderSavedVideos({ highlightSelectedVideoIds });
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

el.savedVideosList.addEventListener("mouseover", (event) => {
  if (!canUseSavedVideoHoverEffects()) {
    return;
  }

  const card = event.target.closest(".saved-video-item");
  if (!card) {
    return;
  }

  if (card.contains(event.relatedTarget)) {
    return;
  }

  const imageElement = card.querySelector(".saved-video-thumb-img");
  const playElement = card.querySelector(".saved-video-play-indicator");
  if (!imageElement || !playElement) {
    return;
  }

  gsap.to(imageElement, { scale: 1.05, duration: 0.3, ease: "power2.out" });
  gsap.to(playElement, { scale: 1.1, duration: 0.3, ease: "power2.out" });
});

el.savedVideosList.addEventListener("mouseout", (event) => {
  if (!canUseSavedVideoHoverEffects()) {
    return;
  }

  const card = event.target.closest(".saved-video-item");
  if (!card) {
    return;
  }

  if (card.contains(event.relatedTarget)) {
    return;
  }

  const imageElement = card.querySelector(".saved-video-thumb-img");
  const playElement = card.querySelector(".saved-video-play-indicator");
  if (!imageElement || !playElement) {
    return;
  }

  gsap.to(imageElement, { scale: 1, duration: 0.3, ease: "power2.out" });
  gsap.to(playElement, { scale: 1, duration: 0.3, ease: "power2.out" });
});

el.savedVideosList.addEventListener("click", async (event) => {
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
    input.maxLength = INPUT_LIMITS.videoTitle;

    titleElement.replaceWith(input);
    input.focus();
    input.select();

    const saveEdit = () => {
      const newName = input.value.trim().slice(0, INPUT_LIMITS.videoTitle);
      if (newName && newName !== originalName) {
        video.name = newName;
        saveSavedVideos(app);
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

  const deleteButton = event.target.closest("[data-video-delete-id]");
  if (deleteButton) {
    const videoId = deleteButton.getAttribute("data-video-delete-id");
    const video = app.savedVideos.find((v) => v.id === videoId);
    if (!video) return;

    const accepted = await showConfirmDialog(`"${video.name}" será removido de seus salvos permanentemente.`, {
      title: "Atenção",
      confirmLabel: "Remover",
    });
    if (!accepted) return;

    app.savedVideos = app.savedVideos.filter((v) => v.id !== videoId);
    if (app.latestUploadedVideoId === videoId) {
      app.latestUploadedVideoId = null;
      hideSuccessJumpBar();
    }
    saveSavedVideos(app);
    renderSavedVideos();
    return;
  }

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
    updateVideoToolbarState();
    renderSavedVideos();
  } else {
    const previousSelectedVideoIds = [...app.selectedVideoIds];
    app.selectedVideoIds.push(videoId);
    const highlightSelectedVideoIds = getNewlyActivatedIds(previousSelectedVideoIds, app.selectedVideoIds);
    updateVideoToolbarState();
    renderSavedVideos({ highlightSelectedVideoIds });
  }
});

let scrollDebounce;
const handleScrollStability = throttle(() => {
  el.body.classList.add("is-scrolling");
  clearTimeout(scrollDebounce);
  scrollDebounce = setTimeout(() => {
    el.body.classList.remove("is-scrolling");
  }, 130);
}, 80);

window.addEventListener("scroll", handleScrollStability, { passive: true });
