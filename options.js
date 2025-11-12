(() => {
  const defaults = {
    textSize: 130,
    lineHeight: 190,
    fontKey: "droid-arabic-naskh",
  };
  const sizeInput = document.getElementById("size");
  const heightInput = document.getElementById("height");
  const sizeValue = document.getElementById("sizeValue");
  const heightValue = document.getElementById("heightValue");
  const fontSelect = document.getElementById("fontFamily");

  const supportedFontKeys = new Set(
    Array.from(fontSelect.options, (option) => option.value)
  );

  const ensureFontKey = (key) =>
    supportedFontKeys.has(key) ? key : defaults.fontKey;

  const updateDisplay = () => {
    sizeValue.textContent = `${sizeInput.value}%`;
    heightValue.textContent = `${heightInput.value}%`;
  };

  const saveOptions = () => {
    chrome.storage.sync.set({
      textSize: Number(sizeInput.value),
      lineHeight: Number(heightInput.value),
      fontKey: ensureFontKey(fontSelect.value),
    });
  };

  const handleInput = () => {
    updateDisplay();
    saveOptions();
  };

  chrome.storage.sync.get(defaults, ({ textSize, lineHeight, fontKey }) => {
    sizeInput.value = textSize;
    heightInput.value = lineHeight;
    fontSelect.value = ensureFontKey(fontKey);
    updateDisplay();
  });

  sizeInput.addEventListener("input", handleInput);
  heightInput.addEventListener("input", handleInput);
  fontSelect.addEventListener("change", () => {
    fontSelect.value = ensureFontKey(fontSelect.value);
    saveOptions();
  });
})();
