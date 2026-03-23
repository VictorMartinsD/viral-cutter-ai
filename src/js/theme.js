const themeStorageKey = "clipmaker-theme";

const getThemeElements = () => ({
  root: document.documentElement,
  themeToggle: document.getElementById("themeToggle"),
  themeBulbOn: document.getElementById("themeBulbOn"),
  themeBulbOff: document.getElementById("themeBulbOff"),
});

const syncThemeToggle = () => {
  const { root, themeToggle, themeBulbOn, themeBulbOff } = getThemeElements();
  if (!themeToggle || !themeBulbOn || !themeBulbOff) {
    return;
  }

  const isDark = root.classList.contains("dark");
  themeBulbOn.classList.toggle("hidden", isDark);
  themeBulbOff.classList.toggle("hidden", !isDark);
  themeToggle.classList.toggle("text-amber-500", !isDark);
  themeToggle.classList.toggle("text-zinc-400", isDark);
};

(function () {
  const storedTheme = localStorage.getItem(themeStorageKey);
  if (!storedTheme || storedTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
})();

export const toggleTheme = () => {
  const { root } = getThemeElements();
  root.classList.toggle("dark");
  localStorage.setItem(themeStorageKey, root.classList.contains("dark") ? "dark" : "light");
  syncThemeToggle();
  return root.classList.contains("dark");
};

export const initTheme = ({ onToggle } = {}) => {
  const { themeToggle } = getThemeElements();
  if (!themeToggle) {
    return;
  }

  syncThemeToggle();

  themeToggle.addEventListener("click", () => {
    const isDark = toggleTheme();
    if (typeof onToggle === "function") {
      onToggle(isDark);
    }
  });
};
