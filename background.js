const mediaTypes = [
  '.mp4', '.webm', '.mp3', '.m3u8', '.ts', '.aac', '.mov',
  '.flv', '.wav', '.ogg', '.opus', '.mkv', '.avi'
];

// Track media requests globally
chrome.webRequest.onCompleted.addListener(
  (details) => {
    const url = details.url.toLowerCase();
    if (mediaTypes.some(ext => url.includes(ext))) {
      console.log('[Media Sniffed]', url);

      // Send to popup or store it
      chrome.storage.local.get({ mediaLinks: [] }, (data) => {
        const updated = [...new Set([...data.mediaLinks, url])];
        chrome.storage.local.set({ mediaLinks: updated });
      });
    }
  },
  { urls: ["<all_urls>"] },
  []
);
