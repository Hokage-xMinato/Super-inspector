const mediaTypes = [
  '.mp4', '.webm', '.mp3', '.m3u8', '.ts', '.aac', '.mov',
  '.flv', '.wav', '.ogg', '.opus', '.mkv', '.avi'
];

// Track media files
chrome.webRequest.onCompleted.addListener(
  (details) => {
    const url = details.url.toLowerCase();
    if (mediaTypes.some(ext => url.includes(ext))) {
      chrome.storage.local.get({ mediaLinks: [] }, (data) => {
        const updated = [...new Set([...data.mediaLinks, url])];
        chrome.storage.local.set({ mediaLinks: updated });
      });
    }
  },
  { urls: ["<all_urls>"] },
  []
);

// Create right-click context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "super-inspect",
    title: "Inspect Element with Super Inspector",
    contexts: ["all"]
  });
  chrome.contextMenus.create({
    id: "copy-xpath",
    title: "Copy XPath of element",
    contexts: ["all"]
  });
  chrome.contextMenus.create({
    id: "copy-html",
    title: "Copy outerHTML of element",
    contexts: ["all"]
  });
});

// Handle menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab.id) return;

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: contextMenuHandler,
    args: [info.menuItemId]
  });
});

// Runs inside the tab
function contextMenuHandler(action) {
  const el = document.activeElement || document.querySelector(':hover');
  if (!el) return;

  if (action === "copy-xpath") {
    const xpath = getXPath(el);
    navigator.clipboard.writeText(xpath);
    alert("XPath copied:\n" + xpath);
  }

  if (action === "copy-html") {
    const html = el.outerHTML;
    navigator.clipboard.writeText(html);
    alert("outerHTML copied.");
  }

  if (action === "super-inspect") {
    el.style.outline = "3px dashed cyan";
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    alert("Element highlighted.");
  }

  function getXPath(el) {
    if (el.id) return '//*[@id="' + el.id + '"]';
    const parts = [];
    while (el && el.nodeType === 1) {
      let i = 1, sib = el.previousSibling;
      while (sib) {
        if (sib.nodeType === 1 && sib.nodeName === el.nodeName) i++;
        sib = sib.previousSibling;
      }
      parts.unshift(el.nodeName.toLowerCase() + "[" + i + "]");
      el = el.parentNode;
    }
    return "/" + parts.join("/");
  }
}
