(() => {
  const defaults = {
    textSize: 130,
    lineHeight: 190,
    fontKey: "droid-arabic-naskh",
  };
  const fontStacks = {
    "droid-arabic-naskh": "'Droid Arabic Naskh', serif",
    "noto-naskh-arabic": "'Noto Naskh Arabic', 'Droid Arabic Naskh', serif",
    amiri: "'Amiri', 'Droid Arabic Naskh', serif",
    "scheherazade-new":
      "'Scheherazade New', 'Scheherazade', 'Droid Arabic Naskh', serif",
    lateef: "'Lateef', 'Droid Arabic Naskh', serif",
    "reem-kufi": "'Reem Kufi', 'Droid Arabic Naskh', serif",
    tajawal: "'Tajawal', 'Droid Arabic Naskh', serif",
    "markazi-text": "'Markazi Text', 'Droid Arabic Naskh', serif",
    cairo: "'Cairo', 'Droid Arabic Naskh', serif",
    "ibm-plex-sans-arabic":
      "'IBM Plex Sans Arabic', 'Droid Arabic Naskh', serif",
  };
  const excludedTags = new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "TEXTAREA",
    "INPUT",
    "OPTION",
  ]);
  const regexArabicScript =
    /([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+(?:[ \u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\W\d]+)*)/g;

  const normalizeFontKey = (key) =>
    Object.prototype.hasOwnProperty.call(fontStacks, key)
      ? key
      : defaults.fontKey;

  let settings = { ...defaults };
  let observer;
  let scheduled = false;

  const toPercentage = (value, fallback) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  };

  const getCurrentStyle = () => ({
    fontSizeEm: toPercentage(settings.textSize, defaults.textSize) / 100,
    lineHeightEm: toPercentage(settings.lineHeight, defaults.lineHeight) / 100,
    fontFamily: fontStacks[settings.fontKey] ?? fontStacks[defaults.fontKey],
  });

  const wrapArabicSegments = (textContent) => {
    const { fontSizeEm, lineHeightEm, fontFamily } = getCurrentStyle();
    return textContent.replace(
      regexArabicScript,
      `<span class="ar" data-huruf="1" data-huruf-font="${settings.fontKey}" style="font-size:${fontSizeEm}em; line-height:${lineHeightEm}em; font-family:${fontFamily};">$&</span>`
    );
  };

  const replaceNodeWithHtml = (node) => {
    const parent = node.parentNode;
    if (!parent) {
      return;
    }
    const html = wrapArabicSegments(node.nodeValue);
    if (html === node.nodeValue) {
      return;
    }
    const next = node.nextSibling;
    const parser = document.createElement("div");
    parser.innerHTML = html;
    while (parser.firstChild) {
      parent.insertBefore(parser.firstChild, next);
    }
    parent.removeChild(node);
  };

  const shouldSkipNode = (node) => {
    if (!node) {
      return true;
    }
    const parent = node.parentNode;
    if (!parent) {
      return true;
    }
    if (parent.nodeType !== Node.ELEMENT_NODE) {
      return false;
    }
    if (parent.classList.contains("ar")) {
      return true;
    }
    if (parent.closest('[data-huruf="ignore"]')) {
      return true;
    }
    if (excludedTags.has(parent.nodeName)) {
      return true;
    }
    return false;
  };

  const processTextNodes = () => {
    scheduled = false;
    const { body } = document;
    if (!body) {
      return;
    }
    const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (shouldSkipNode(node)) {
        continue;
      }
      const { nodeValue } = node;
      if (!nodeValue) {
        continue;
      }
      if (!nodeValue.trim()) {
        continue;
      }
      regexArabicScript.lastIndex = 0;
      if (!regexArabicScript.test(nodeValue)) {
        continue;
      }
      regexArabicScript.lastIndex = 0;
      replaceNodeWithHtml(node);
    }
  };

  const scheduleProcessing = () => {
    if (scheduled) {
      return;
    }
    scheduled = true;
    queueMicrotask(processTextNodes);
  };

  const ensureObserver = () => {
    if (observer || !document.body) {
      return;
    }
    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          if (!shouldSkipNode(mutation.target)) {
            scheduleProcessing();
            break;
          }
        }
        if (mutation.type === "childList" && mutation.addedNodes.length) {
          scheduleProcessing();
          break;
        }
      }
    });
    observer.observe(document.body, {
      characterData: true,
      childList: true,
      subtree: true,
    });
  };

  const applySettings = (values) => {
    settings = {
      textSize: toPercentage(values.textSize, defaults.textSize),
      lineHeight: toPercentage(values.lineHeight, defaults.lineHeight),
      fontKey: normalizeFontKey(values.fontKey),
    };
    scheduleProcessing();
  };

  const updateExistingSpans = () => {
    const { fontSizeEm, lineHeightEm, fontFamily } = getCurrentStyle();
    document.querySelectorAll('span.ar[data-huruf="1"]').forEach((span) => {
      span.style.fontSize = `${fontSizeEm}em`;
      span.style.lineHeight = `${lineHeightEm}em`;
      span.style.fontFamily = fontFamily;
      span.dataset.hurufFont = settings.fontKey;
    });
  };

  chrome.storage.sync.get(defaults, (initial) => {
    applySettings(initial);
    ensureObserver();
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync") {
      return;
    }
    const nextValues = { ...settings };
    if (Object.prototype.hasOwnProperty.call(changes, "textSize")) {
      nextValues.textSize = toPercentage(
        changes.textSize.newValue,
        defaults.textSize
      );
    }
    if (Object.prototype.hasOwnProperty.call(changes, "lineHeight")) {
      nextValues.lineHeight = toPercentage(
        changes.lineHeight.newValue,
        defaults.lineHeight
      );
    }
    if (Object.prototype.hasOwnProperty.call(changes, "fontKey")) {
      nextValues.fontKey = normalizeFontKey(changes.fontKey.newValue);
    }
    settings = nextValues;
    updateExistingSpans();
    scheduleProcessing();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      ensureObserver();
      scheduleProcessing();
    });
  } else {
    ensureObserver();
    scheduleProcessing();
  }
})();
