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
  const sizeRange = { min: 100, max: 350 };

  const supportedFontKeys = new Set(
    Array.from(fontSelect.options, (option) => option.value)
  );

  const ensureFontKey = (key) =>
    supportedFontKeys.has(key) ? key : defaults.fontKey;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const updateDisplay = () => {
    sizeValue.textContent = `${sizeInput.value}%`;
    heightValue.textContent = `${heightInput.value}%`;
  };

  const saveOptions = () => {
    const nextSize = clamp(
      Number(sizeInput.value) || defaults.textSize,
      sizeRange.min,
      sizeRange.max
    );
    sizeInput.value = String(nextSize);
    chrome.storage.sync.set({
      textSize: nextSize,
      lineHeight: Number(heightInput.value),
      fontKey: ensureFontKey(fontSelect.value),
    });
  };

  const handleInput = () => {
    sizeInput.value = String(
      clamp(
        Number(sizeInput.value) || defaults.textSize,
        sizeRange.min,
        sizeRange.max
      )
    );
    updateDisplay();
    saveOptions();
  };

  chrome.storage.sync.get(defaults, ({ textSize, lineHeight, fontKey }) => {
    sizeInput.value = String(clamp(textSize, sizeRange.min, sizeRange.max));
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
