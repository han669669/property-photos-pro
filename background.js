// Background service worker for QuickEdit Pro Chrome Extension

chrome.action.onClicked.addListener((tab) => {
  // Open the extension in a new tab instead of popup for better UX
  chrome.tabs.create({
    url: chrome.runtime.getURL('index.html')
  });
});

// Handle installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Open welcome page on first install
    chrome.tabs.create({
      url: chrome.runtime.getURL('index.html')
    });
  }
});
