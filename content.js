// Listen for context menu or popup messages
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "highlight") {
    const el = document.querySelector(msg.selector);
    if (el) {
      el.style.outline = "3px dashed cyan";
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  if (msg.action === "aiExplain") {
    const el = document.querySelector(msg.selector);
    if (el) {
      const tag = el.tagName.toLowerCase();
      const role = el.getAttribute("role");
      const classes = el.className;
      const summary = `This is a <${tag}> element${classes ? ` with class "${classes}"` : ""}${role ? `, role="${role}"` : ""}.`;
      alert("AI Explainer:\n" + summary);
    }
  }
});

// Highlight common accessibility issues
document.querySelectorAll("img:not([alt])").forEach(img => {
  img.style.border = "3px dashed orange";
  img.title = "Missing alt attribute";
});
