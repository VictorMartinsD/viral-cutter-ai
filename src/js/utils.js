export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const generateId = (prefix) => `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

export const escapeHTML = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export const truncateText = (text, maxLength = 65) => {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length > maxLength) {
    return trimmed.substring(0, maxLength) + "...";
  }
  return trimmed;
};

export const truncatePromptTitle = (text) => {
  const isMobile = window.innerWidth < 768;
  const maxLength = isMobile ? 23 : 100;
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length > maxLength) {
    return trimmed.substring(0, maxLength) + "...";
  }
  return trimmed;
};

export const truncateSavedPromptTitle = (text) => {
  const isMobile = window.innerWidth < 768;
  const maxLength = isMobile ? 16 : 100;
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length > maxLength) {
    return trimmed.substring(0, maxLength) + "...";
  }
  return trimmed;
};

export const truncateVideoTitle = (text) => {
  const trimmed = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  const maxLength = clamp(Math.floor((window.innerWidth - 92) / 7.1), 18, 52);
  if (trimmed.length > maxLength) {
    return trimmed.substring(0, maxLength) + "...";
  }
  return trimmed;
};

export const truncatePlayerVideoTitle = (text) => {
  const trimmed = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  const maxLength = clamp(Math.floor((window.innerWidth - 72) / 6.9), 34, 110);
  if (trimmed.length > maxLength) {
    return trimmed.substring(0, maxLength) + "...";
  }
  return trimmed;
};
