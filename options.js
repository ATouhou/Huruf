(() => {
  const defaults = { textSize: 130, lineHeight: 190 };
  const sizeInput = document.getElementById("size");
  const heightInput = document.getElementById("height");
  const sizeValue = document.getElementById("sizeValue");
  const heightValue = document.getElementById("heightValue");

  const updateDisplay = () => {
    sizeValue.textContent = `${sizeInput.value}%`;
    heightValue.textContent = `${heightInput.value}%`;
  };

  const saveOptions = () => {
    chrome.storage.sync.set({
      textSize: Number(sizeInput.value),
      lineHeight: Number(heightInput.value),
    });
  };

  const handleInput = () => {
    updateDisplay();
    saveOptions();
  };

  chrome.storage.sync.get(defaults, ({ textSize, lineHeight }) => {
    sizeInput.value = textSize;
    heightInput.value = lineHeight;
    updateDisplay();
  });

  sizeInput.addEventListener("input", handleInput);
  heightInput.addEventListener("input", handleInput);
})();
