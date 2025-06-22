// Supercharged Inspector Logic

let currentHTML = "";

async function fetchSource() {
  const url = document.getElementById("urlInput").value;
  document.getElementById("sourceCode").textContent = "// Fetching...";
  try {
    const res = await fetch("https://api.allorigins.win/get?url=" + encodeURIComponent(url));
    const data = await res.json();
    currentHTML = data.contents;
    document.getElementById("sourceCode").textContent = currentHTML;
    Prism.highlightAll();
    logNetwork(currentHTML);
    summarizeTags(currentHTML);
    buildDOMTree(currentHTML);
  } catch (e) {
    document.getElementById("sourceCode").textContent = "// Error: " + e.message;
  }
}

function copySource() {
  navigator.clipboard.writeText(currentHTML).then(() => alert("Copied!"));
}

function extractFiles() {
  const doc = new DOMParser().parseFromString(currentHTML, "text/html");
  const output = document.getElementById("fileOutput");
  output.innerHTML = "<h3>🔎 Embedded Resources</h3>";
  const map = {
    Scripts: doc.querySelectorAll("script[src]"),
    Styles: doc.querySelectorAll("link[rel=stylesheet]"),
    IFrames: doc.querySelectorAll("iframe[src]"),
    InlineStyles: doc.querySelectorAll("style")
  };
  for (let key in map) {
    output.innerHTML += `<h4>${key}</h4><ul>` +
      Array.from(map[key]).map(el => {
        const ref = el.src || el.href || "[inline]";
        return `<li><code>${ref}</code></li>`;
      }).join("") + "</ul>";
  }
}

function listImages() {
  const doc = new DOMParser().parseFromString(currentHTML, "text/html");
  const imgs = doc.querySelectorAll("img");
  const output = document.getElementById("fileOutput");
  output.innerHTML += `<h3>🖼️ Images (${imgs.length})</h3><ul>` +
    Array.from(imgs).map(img => `<li><a href="${img.src}" target="_blank">${img.src}</a></li>`).join("") + "</ul>";
}

function scanMedia() {
  const doc = new DOMParser().parseFromString(currentHTML, "text/html");
  const media = doc.querySelectorAll("video, audio");
  const output = document.getElementById("fileOutput");
  output.innerHTML += `<h3>🎬 Media (${media.length})</h3>`;
  media.forEach((el, i) => {
    const sources = el.querySelectorAll("source");
    if (!el.src && sources.length === 0) return;
    output.innerHTML += `<h4>${el.tagName} ${i + 1}</h4><ul>`;
    if (el.src) output.innerHTML += renderMedia(el, el.src);
    sources.forEach(s => output.innerHTML += renderMedia(el, s.src));
    output.innerHTML += `</ul>`;
  });
}

function renderMedia(tag, src) {
  const safeSrc = src || "";
  return `<li><a href="${safeSrc}" target="_blank">${safeSrc}</a><br/>
    <${tag.tagName.toLowerCase()} src="${safeSrc}" controls width="300"></${tag.tagName.toLowerCase()}></li>`;
}

function analyzeMeta() {
  const doc = new DOMParser().parseFromString(currentHTML, "text/html");
  const metas = [...doc.querySelectorAll("meta")].map(m => m.outerHTML);
  const title = doc.querySelector("title")?.innerText || "No title";
  const output = document.getElementById("fileOutput");
  output.innerHTML += `<h3>🔍 Meta & SEO</h3><p><strong>Title:</strong> ${title}</p><ul>` +
    metas.map(m => `<li><code>${m}</code></li>`).join("") + "</ul>";
}

function scanAccessibility() {
  const doc = new DOMParser().parseFromString(currentHTML, "text/html");
  const issues = [];
  doc.querySelectorAll("img:not([alt])").forEach(img => issues.push(`<li>❗ Missing alt: ${img.outerHTML}</li>`));
  doc.querySelectorAll("a").forEach(a => {
    if (!a.textContent.trim()) issues.push(`<li>❗ Empty link: ${a.outerHTML}</li>`);
  });
  const output = document.getElementById("fileOutput");
  output.innerHTML += `<h3>♿ Accessibility</h3><ul>${issues.join("") || "<li>No issues found</li>"}</ul>`;
}

function estimateLoad() {
  const doc = new DOMParser().parseFromString(currentHTML, "text/html");
  const resources = [...doc.querySelectorAll("script[src],link[href],img[src]")];
  const urls = resources.map(r => r.src || r.href).filter(Boolean);
  const output = document.getElementById("fileOutput");
  output.innerHTML += `<h3>⏱ Load Estimator</h3><ul>${urls.map(u => `<li>${u}</li>`).join("")}</ul><p>Total assets: ${urls.length}</p>`;
}

function summarizeTags(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const tags = [...doc.querySelectorAll("*")].map(e => e.tagName.toLowerCase());
  const counts = tags.reduce((a, b) => (a[b] = (a[b] || 0) + 1, a), {});
  const summary = Object.entries(counts).map(([tag, count]) => `<li>${tag}: ${count}</li>`).join("");
  document.getElementById("fileOutput").innerHTML += `<h3>📊 Tag Summary</h3><ul>${summary}</ul>`;
}

function runJS() {
  const code = document.getElementById("jsInput").value;
  const out = document.getElementById("consoleOut");
  try {
    const result = new Function(code)();
    out.innerHTML += `> ${code}<br/>${result}<br/>`;
  } catch (e) {
    out.innerHTML += `> ${code}<br/><span style="color:red;">Error: ${e.message}</span><br/>`;
  }
  out.scrollTop = out.scrollHeight;
}

function autoScroll() {
  const iframe = document.getElementById("sandbox");
  iframe.srcdoc = currentHTML;
  iframe.style.display = "block";
  setTimeout(() => {
    const scroller = iframe.contentWindow;
    let times = 0;
    const interval = setInterval(() => {
      if (times++ > 10) return clearInterval(interval);
      scroller.scrollBy(0, 500);
    }, 1000);
  }, 500);
}

function runSelectorTest() {
  const input = document.getElementById("selectorInput").value;
  const result = document.getElementById("selectorResult");
  try {
    const doc = new DOMParser().parseFromString(currentHTML, "text/html");
    let matches = [];
    if (input.startsWith("/")) {
      const xpath = doc.evaluate(input, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      for (let i = 0; i < xpath.snapshotLength; i++) {
        matches.push(xpath.snapshotItem(i));
      }
    } else {
      matches = [...doc.querySelectorAll(input)];
    }
    result.innerHTML = `<p>Found ${matches.length} result(s)</p><ul>` +
      matches.map(m => `<li><code>${m.outerHTML.slice(0, 80).replace(/</g, "&lt;")}</code></li>`).join("") + "</ul>";
  } catch (e) {
    result.innerHTML = `<span style="color:red;">Error: ${e.message}</span>`;
  }
}

function buildDOMTree(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const container = document.getElementById("domTree");
  container.innerHTML = renderNode(doc.body);
}

function renderNode(node) {
  if (!node || node.nodeType !== 1) return "";
  const children = [...node.children].map(renderNode).join("");
  return `<details><summary>&lt;${node.tagName.toLowerCase()}&gt;</summary>${children}</details>`;
}

function logNetwork(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const assets = [...doc.querySelectorAll("script[src],link[href],img[src],iframe[src]")];
  const log = document.getElementById("networkLog");
  log.innerHTML = "<h3>📡 Resource Log</h3><ul>" +
    assets.map(a => `<li>${a.src || a.href}</li>`).join("") + "</ul>";
}

window.addEventListener("dragover", e => e.preventDefault());
window.addEventListener("drop", e => {
  e.preventDefault();
  const text = e.dataTransfer.getData("text");
  if (text.startsWith("http")) {
    document.getElementById("urlInput").value = text;
    fetchSource();
  }
});
