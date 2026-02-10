// Background service worker for Chrome extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('AI Job Agent extension installed');
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveJobs') {
    // Handle job saving logic
    sendResponse({ success: true });
  }
  return true;
});
