(() => {
  const defaults = { textSize: 130, lineHeight: 190 };
  const regexArabicScript =
    /([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+(?:[ \u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\W\d]+)*)/g;

  const toPercentage = (value, fallback) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  };

  const replaceNodeWithHtml = (node, html) => {
    const parent = node.parentNode;
    if (!parent) {
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

  const getTextNodes = () => {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT
    );
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue.trim() && regexArabicScript.test(node.nodeValue)) {
        textNodes.push(node);
      }
      regexArabicScript.lastIndex = 0;
    }
    return textNodes;
  };

  chrome.storage.sync.get(defaults, ({ textSize, lineHeight }) => {
    const fontSizeEm = toPercentage(textSize, defaults.textSize) / 100;
    const lineHeightEm = toPercentage(lineHeight, defaults.lineHeight) / 100;
    getTextNodes().forEach((node) => {
      replaceNodeWithHtml(
        node,
        node.nodeValue.replace(
          regexArabicScript,
          `<span class="ar" style="font-size:${fontSizeEm}em; line-height:${lineHeightEm}em;">$&</span>`
        )
      );
    });
  });
})();
