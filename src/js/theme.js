(function () {
  const storedTheme = localStorage.getItem("clipmaker-theme");
  if (!storedTheme || storedTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
})();
